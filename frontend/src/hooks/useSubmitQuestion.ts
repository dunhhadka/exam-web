import { useSubmitPublishMutation } from '../services/api/questionApi'
import {
  AnswerCreateRequest,
  QuestionRequestInput,
  QuestionRequestSubmit,
  QuestionType,
} from '../types/question'
import { TrueFalseData } from '../pages/question/TrueFalse'
import { OneChoiceData } from '../pages/question/OneChoice'
import { MultiChoiceData } from '../pages/question/MultiChoice'

// Type definitions for better clarity
type SubmitResult = {
  isSubmitting: boolean
  submitQuestion: (
    type: QuestionType,
    formData: QuestionRequestInput
  ) => Promise<void>
}

// Utility function to parse form data to request format
const parseToRequest = (
  type: QuestionType,
  formData: QuestionRequestInput
): QuestionRequestSubmit | null => {
  switch (type) {
    case QuestionType.TRUE_FALSE: {
      const { data } = formData as { data: TrueFalseData }
      const correctAnswer = data.correctAnswer ?? false

      const answers: AnswerCreateRequest[] = [
        {
          orderIndex: 1,
          value: 'True',
          result: correctAnswer,
        },
        {
          orderIndex: 2,
          value: 'False',
          result: !correctAnswer,
        },
      ]

      return {
        ...formData,
        answers,
      }
    }
    case QuestionType.ONE_CHOICE: {
      const data = formData as { data: OneChoiceData }

      const correctAnswers = data.data.answers.filter(
        (answer) => answer.isCorrect
      )

      console.log('correctAnswers', correctAnswers)

      if (correctAnswers.length !== 1) {
        throw new Error('require one correct answer')
      }

      var correctAnswer = correctAnswers[0]

      return {
        ...formData,
        answers: data.data.answers.map(
          (item) =>
            ({
              orderIndex: item.orderIndex,
              value: item.label,
              result: item.orderIndex === correctAnswer.orderIndex,
              explanation: undefined,
            } as AnswerCreateRequest)
        ),
      }
    }
    case QuestionType.MULTI_CHOICE: {
      const data = formData as { data: MultiChoiceData }

      const correctAnswerIndexs = data.data.answers
        .filter((item) => item.isCorrect)
        .map((item) => item.orderIndex)

      return {
        ...formData,
        answers: data.data.answers.map(
          (item) =>
            ({
              orderIndex: item.orderIndex,
              value: item.label,
              result: correctAnswerIndexs.includes(item.orderIndex),
              explanation: undefined,
            } as AnswerCreateRequest)
        ),
      }
    }
    default:
      return null
  }
}

// Custom hook for submitting questions
export const useSubmitQuestion = (): SubmitResult => {
  const [submitPublish, { isLoading: isSubmitting }] =
    useSubmitPublishMutation()

  const submitQuestion = async (
    type: QuestionType,
    formData: QuestionRequestInput
  ) => {
    const request = parseToRequest(type, formData)
    if (!request) {
      throw new Error(`Unsupported question type: ${type}`)
    }

    try {
      await submitPublish(request).unwrap()
    } catch (error) {
      console.error('Failed to submit question:', error)
      throw error
    }
  }

  return {
    isSubmitting,
    submitQuestion,
  }
}

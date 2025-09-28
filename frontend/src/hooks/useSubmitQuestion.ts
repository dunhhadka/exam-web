import { useSubmitPublishMutation } from '../services/api/questionApi'
import {
  AnswerCreateRequest,
  QuestionRequestInput,
  QuestionRequestSubmit,
  QuestionType,
} from '../types/question'
import { TrueFalseData } from '../pages/question/TrueFalse'

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

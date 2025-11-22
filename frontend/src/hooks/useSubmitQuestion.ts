import {
  useSubmitPublishMutation,
  useUpdateQuestionMutation,
} from '../services/api/questionApi'
import {
  AnswerCreateRequest,
  QuestionRequestInput,
  QuestionRequestSubmit,
  QuestionType,
} from '../types/question'
import { EssayData } from '../pages/question/Essay'
import { TrueFalseData } from '../pages/question/TrueFalse'
import { OneChoiceData } from '../pages/question/OneChoice'
import { useToast } from './useToast'
import { MultiChoiceData } from '../pages/question/MultiChoice'
import { PlainTextData } from '../pages/question/PlainText'
import { TableChoiceData } from '../pages/question/TableChoice'
import { useNavigate } from 'react-router-dom'

// Type definitions for better clarity
type SubmitResult = {
  isSubmitting: boolean
  submitQuestion: (
    type: QuestionType,
    formData: QuestionRequestInput,
    questionId?: number
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
    case QuestionType.TABLE_CHOICE: {
      const data = formData as { data: TableChoiceData }

      console.log('TABLE_CHOICE submit data:', {
        headers: data.data.headers,
        rows: data.data.rows,
      })
      
      console.log('TABLE_CHOICE rows detail:', JSON.stringify(data.data.rows, null, 2))

      return {
        ...formData,
        headers: data.data.headers,
        rows: data.data.rows,
        answers: undefined, // TABLE_CHOICE doesn't use answers array
      }
    }
    case QuestionType.ESSAY: {
      const data = formData as { data: EssayData }

      return {
        ...formData,
        minWords: data.data.minWords,
        maxWords: data.data.maxWords,
        answerAnswer: data.data.answerAnswer,
        gradingCriteria: data.data.gradingCriteria,
        answers: undefined, // ESSAY doesn't use answers array
      }
    }
    case QuestionType.PLAIN_TEXT: {
      const data = formData as { data: PlainTextData }

      return {
        ...formData,
        expectedAnswer: data.data.expectedAnswer,
        caseSensitive: data.data.caseSensitive,
        exactMatch: data.data.exactMatch,
        answers: undefined, // PLAIN_TEXT doesn't use answers array
      }
    }
    default:
      return null
  }
}

// Custom hook for submitting questions
export const useSubmitQuestion = (): SubmitResult => {
  const navigate = useNavigate()
  const [submitPublish, { isLoading: isSubmitting }] =
    useSubmitPublishMutation()
  const toast = useToast()

  const [updateQuestion, { isLoading: isUpdateQuestionLoading }] =
    useUpdateQuestionMutation()

  const submitQuestion = async (
    type: QuestionType,
    formData: QuestionRequestInput,
    questionId?: number
  ) => {
    const request = parseToRequest(type, formData)
    if (!request) {
      throw new Error(`Unsupported question type: ${type}`)
    }

    if (questionId) {
      try {
        await updateQuestion({ id: questionId, request }).unwrap()
        toast.success('Cập nhật câu hỏi thành công')
        navigate('/questions')
      } catch (error) {
        console.error('Failed to submit question:', error)
      }
      return
    }

    try {
      await submitPublish(request).unwrap()
      toast.success('Xuất bản câu hỏi thành công')
      navigate('/questions')
    } catch (error) {
      console.error('Failed to submit question:', error)
    }
  }

  return {
    isSubmitting: isSubmitting || isUpdateQuestionLoading,
    submitQuestion,
  }
}

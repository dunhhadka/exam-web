import {
  Question,
  QuestionFilterRequest,
  QuestionRequestSubmit,
} from '../../types/question'
import { authenticatedApi } from './baseApi'

export const questionApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    submitPublish: builder.mutation<Question, QuestionRequestSubmit>({
      query: (request) => ({
        url: '/question/publish',
        method: 'POST',
        body: request,
      }),
    }),
    searchQuestion: builder.query<any, QuestionFilterRequest>({
      query: (request) => {
        // Chỉ lấy những key có giá trị != null
        const params = new URLSearchParams(
          Object.entries(request as unknown as Record<string, any>)
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, String(v)]) // ép tất cả về string
        ).toString()

        return {
          url: `/question/filter?${params}`,
          method: 'GET',
        }
      },
    }),
  }),
})

export const { useSubmitPublishMutation, useSearchQuestionQuery } = questionApi

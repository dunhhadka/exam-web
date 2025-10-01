import {
  Question,
  QuestionFilterRequest,
  QuestionRequestSubmit,
} from '../../types/question'
import { parseParamToString } from '../../utils/parseParam'
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
        return {
          url: `/question/filter?${parseParamToString(request)}`,
          method: 'GET',
        }
      },
    }),
  }),
})

export const { useSubmitPublishMutation, useSearchQuestionQuery } = questionApi

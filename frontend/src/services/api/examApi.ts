import { Exam, ExamRequest, ExamSearchRequest } from '../../types/exam'
import { parseParamToString } from '../../utils/parseParam'
import { authenticatedApi } from './baseApi'

export const examApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    searchExam: builder.query<any, ExamSearchRequest>({
      query: (request) => ({
        url: `exam/filter?${parseParamToString(request)}`,
        method: 'GET',
      }),
      providesTags: (result, error, arg) =>
        result?.data
          ? [
              ...result.data.map((exam: Exam) => ({
                type: 'Exam',
                id: exam.id,
              })),
              {
                type: 'Exam',
                id: 'LIST',
              },
            ]
          : [{ type: 'Exam', id: 'LIST' }],
    }),
    createExam: builder.mutation<Exam, ExamRequest>({
      query: (request) => ({
        url: 'exam/publish',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: [{ type: 'Exam', id: 'LIST' }],
    }),

    getExamById: builder.query<Exam, string>({
      query: (id) => ({
        url: `exam/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Exam', id }],
    }),
  }),
})

export const { useCreateExamMutation, useSearchExamQuery } = examApi

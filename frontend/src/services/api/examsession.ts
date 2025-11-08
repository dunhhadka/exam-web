import {
  ExamFilterRequest,
  ExamSession,
  ExamSessionRequest,
} from '../../types/examsession'
import { QuestionFilterRequest } from '../../types/question'
import { parseParamToString } from '../../utils/parseParam'
import { authenticatedApi } from './baseApi'

export const examSessionApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    createExamSession: builder.mutation<ExamSession, ExamSessionRequest>({
      query: (request) => ({
        url: '/exam-session',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: [{ type: 'ExamSession', id: 'LIST' }],
    }),
    filterExamSession: builder.query<
      { data: ExamSession[]; count: number },
      ExamFilterRequest
    >({
      queryFn: async (request, api, extraOptions, baseQuery) => {
        const [examSessionResult, countResult] = await Promise.all([
          baseQuery({
            url: `/exam-session/filter?${parseParamToString(request)}`,
            method: 'GET',
          }),
          baseQuery({
            url: `/exam-session/filter/count?${parseParamToString(request)}`,
            method: 'GET',
          }),
        ])

        return {
          data: {
            data: examSessionResult.data as ExamSession[],
            count: countResult.data as number,
          },
        }
      },
      providesTags(result, error, arg, meta) {
        return !result?.data
          ? [{ type: 'ExamSession' as const, id: 'LIST' }]
          : [
              ...(result.data ?? []).map((item: ExamSession) => ({
                type: 'ExamSession' as const,
                id: item.id,
              })),
              { type: 'ExamSession' as const, id: 'LIST' },
            ]
      },
    }),
    updateExamSession: builder.mutation<
      ExamSession,
      { id: number; request: ExamSessionRequest }
    >({
      query: (data) => ({
        url: `/exam-session/${data.id}`,
        method: 'PUT',
        body: data.request,
      }),
      invalidatesTags(result, error, arg, meta) {
        return result
          ? [{ type: 'ExamSession', id: result.id }]
          : [{ type: 'ExamSession', id: 'LIST' }]
      },
    }),
    deleteExamSession: builder.mutation<any, { id: number }>({
      query: (request) => ({
        url: `/exam-session/${request.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'ExamSession', id: 'LIST' }],
    }),
  }),
})

export const {
  useCreateExamSessionMutation,
  useFilterExamSessionQuery,
  useUpdateExamSessionMutation,
  useDeleteExamSessionMutation,
} = examSessionApi

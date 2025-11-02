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
    filterExamSession: builder.query<ExamSession[], ExamFilterRequest>({
      query: (request) => ({
        url: `/exam-session/filter?${parseParamToString(request)}`,
        method: 'GET',
      }),
      providesTags(result, error, arg, meta) {
        return !result
          ? [{ type: 'ExamSession' as const, id: 'LIST' }]
          : [
              ...(result ?? []).map((item: ExamSession) => ({
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

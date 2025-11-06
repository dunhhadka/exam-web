import { Exam, ExamRequest, ExamSearchRequest } from '../../types/exam'
import { parseParamToString } from '../../utils/parseParam'
import { authenticatedApi } from './baseApi'

export const examApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    searchExam: builder.query<
      { data: Exam[]; count: number },
      ExamSearchRequest
    >({
      queryFn: async (request, api, extraOptions, baseQuery) => {
        const [examResult, countResult] = await Promise.all([
          baseQuery({
            url: `/exam/filter?${parseParamToString(request)}`,
            method: 'GET',
          }),
          baseQuery({
            url: `/exam/filter/count?${parseParamToString(request)}`,
            method: 'GET',
          }),
        ])

        return {
          data: {
            data: examResult.data as Exam[],
            count: countResult.data as number,
          },
        }
      },
      providesTags: (result) =>
        result && result?.data?.length > 0
          ? [
              ...result.data.map((exam) => ({
                type: 'Exam' as const,
                id: exam.id,
              })),
              { type: 'Exam' as const, id: 'LIST' },
              { type: 'Exam' as const, id: 'COUNT' },
            ]
          : [
              { type: 'Exam' as const, id: 'LIST' },
              { type: 'Exam' as const, id: 'COUNT' },
            ],
    }),

    createExam: builder.mutation<Exam, ExamRequest>({
      query: (request) => ({
        url: 'exam/publish',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: [{ type: 'Exam' as const, id: 'LIST' }],
    }),

    getExamById: builder.query<Exam, string>({
      query: (id) => ({
        url: `exam/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Exam' as const, id }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateExamMutation,
  useSearchExamQuery,
  useLazySearchExamQuery,
  useGetExamByIdQuery,
} = examApi

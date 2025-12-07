import { Exam, ExamRequest, ExamSearchRequest } from '../../types/exam'
import { parseParamToString } from '../../utils/parseParam'
import { authenticatedApi } from './baseApi'

// Helper function to map backend response to Exam type
const mapExamResponse = (data: any): Exam => {
  return {
    ...data,
    isPublic: data.isPublic !== undefined ? data.isPublic : data.public,
  }
}

const mapExamsResponse = (data: any[]): Exam[] => {
  return data.map(mapExamResponse)
}

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
            data: mapExamsResponse(examResult.data as any[]),
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
      transformResponse: (response: any) => mapExamResponse(response),
      invalidatesTags: [{ type: 'Exam' as const, id: 'LIST' }],
    }),

    getExamById: builder.query<Exam, string>({
      query: (id) => ({
        url: `exam/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => mapExamResponse(response),
      providesTags: (result, error, id) => [{ type: 'Exam' as const, id }],
      keepUnusedDataFor: 0,
    }),

    updateExam: builder.mutation<Exam, { id: string; request: ExamRequest }>({
      query: ({ id, request }) => ({
        url: `exam/update/${id}`,
        method: 'PUT',
        body: request,
      }),
      transformResponse: (response: any) => mapExamResponse(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Exam' as const, id },
        { type: 'Exam' as const, id: 'LIST' },
      ],
    }),

    deleteExam: builder.mutation<boolean, { ids: number[] }>({
      query: ({ ids }) => ({
        url: 'exam/delete',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Exam' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useSearchExamQuery,
  useLazySearchExamQuery,
  useGetExamByIdQuery,
} = examApi

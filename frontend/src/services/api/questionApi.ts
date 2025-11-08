import {
  Question,
  QuestionFilterRequest,
  QuestionRequestSubmit,
  Tag,
  TagRequest,
  TagSearchRequest,
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
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
    updateQuestion: builder.mutation<
      Question,
      { id: number; request: QuestionRequestSubmit }
    >({
      query: (data) => ({
        url: `/question/${data.id}`,
        method: 'PUT',
        body: data.request,
      }),
      invalidatesTags(result, error, arg, meta) {
        return [{ id: result?.id, type: 'Question' }]
      },
    }),

    searchQuestion: builder.query<
      { data: Question[]; count: number },
      QuestionFilterRequest
    >({
      queryFn: async (request, api, extraOptions, baseQuery) => {
        // Gọi song song 2 API
        const [questionsResult, countResult] = await Promise.all([
          baseQuery({
            url: `/question/filter?${parseParamToString(request)}`,
            method: 'GET',
          }),
          baseQuery({
            url: `/question/filter/count?${parseParamToString(request)}`,
            method: 'GET',
          }),
        ])

        return {
          data: {
            data: questionsResult.data as Question[],
            count: countResult.data as number,
          },
        }
      },
      providesTags: (result) => {
        return result?.data
          ? [
              ...result.data.map((item: Question) => ({
                type: 'Question' as const,
                id: item.id,
              })),
              { type: 'Question' as const, id: 'LIST' },
              { type: 'Question' as const, id: 'COUNT' },
            ]
          : [
              { type: 'Question' as const, id: 'LIST' },
              { type: 'Question' as const, id: 'COUNT' },
            ]
      },
    }),

    searchTags: builder.query<Tag[], TagSearchRequest>({
      query: (request) => ({
        url: `/tag/search?${parseParamToString(request)}`,
        method: 'GET',
      }),
      providesTags(result) {
        return result
          ? [
              ...result.map((item: Tag) => ({
                type: 'Tag' as const,
                id: item.id,
              })),
              { type: 'Tag' as const, id: 'LIST' },
            ]
          : [{ type: 'Tag' as const, id: 'LIST' }]
      },
    }),

    createTag: builder.mutation<Tag, TagRequest>({
      query: (request) => ({
        url: '/tag/create',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: [{ type: 'Tag', id: 'LIST' }],
    }),

    deleteQuestion: builder.mutation<any, { questionId: number }>({
      query: (request) => ({
        url: `/question/${request.questionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),

    findById: builder.query<Question, { questionId: number }>({
      query: (request) => ({
        url: `/question/${request.questionId}`,
        method: 'GET',
      }),
      providesTags: (result, error, arg) => [
        { type: 'Question', id: arg.questionId },
      ],
    }),
  }),
})

export const {
  useSubmitPublishMutation,
  useSearchQuestionQuery,
  useSearchTagsQuery,
  useCreateTagMutation,
  useDeleteQuestionMutation,
  useFindByIdQuery,
  useLazyFindByIdQuery,
  useUpdateQuestionMutation,
} = questionApi

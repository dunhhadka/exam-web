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

    importQuestions: builder.mutation<any, { fileData: string }>({
      query: (request) => ({
        url: '/question/import',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),

    downloadTemplate: builder.mutation<void, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        try {
          // QUAN TRỌNG: responseHandler trả về Promise<Blob>
          const response = await fetch('/api/question/template/download', {
            method: 'GET',
            headers: {
              Accept:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          })

          console.log('Response status:', response.status)
          console.log('Response ok:', response.ok)

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const blob = await response.blob()

          console.log('Blob received:', blob)
          console.log('Blob size:', blob.size)
          console.log('Blob type:', blob.type)

          if (!blob || blob.size === 0) {
            return { error: { status: 'CUSTOM_ERROR', error: 'File rỗng' } }
          }

          // Download file
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'import_question_template.xlsx'
          document.body.appendChild(link)
          link.click()

          setTimeout(() => {
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
          }, 100)

          return { data: undefined }
        } catch (error) {
          console.error('Download error:', error)
          return {
            error: {
              status: 'FETCH_ERROR',
              error: String(error),
            },
          }
        }
      },
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
  useImportQuestionsMutation,
  useDownloadTemplateMutation,
} = questionApi

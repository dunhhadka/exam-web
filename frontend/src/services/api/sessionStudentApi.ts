import { createApi } from '@reduxjs/toolkit/query/react'
import { authenticatedApi } from './baseApi'
import { ApiResponse } from '../../types/common'
import { SessionStudentPreviewResponse } from '../../types/sessionStudent'

export const sessionStudentApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    previewSessionStudents: builder.mutation<
      SessionStudentPreviewResponse,
      { file: File; sessionId?: number }
    >({
      query: ({ file, sessionId }) => {
        const formData = new FormData()
        formData.append('file', file)

        return {
          url: sessionId
            ? `/session-students/preview/session/${sessionId}`
            : '/session-students/preview',
          method: 'POST',
          body: formData,
        }
      },
      transformResponse: (response: any) => {
        if (response && typeof response === 'object') {
          if ('data' in response && response.data !== undefined) {
            return response.data
          }
          return response
        }
        return response
      },
    }),

    addAvatar: builder.mutation<
      ApiResponse<void>,
      { sessionStudentId: number; file: File }
    >({
      query: ({ sessionStudentId, file }) => {
        const formData = new FormData()
        formData.append('file', file)

        return {
          url: `/session-students/${sessionStudentId}/avatars`,
          method: 'POST',
          body: formData,
        }
      },
    }),

    removeAvatar: builder.mutation<
      ApiResponse<void>,
      { sessionStudentId: number; index: number }
    >({
      query: ({ sessionStudentId, index }) => ({
        url: `/session-students/${sessionStudentId}/avatars/${index}`,
        method: 'DELETE',
      }),
    }),

    replaceAvatar: builder.mutation<
      ApiResponse<void>,
      { sessionStudentId: number; index: number; file: File }
    >({
      query: ({ sessionStudentId, index, file }) => {
        const formData = new FormData()
        formData.append('file', file)

        return {
          url: `/session-students/${sessionStudentId}/avatars/${index}`,
          method: 'PUT',
          body: formData,
        }
      },
    }),
  }),
})

export const {
  usePreviewSessionStudentsMutation,
  useAddAvatarMutation,
  useRemoveAvatarMutation,
  useReplaceAvatarMutation,
} = sessionStudentApi

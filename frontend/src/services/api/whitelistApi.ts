import { authenticatedApi } from './baseApi'
import { WhitelistPreviewResponse } from '../../types/whitelist'

interface PreviewWhitelistArgs {
  file: File
  sessionId?: number
}

export const whitelistApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    previewWhitelist: builder.mutation<WhitelistPreviewResponse, PreviewWhitelistArgs>({
      query: ({ file, sessionId }) => {
        const formData = new FormData()
        formData.append('file', file)

        return {
          url: sessionId
            ? `/whitelist/preview/session/${sessionId}`
            : '/whitelist/preview',
          method: 'POST',
          body: formData,
        }
      },
    }),
  }),
})

export const { usePreviewWhitelistMutation } = whitelistApi

import { createApi } from '@reduxjs/toolkit/query/react'
import {
  authenticatedBaseQuery,
  publicBaseQuery,
} from '../../store/slices/baseQueries'

export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: async (args, api, extraOptions) => {
    const result = await publicBaseQuery(args, api, extraOptions)

    if (result.data) {
      const apiResponse = result.data as any
      if (!apiResponse.success) {
        return {
          error: {
            status: apiResponse.code,
            data: apiResponse,
          },
        }
      }

      return { data: apiResponse.data }
    }

    return result
  },
  endpoints: () => ({}),
})

export const authenticatedApi = createApi({
  reducerPath: 'authenticatedApi',
  baseQuery: authenticatedBaseQuery,
  tagTypes: ['User', 'Exam', 'Question', 'Result', 'Tag'],
  endpoints: () => ({}),
})

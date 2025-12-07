import { createApi } from '@reduxjs/toolkit/query/react'
import {
  authenticatedBaseQuery,
  publicBaseQuery,
} from '../../store/slices/baseQueries'

export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: async (args, api, extraOptions) => {
    return await publicBaseQuery(args, api, extraOptions)
  },
  endpoints: () => ({}),
})

export const authenticatedApi = createApi({
  reducerPath: 'authenticatedApi',
  baseQuery: authenticatedBaseQuery,
  tagTypes: [
    'User',
    'Exam',
    'Question',
    'Result',
    'Tag',
    'ExamSession',
    'Attempt',
    'Profile',
  ],
  endpoints: () => ({}),
})

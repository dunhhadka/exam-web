import { User } from '../../types/user'
import { authenticatedApi } from './baseApi'
import { ApiResponse } from '../../types/common'

interface SearchStudentsParams {
  keyword?: string
  page?: number
  size?: number
}

interface PagingResponse<T> {
  data: T[]
  pageIndex: number
  pageSize: number
  total: number
  totalPages: number
  success: boolean
  code: number
  message: string
  timestamp: string
}

export const userApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<User, void>({
      query: () => '/account/profile',
      providesTags: ['User'],
    }),
    searchStudents: builder.query<PagingResponse<User>, SearchStudentsParams>({
      query: (params) => ({
        url: '/users/search',
        params: {
          keyword: params.keyword,
          role: 'STUDENT',
          page: params.page || 0,
          size: params.size || 20,
        },
      }),
    }),
  }),
})

export const { useGetProfileQuery, useSearchStudentsQuery, useLazySearchStudentsQuery } = userApi

import { User } from '../../types/user'
import { authenticatedApi } from './baseApi'

export const userApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<User, void>({
      query: () => '/account/profile',
      providesTags: ['User'],
    }),
  }),
})

export const { useGetProfileQuery } = userApi

import { UserProfile } from '../../types/auth'
import { authenticatedApi } from './baseApi'

export const profileApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<UserProfile, void>({
      query: () => ({
        url: '/account/profile',
        method: 'GET',
      }),
      providesTags: (result) => (result ? [{ type: 'User', id: 'LIST' }] : []),
    }),
  }),
})

export const { useGetProfileQuery } = profileApi

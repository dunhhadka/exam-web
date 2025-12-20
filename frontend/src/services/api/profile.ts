import { UserProfile } from '../../types/auth'
import { authenticatedApi } from './baseApi'

export const profileApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<UserProfile, number>({
      // NOTE: the argument is a cache-buster (e.g. authEpoch). It is not sent to the server.
      query: () => ({
        url: '/account/profile',
        method: 'GET',
      }),
      providesTags: (result) => (result ? [{ type: 'User', id: 'LIST' }] : []),
    }),
  }),
})

export const { useGetProfileQuery, useLazyGetProfileQuery } = profileApi

import { Profile } from '../../types/auth'
import { authenticatedApi } from './baseApi'

export const accountApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<Profile, void>({
      query: () => ({
        url: '/account/profile',
        method: 'GET',
      }),
      providesTags: [{ type: 'Profile' as const, id: 'CURRENT' }],
    }),
  }),
})

export const { useLazyGetProfileQuery } = accountApi

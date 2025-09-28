import {
  LoginResponse,
  LoginTransformedRequest,
  RegisterTransformedRequest,
} from '../../types/auth'
import { publicApi } from './baseApi'

export const authApi = publicApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginTransformedRequest>({
      query: (credentials) => ({
        url: '/account/authenticate',
        method: 'POST',
        body: credentials,
      }),
    }),

    register: builder.mutation<any, RegisterTransformedRequest>({
      query: (userData) => ({
        url: '/account/register',
        method: 'POST',
        body: userData,
      }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation } = authApi

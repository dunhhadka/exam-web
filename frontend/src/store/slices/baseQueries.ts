import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query'
import { RootState } from '..'
import { ApiResponse } from '../../types/common'
import { TokenManager } from '../../utils/tokenManager'
import { logout, setRefreshing, updateTokens } from './authSlice'

export const BASE_URL = 'http://localhost:8081/api'

const transformResponse = (result: any) => {
  if (result.data) {
    const apiResponse: ApiResponse = result.data as ApiResponse

    console.log('Raw BE Response: ', apiResponse)

    if (!apiResponse.success) {
      return {
        error: {
          status: apiResponse.code || 400,
          data: {
            success: apiResponse.success,
            code: apiResponse.code,
            message: apiResponse.message,
            timestamp: apiResponse.timestamp,
            status: apiResponse.status,
          },
        } as FetchBaseQueryError,
      }
    }

    return { data: apiResponse.data }
  }

  return result
}

const basePublicQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json')
    return headers
  },
})

export const publicBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await basePublicQuery(args, api, extraOptions)

  return transformResponse(result)
}

export const authenticatedBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const state = api.getState() as RootState
  const tokenManager = TokenManager.getInstance()

  let accessToken = state.auth.accessToken

  if (accessToken && tokenManager.shouldRefreshToken(accessToken)) {
    let refreshPromise = tokenManager.getRefreshPromise()

    if (!refreshPromise && !state.auth.isRefreshing) {
      // Start token refresh
      api.dispatch(setRefreshing(true))

      refreshPromise = new Promise<string>(async (resolve, reject) => {
        try {
          const refreshToken = state.auth.refreshToken
          if (!refreshToken) {
            throw new Error('No refresh token')
          }

          const refreshResult = await publicBaseQuery(
            {
              url: '/auth/account/refresh-token',
              method: 'POST',
              body: {
                refreshToken,
              },
            },
            api,
            extraOptions
          )

          if (refreshResult.error) {
            throw new Error('Refresh failed')
          }

          const refreshResponse = refreshResult.data as ApiResponse<{
            accessToken: string
            refreshToken: string
          }>

          api.dispatch(
            updateTokens({
              accessToken: refreshResponse.data.accessToken,
              refreshToken: refreshResponse.data.refreshToken,
            })
          )

          resolve(refreshResponse.data.accessToken)
        } catch (error) {
          api.dispatch(logout())
          reject(error)
        } finally {
          api.dispatch(setRefreshing(false))
          tokenManager.clearRefreshPromise()
        }
      })

      tokenManager.setRefreshPromise(refreshPromise)
    }

    if (refreshPromise) {
      try {
        accessToken = await refreshPromise
      } catch {
        // Token refresh failed, redirect to login will be handled by logout action
        return {
          error: {
            status: 401,
            data: {
              message: 'Authentication failed',
            },
          } as FetchBaseQueryError,
        }
      }
    }
  }

  if (!accessToken || tokenManager.isTokenExpired(accessToken)) {
    return {
      error: {
        status: 401,
        data: {
          message: 'Token expired',
        },
      } as FetchBaseQueryError,
    }
  }

  const rawBaseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Authorization', `Bearer ${accessToken}`)
      return headers
    },
  })

  const result = await rawBaseQuery(args, api, extraOptions)

  return transformResponse(result)
}

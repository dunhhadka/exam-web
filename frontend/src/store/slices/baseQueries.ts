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
import { getToastInstance } from '../../ToastProvider'

export const BASE_URL = 'http://localhost:1111/api'

const showNotification = (
  type: 'error' | 'success' | 'warning' | 'info',
  message: string,
  description?: string
) => {
  const toast = getToastInstance()

  if (toast) {
    toast[type](message, description || '', 3)
  } else {
    console.warn('[Toast not ready]', type, message, description)
  }
}

const transformResponse = (result: any) => {
  if (result.error) {
    const errorData = result.error.data

    showNotification('error', errorData?.message || 'Có lỗi xảy ra')

    return result
  }

  if (result.data) {
    const apiResponse: ApiResponse = result.data as ApiResponse

    if (!apiResponse.success) {
      console.log('Raw BE Response: ', apiResponse)

      showNotification('error', apiResponse.message || 'Có lỗi xảy ra', '')

      return {
        error: {
          status: apiResponse.code || 400,
          data: apiResponse,
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

  if (!accessToken) {
    const error = {
      status: 401,
      data: {
        message: 'Vui lòng đăng nhập',
      },
    } as FetchBaseQueryError

    showNotification(
      'error',
      'Chưa đăng nhập',
      'Vui lòng đăng nhập để tiếp tục'
    )

    return { error }
  }

  // Handle token refresh
  if (tokenManager.shouldRefreshToken(accessToken)) {
    let refreshPromise = tokenManager.getRefreshPromise()

    if (!refreshPromise && !state.auth.isRefreshing) {
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
          showNotification(
            'error',
            'Phiên đăng nhập hết hạn',
            'Vui lòng đăng nhập lại'
          )
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

  if (tokenManager.isTokenExpired(accessToken)) {
    showNotification('error', 'Token hết hạn', 'Vui lòng đăng nhập lại')

    api.dispatch(logout())

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
  })

  let requestArgs: string | FetchArgs = args

  if (typeof args === 'string') {
    requestArgs = {
      url: args,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  } else {
    const isFormData = args.body instanceof FormData
    const headers = new Headers(args.headers as HeadersInit | undefined)

    headers.set('Authorization', `Bearer ${accessToken}`)

    if (!isFormData) {
      headers.set('Content-Type', 'application/json')
    } else {
      headers.delete('Content-Type')
    }

    requestArgs = {
      ...args,
      headers,
    }
  }

  const result = await rawBaseQuery(requestArgs, api, extraOptions)

  return transformResponse(result)
}

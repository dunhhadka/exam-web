import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../../types/user'
import { Profile } from '../../types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isRefreshing: boolean
  profile?: Profile
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refetchToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isRefreshing: false,
  profile: undefined,
}

const authSlide = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string
        refreshToken: string
      }>
    ) => {
      const { accessToken, refreshToken } = action.payload
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.isAuthenticated = true

      console.log(accessToken, refreshToken)

      // set to LocalStorage
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.isRefreshing = false
      state.profile = undefined

      // remove from LocalStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userProfile')
    },

    updateTokens: (
      state,
      action: PayloadAction<{
        accessToken: string
        refreshToken: string
      }>
    ) => {
      const { accessToken, refreshToken } = action.payload
      state.accessToken = accessToken
      state.refreshToken = refreshToken

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    },

    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload

      localStorage.setItem('userProfile', JSON.stringify(action.payload))
    },

    loadProfileFromStorage: (state) => {
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        state.profile = JSON.parse(savedProfile)
      }
    },
  },
})

export const {
  login,
  setCredentials,
  logout,
  setRefreshing,
  updateTokens,
  setProfile,
  loadProfileFromStorage,
} = authSlide.actions
export default authSlide.reducer

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../../types/user'

interface AuthState {
  user: User | null
  token: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
}

const authSlide = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
    },
  },
})

export const { login } = authSlide.actions
export default authSlide.reducer

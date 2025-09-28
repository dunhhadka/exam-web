import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer from './slices/authSlice'
import { authApi } from '../services/api/authApi'
import { authenticatedApi, publicApi } from '../services/api/baseApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [publicApi.reducerPath]: publicApi.reducer,
    [authenticatedApi.reducerPath]: authenticatedApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      publicApi.middleware,
      authenticatedApi.middleware
    ),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

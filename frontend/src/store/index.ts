import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer from './slices/authSlice'
import takeExamReducer from './slices/takeExamSlice'
import { authenticatedApi, publicApi } from '../services/api/baseApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    takeExam: takeExamReducer,
    [publicApi.reducerPath]: publicApi.reducer,
    [authenticatedApi.reducerPath]: authenticatedApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore MediaStream trong systemCheck.mediaStream vì nó không serialize được
        ignoredActions: ['takeExam/setMediaStream'],
        ignoredPaths: ['takeExam.systemCheck.mediaStream'],
      },
    }).concat(publicApi.middleware, authenticatedApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

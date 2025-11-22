import {
  AttemptDetailResponse,
  JoinByCodeRequest,
  JoinSessionMetaResponse,
  OtpRequest,
  SessionInfoResponse,
  SessionTokenResponse,
  StartAttemptRequest,
  SubmitAttemptRequest,
  VerifyOtpRequest,
} from '../../types/take-exam'
import { publicApi } from './baseApi'

const takeExamApi = publicApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessionInfo: builder.query<SessionInfoResponse, string>({
      query: (code) => ({
        url: `/join/session-info/${code}`,
        method: 'GET',
      }),
    }),
    joinExamByCode: builder.mutation<
      JoinSessionMetaResponse,
      JoinByCodeRequest
    >({
      query: (request) => ({
        url: '/join/by-code',
        method: 'POST',
        body: request,
      }),
    }),
    requestOtp: builder.mutation<any, OtpRequest>({
      query: (request) => ({
        url: '/join/otp/request',
        method: 'POST',
        body: request,
      }),
    }),
    verifyOtp: builder.mutation<SessionTokenResponse, VerifyOtpRequest>({
      query: (request) => ({
        url: '/join/otp/verify',
        method: 'POST',
        body: request,
      }),
    }),
    resendOtp: builder.mutation<any, OtpRequest>({
      query: (request) => ({
        url: '/join/otp/resend',
        method: 'POST',
        body: request,
      }),
    }),
    startExamAttempt: builder.mutation<
      AttemptDetailResponse,
      StartAttemptRequest
    >({
      query: (request) => ({
        url: '/exam-attempt',
        method: 'POST',
        body: request,
      }),
    }),
    submitAttempt: builder.mutation<
      AttemptDetailResponse,
      { attemptId: number; request: SubmitAttemptRequest; sessionToken: string }
    >({
      query: ({ attemptId, request, sessionToken }) => ({
        method: 'PUT',
        url: `/exam-attempt/${attemptId}`,
        body: request,
        headers: {
          'X-Session-Token': sessionToken,
        },
      }),
    }),
    incrementFullscreenExitCount: builder.mutation<void, number>({
      query: (attemptId) => ({
        method: 'POST',
        url: `/exam-attempt/${attemptId}/fullscreen-exit`,
      }),
    }),
  }),
})

export const {
  useGetSessionInfoQuery,
  useLazyGetSessionInfoQuery,
  useJoinExamByCodeMutation,
  useRequestOtpMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
  useStartExamAttemptMutation,
  useSubmitAttemptMutation,
  useIncrementFullscreenExitCountMutation,
} = takeExamApi

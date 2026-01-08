import {
  AttemptGradingResponse,
  AttemptListResponse,
  ManualGradingRequest,
} from '../../types/attempt'
import { authenticatedApi } from './baseApi'

export const attemptApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy danh sách attempts theo sessionId
    getAttemptsBySession: builder.query<AttemptListResponse[], number>({
      query: (sessionId) => ({
        url: `/exam-attempt/session/${sessionId}`,
        method: 'GET',
      }),
      providesTags: (result, error, sessionId) =>
        result
          ? [
              ...result.map((attempt) => ({
                type: 'Attempt' as const,
                id: attempt.attemptId,
              })),
              { type: 'Attempt' as const, id: `SESSION-${sessionId}` },
            ]
          : [{ type: 'Attempt' as const, id: `SESSION-${sessionId}` }],
    }),

    getAttemptForGrading: builder.query<AttemptGradingResponse, number>({
      query: (attemptId) => ({
        url: `/exam-attempt/${attemptId}/grading`,
        method: 'GET',
      }),
      providesTags: (result, error, attemptId) => [
        { type: 'Attempt' as const, id: attemptId },
      ],
    }),

    manualGrading: builder.mutation<
      void,
      { attemptId: number; request: ManualGradingRequest }
    >({
      query: ({ attemptId, request }) => ({
        url: `/exam-attempt/${attemptId}/grading`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: (result, error, { attemptId }) => [
        { type: 'Attempt' as const, id: attemptId },
      ],
    }),

    sendResultNotifications: builder.mutation<void, number>({
      query: (sessionId) => ({
        url: `/exam-attempt/session/${sessionId}/send-result-notifications`,
        method: 'POST',
      }),
    }),

    sendResultNotificationForAttempt: builder.mutation<void, { attemptId: number; sessionId: number }>({
      query: ({ attemptId }) => ({
        url: `/exam-attempt/${attemptId}/send-result-notification`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { attemptId, sessionId }) => [
        { type: 'Attempt' as const, id: attemptId },
        { type: 'EmailNotification' as const, id: `SESSION-${sessionId}` },
      ],
    }),
  }),
})

export const {
  useGetAttemptsBySessionQuery,
  useGetAttemptForGradingQuery,
  useManualGradingMutation,
  useSendResultNotificationsMutation,
  useSendResultNotificationForAttemptMutation,
} = attemptApi

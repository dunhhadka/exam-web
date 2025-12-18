import { authenticatedApi } from './baseApi'

export interface EmailNotification {
  emailId: number
  attemptId: number
  studentEmail: string
  studentName: string | null
  subject: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  retryCount: number
  createdAt: string
  updatedAt: string
}

export const emailNotificationApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmailNotificationsBySession: builder.query<EmailNotification[], number>({
      query: (sessionId) => ({
        url: `/email-notifications/session/${sessionId}`,
        method: 'GET',
      }),
      providesTags: (result, error, sessionId) =>
        result
          ? [
              ...result.map((email) => ({
                type: 'EmailNotification' as const,
                id: email.emailId,
              })),
              { type: 'EmailNotification' as const, id: `SESSION-${sessionId}` },
            ]
          : [{ type: 'EmailNotification' as const, id: `SESSION-${sessionId}` }],
    }),
  }),
})

export const {
  useGetEmailNotificationsBySessionQuery,
} = emailNotificationApi


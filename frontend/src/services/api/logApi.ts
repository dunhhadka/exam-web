import { publicApi } from './baseApi'

export interface CreateLogRequest {
  attemptId: number
  logType: 'DEVTOOLS_OPEN' | 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'COPY_PASTE_ATTEMPT' | 'SUSPICIOUS_ACTIVITY' | 'OTHER'
  severity?: 'INFO' | 'WARNING' | 'SERIOUS' | 'CRITICAL'
  message?: string
  evidence?: string
}

export interface Log {
  id: number
  attemptId: number
  sessionId: number
  studentEmail: string
  logType: string
  severity: string
  message: string
  evidence?: string
  loggedAt: string
  attemptStartedAt: string
  attemptSubmittedAt?: string
}

export const logApi = publicApi.injectEndpoints({
  endpoints: (builder) => ({
    createLog: builder.mutation<Log, CreateLogRequest>({
      query: (data) => ({
        url: '/logs',
        method: 'POST',
        body: data,
      }),
    }),
    getLogsByAttemptId: builder.query<Log[], number>({
      query: (attemptId) => `/logs/attempt/${attemptId}`,
    }),
    getLogsBySessionId: builder.query<Log[], number>({
      query: (sessionId) => `/logs/session/${sessionId}`,
    }),
    getLogsBySessionIdAndStudentEmail: builder.query<Log[], { sessionId: number; email: string }>({
      query: ({ sessionId, email }) => `/logs/session/${sessionId}/student/${encodeURIComponent(email)}`,
    }),
    getLogsGroupedByAttempt: builder.query<AttemptWithLogs[], { sessionId: number; email: string }>({
      query: ({ sessionId, email }) => `/logs/session/${sessionId}/student/${encodeURIComponent(email)}/grouped`,
    }),
  }),
})

export interface AttemptWithLogs {
  attemptId: number
  attemptNo: number
  attemptStartedAt: string
  attemptSubmittedAt?: string
  status: string
  logs: Log[]
}

export const {
  useCreateLogMutation,
  useGetLogsByAttemptIdQuery,
  useGetLogsBySessionIdQuery,
  useGetLogsBySessionIdAndStudentEmailQuery,
  useGetLogsGroupedByAttemptQuery,
} = logApi

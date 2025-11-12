import { parseParamToString } from '../../utils/parseParam'
import { authenticatedApi } from './baseApi'
import { SessionUserFilterRequest, SessionUserResponse, SessionStats } from '../../types/session-user'

export const sessionUserApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get session stats (code, dates, total students)
    getSessionStats: builder.query<SessionStats, number>({
      query: (sessionId) => ({
        url: `/exam-session/${sessionId}/stats`,
        method: 'GET',
      }),
      providesTags: (result, error, sessionId) => [
        { type: 'ExamSession', id: sessionId },
      ],
    }),

    // Get users in session with filters
    getSessionUsers: builder.query<SessionUserResponse, SessionUserFilterRequest>({
      query: ({ sessionId, ...params }) => ({
        url: `/exam-session/${sessionId}/users?${parseParamToString(params)}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        // Nếu response là array, backend không trả đúng PageDTO
        if (Array.isArray(response)) {
          return {
            data: response,
            pageIndex: 0,
            pageSize: response.length,
            total: response.length,
            totalPages: 1
          }
        }
        
        // Nếu là PageDTO đúng format
        return response
      },
      providesTags: (result, error, { sessionId }) => [
        { type: 'ExamSession', id: sessionId },
        { type: 'ExamSession', id: 'USER_LIST' },
      ],
    }),

    // Update user role (optional - for future use)
    updateUserRole: builder.mutation<void, { sessionId: number; userId: number; role: string }>({
      query: ({ sessionId, userId, role }) => ({
        url: `/exam-session/${sessionId}/users/${userId}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: 'ExamSession', id: sessionId },
        { type: 'ExamSession', id: 'USER_LIST' },
      ],
    }),

    // Delete user from session (optional - for future use)
    removeUserFromSession: builder.mutation<void, { sessionId: number; userId: number }>({
      query: ({ sessionId, userId }) => ({
        url: `/exam-session/${sessionId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: 'ExamSession', id: sessionId },
        { type: 'ExamSession', id: 'USER_LIST' },
      ],
    }),
  }),
})

export const {
  useGetSessionStatsQuery,
  useGetSessionUsersQuery,
  useUpdateUserRoleMutation,
  useRemoveUserFromSessionMutation,
} = sessionUserApi

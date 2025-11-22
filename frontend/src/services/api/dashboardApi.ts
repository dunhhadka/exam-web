import { authenticatedApi } from './baseApi'

export interface DashboardStats {
  totalExams: number
  totalStudents: number
  averageScore: number
  averageTime: number
  cheatingRate: number
  scoreDistribution: {
    range: string
    count: number
  }[]
  attemptStatusDistribution: {
    status: string
    count: number
  }[]
  attemptsOverTime: {
    date: string
    count: number
  }[]
  completionRateByLevel: {
    level: string
    completionRate: number
    totalAttempts: number
    submittedAttempts: number
  }[]
  examsCreatedOverTime: {
    month: string
    count: number
  }[]
}

export const dashboardApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => ({
        url: '/dashboard/stats',
        method: 'GET',
      }),
      providesTags: ['Exam', 'Attempt'],
    }),
  }),
})

export const { useGetDashboardStatsQuery } = dashboardApi

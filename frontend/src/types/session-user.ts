export interface SessionUser {
  id: number
  name: string
  role: string
  email: string
  code: string
  gender: string
  status: string
  attemptId?: number
}

export interface SessionUserFilterRequest {
  sessionId: number
  searchText?: string
  role?: string
  gender?: string
  status?: string
  pageIndex?: number
  pageSize?: number
}

export interface SessionUserResponse {
  data: SessionUser[]
  pageIndex: number
  pageSize: number
  total: number
  totalPages: number
}

export interface SessionStats {
  code: string
  startDate: string
  endDate: string
  totalStudents: number
}

export interface ApiResponse<T = any> {
  data: T
  success?: boolean
  code?: number
  message?: string
  timestamp?: string
  status?: number
}

export interface ApiError {
  status?: number
  data?: {
    success: boolean
    code: number
    message: string
    timestamp: string
    status: number
  }
}

export interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
  children?: MenuItem[]
}

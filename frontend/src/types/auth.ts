import { User } from './user'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
  accessTokenExpiredAt: string
  refreshTokenExpiredAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginTransformedRequest {
  credential: string
  password: string
  rememberMe: boolean
}

export interface RegisterRequest {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

export interface RegisterTransformedRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  isTeacher: boolean
}

export interface UserProfile {
  email: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string // Instant trong Java thường map sang string ISO trong TS
  avatarUrl: string
  gender: Gender
  address: string
  deleted: boolean
  permissions: string[]
  roles: string[]
}

// Nếu Gender cũng là enum Java, bạn có thể định nghĩa enum TS tương ứng
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

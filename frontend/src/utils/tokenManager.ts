import { jwtDecode } from 'jwt-decode'

export interface JWTPayload {
  exp: number
  iat: number
  sub: string
  email: string
  role: string
}

export class TokenManager {
  private static instance: TokenManager
  private refreshPromise: Promise<string> | null = null

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      return new TokenManager()
    }
    return TokenManager.instance
  }

  shouldRefreshToken(token: string | null): boolean {
    if (!token) return false

    try {
      const decoded = jwtDecode<JWTPayload>(token)
      const currentTime = Date.now() / 1000

      return decoded.exp <= currentTime + 300 && decoded.exp >= currentTime
    } catch {
      return false
    }
  }

  getRefreshPromise(): Promise<string> | null {
    return this.refreshPromise
  }

  clearRefreshPromise() {
    this.refreshPromise = null
  }

  setRefreshPromise(refreshPromise: Promise<string>) {
    this.refreshPromise = refreshPromise
  }

  isTokenExpired(token: string): boolean {
    if (!token) {
      return false
    }

    try {
      const decoded = jwtDecode<JWTPayload>(token)
      const currentTime = Date.now() / 1000

      return decoded.exp <= currentTime
    } catch {
      return true
    }
  }
}

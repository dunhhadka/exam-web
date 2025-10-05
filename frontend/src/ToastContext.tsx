import { createContext } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastContextType {
  success: (message: string, description?: string, duration?: number) => void
  error: (message: string, description?: string, duration?: number) => void
  warning: (message: string, description?: string, duration?: number) => void
  info: (message: string, description?: string, duration?: number) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
)

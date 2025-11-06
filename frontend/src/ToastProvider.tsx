import { notification } from 'antd'
import { useEffect } from 'react'
import { ToastContext, ToastContextType, ToastType } from './ToastContext'

notification.config({
  placement: 'topRight',
  top: 24,
  duration: 3,
  maxCount: 3,
})

// Export singleton toast instance
let toastInstance: ToastContextType | null = null

export const getToastInstance = (): ToastContextType | null => {
  return toastInstance
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [api, contextHolder] = notification.useNotification()

  const showToast = (
    type: ToastType,
    message: string,
    description?: string,
    duration?: number
  ) => {
    api[type]({
      message,
      description,
      duration: duration || 3,
      placement: 'topRight',
    })
  }

  const contextValue: ToastContextType = {
    success: (message, description, duration) =>
      showToast('success', message, description, duration),
    error: (message, description, duration) =>
      showToast('error', message, description, duration),
    warning: (message, description, duration) =>
      showToast('warning', message, description, duration),
    info: (message, description, duration) =>
      showToast('info', message, description, duration),
  }

  // Set global instance when provider mounts
  useEffect(() => {
    toastInstance = contextValue
    console.log('Toast instance initialized')

    return () => {
      toastInstance = null
    }
  }, []) // Empty dependency để chỉ set 1 lần

  return (
    <ToastContext.Provider value={contextValue}>
      {contextHolder}
      {children}
    </ToastContext.Provider>
  )
}

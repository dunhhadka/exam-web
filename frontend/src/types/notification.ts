// types/notification.ts
export enum NotificationType {
  ADD_EXAM = 'ADD_EXAM',
  EXAM_RESULT = 'EXAM_RESULT',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: number
  content: string
  type: NotificationType
  receiveId: number
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationResponse {
  data: Notification[]
  total: number
  unreadCount: number
}

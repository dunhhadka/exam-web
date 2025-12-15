// types/notification.ts
export enum NotificationType {
  ADD_EXAM = "ADD_EXAM",
  EXAM_RESULT = "EXAM_RESULT",
  DEADLINE_REMINDER = "DEADLINE_REMINDER",
  SYSTEM = "SYSTEM",
}

export interface Notification {
  id: number;
  content: string;
  type: NotificationType;
  receiveId: String;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  data: Notification[];
}

export interface NotificationStatistic {
  total: number;
  unreadCount: number;
}

export interface NotificationRequest {}

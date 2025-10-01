import { Level, PagingRequest, QuestionType, Tag } from './question'

export interface Exam {
  id: number
  name: string
  level: ExamLevel
  examQuestion?: ExamQuestion[]
  score: number
  isPublic: boolean
  status: ExamStatus

  createdAt?: string
  createdBy?: string
  lastModifiedAt?: string
}

export interface ExamRequest {
  name: string
  level: ExamLevel
  questions: ExamQuestion[]
  idsTag?: number[]
  score?: number
  isPublic: boolean
}

export interface ExamSearchRequest extends PagingRequest {
  me?: boolean
  level?: ExamLevel
  status?: ExamStatus
  publicFlag?: boolean
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export const ExamStatusLabel: Record<ExamStatus, string> = {
  [ExamStatus.DRAFT]: 'Bản nháp',
  [ExamStatus.PUBLISHED]: 'Đã xuất bản',
  [ExamStatus.ARCHIVED]: 'Lưu trữ',
}

export interface ExamQuestion {
  id: number
  text: string
  point?: number
  level: Level
  tags?: Tag[]
  type: QuestionType
  orderIndex: number
}

export enum ExamLevel {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  MEDIUM = 'MEDIUM',
  DIFFICULT = 'DIFFICULT',
}

export const ExamLevelLabel: Record<ExamLevel, string> = {
  [ExamLevel.EASY]: 'Dễ',
  [ExamLevel.NORMAL]: 'Bình thường',
  [ExamLevel.MEDIUM]: 'Trung bình',
  [ExamLevel.DIFFICULT]: 'Khó',
}

export const ExamLevelColor: Record<ExamLevel, string> = {
  [ExamLevel.EASY]: 'green',
  [ExamLevel.NORMAL]: 'blue',
  [ExamLevel.MEDIUM]: 'orange',
  [ExamLevel.DIFFICULT]: 'red',
}

export const ExamStatusColor: Record<ExamStatus, string> = {
  [ExamStatus.DRAFT]: 'gold',
  [ExamStatus.PUBLISHED]: 'green',
  [ExamStatus.ARCHIVED]: 'default',
}

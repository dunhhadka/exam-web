import { Exam } from './exam'
import { PagingRequest } from './question'

export interface ExamSession {
  id: number
  exam: Exam
  name: string
  code: string
  joinToken: string
  joinPath: string

  status: ExamSessionStatus

  startTime: string
  endTime: string
  durationMinutes: number
  lateJoinMinutes: number
  shuffleQuestion: boolean
  shuffleAnswers: boolean

  publicFlag: boolean
  attemptLimit: number

  settings?: ExamSessionSetting
  accessMode: ExamSessionAccessMode
  hasAccessPassword: boolean
  whitelistEntries?: ExamSessionWhitelistEntry[]
}

export enum ExamSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export const ExamSessionStatusLabel: Record<ExamSessionStatus, String> = {
  [ExamSessionStatus.OPEN]: 'Đang mở',
  [ExamSessionStatus.CLOSED]: 'Đã đóng',
}

export interface ExamSessionSetting {
  antiCheat?: AntiCheat
  proctoring?: Proctoring
  notifications?: Notifications
}

export interface AntiCheat {
  blockCopyPaste?: boolean
  blockDevTools?: boolean
  maxWindowBlurAllowed?: number | null
  maxExitFullscreenAllowed?: number | null
}

export type ExamSessionAccessMode = 'PUBLIC' | 'WHITELIST' | 'PASSWORD'

export interface ExamSessionWhitelistEntry {
  email: string
  avatarImages?: string[]
}

export interface Proctoring {
  monitorEnabled?: boolean
  identityMode?: IdentityMode
  requireIdUpload?: boolean
  screenRecording?: boolean
}

export enum IdentityMode {
  WEBCAM = 'WEBCAM',
  UPLOAD = 'UPLOAD',
  NONE = 'NONE',
}

export interface Notifications {
  sendResultEmail?: boolean
  releasePolicy?: ReleasePolicy
}

export enum ReleasePolicy {
  IMMEDIATE = 'IMMEDIATE',
  AFTER_EXAM_END = 'AFTER_EXAM_END',
  AFTER_MARKING = 'AFTER_MARKING',
}

export interface ExamSessionRequest {
  examId?: number
  name?: string
  startTime?: string
  endTime?: string
  durationMinutes?: number
  lateJoinMinutes?: number
  shuffleQuestion?: boolean
  shuffleAnswers?: boolean

  attemptLimit?: number

  isPublic?: boolean

  accessMode?: ExamSessionAccessMode
  password?: string

  settings?: ExamSessionSetting

  whitelistEmails?: string[]
  whitelistEntries?: ExamSessionWhitelistEntry[]
}

export interface ExamFilterRequest extends PagingRequest {
  publicFlag?: boolean
  startDate?: string
  endDate?: string
}

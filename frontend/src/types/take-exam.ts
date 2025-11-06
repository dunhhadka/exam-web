import { QuestionType } from './question'

export interface JoinByCodeRequest {
  code: string
}

export interface JoinSessionMetaResponse {
  sessionId: number
  sessionName: string
  examId: number
  examName: string
  durationMinutes: number
  attemptRemaining: number
  canStart: boolean
  message: string
  status?: number
}

export interface OtpRequest {
  sessionCode: string
  email: string
}

export interface VerifyOtpRequest {
  sessionCode: string
  email: string
  otp: string
}

export interface SessionTokenResponse {
  tokenJoinStart: string
  sessionId: number
  sessionName: string
  email: string
}

export interface StartAttemptRequest {
  sessionId?: number
  sessionToken?: string
  email?: string
  name?: string
  ipAddress?: string
}

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  ABANDONED = 'ABANDONED',
}

// Enum cho GradingStatus (dựa trên Java enum)
export enum GradingStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
}

export interface AttemptDetailResponse {
  attemptId: number
  sessionId: number
  sessionName: string
  attemptNo: number
  status: AttemptStatus // Sử dụng enum
  gradingStatus: GradingStatus // Sử dụng enum
  startedAt: string // ISO string cho Instant
  submittedAt: string | null // Có thể null nếu chưa submit
  expireAt: string
  scoreAuto: number // BigDecimal -> number
  scoreManual: number | null // Có thể null nếu chưa grade manual
  questions: QuestionResponse[]
}

// Nested interface cho QuestionResponse
export interface QuestionResponse {
  attemptQuestionId: number
  orderIndex: number
  type: QuestionType
  point: number
  text: string
  answers: AnswerResponse[]
  minWords: number | null
  maxWords: number | null
  rows: TableRow[]
}

// Nested interface cho AnswerResponse
export interface AnswerResponse {
  answerId: number
  value: string
}

// Nested interface cho TableRow
export interface TableRow {
  label: string
  columns: string[]
}

export interface SubmitAttemptRequest {
  answers: AnswerSubmission[]
}

export interface AnswerSubmission {
  attemptQuestionId: number
  selectedAnswerId?: number
  selectedAnswerIds?: number[]
  text?: string
  rows?: number[]
}

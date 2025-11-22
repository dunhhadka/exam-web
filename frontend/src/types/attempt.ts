import { QuestionType } from './question'

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  ABANDONED = 'ABANDONED',
}

export enum GradingStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
}

export const AttemptStatusLabel: Record<AttemptStatus, string> = {
  [AttemptStatus.IN_PROGRESS]: 'Đang làm',
  [AttemptStatus.SUBMITTED]: 'Đã nộp',
  [AttemptStatus.ABANDONED]: 'Đã bỏ',
}

export const GradingStatusLabel: Record<GradingStatus, string> = {
  [GradingStatus.PENDING]: 'Chờ chấm',
  [GradingStatus.DONE]: 'Đã chấm',
}

export const AttemptStatusColor: Record<AttemptStatus, string> = {
  [AttemptStatus.IN_PROGRESS]: 'processing',
  [AttemptStatus.SUBMITTED]: 'success',
  [AttemptStatus.ABANDONED]: 'default',
}

export const GradingStatusColor: Record<GradingStatus, string> = {
  [GradingStatus.PENDING]: 'warning',
  [GradingStatus.DONE]: 'success',
}

// Response từ API GET /api/exam-attempt/session/{sessionId}
export interface AttemptListResponse {
  attemptId: number
  studentEmail: string
  studentName: string
  attemptNo: number
  status: AttemptStatus
  gradingStatus: GradingStatus
  startedAt: string
  submittedAt: string | null
  scoreAuto: number
  scoreManual: number | null
  totalScore: number
  ipAddress: string
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  unansweredQuestions: number
}

// Response từ API GET /api/exam-attempt/{attemptId}/grading
export interface AttemptGradingResponse {
  attemptId: number
  sessionId: number
  sessionName: string
  studentEmail: string
  studentName: string
  attemptNo: number
  status: AttemptStatus
  gradingStatus: GradingStatus
  startedAt: string
  submittedAt: string
  scoreAuto: number
  scoreManual: number | null
  totalScore: number
  questions: QuestionGradingDetail[]
}

export interface QuestionGradingDetail {
  attemptQuestionId: number
  questionId: number
  orderIndex: number
  type: QuestionType
  point: number
  text: string
  questionSnapshot: Record<string, any>
  studentAnswer: Record<string, any> | null
  autoScore: number | null
  manualScore: number | null
  correct: boolean | null
  answers?: AnswerDetail[]
  tableHeaders?: string[]
  rows?: TableRowDetail[]
  expectedAnswer?: string
  minWords?: number
  maxWords?: number
  sampleAnswer?: string // Cho ESSAY - Câu trả lời mẫu
  gradingCriteria?: string // Cho ESSAY - Tiêu chí chấm điểm
}

export interface AnswerDetail {
  answerId: number
  value: string
  result: boolean
  selected: boolean
}

export interface TableRowDetail {
  label: string
  columns: string[]
  correctIndex: number | null
  selectedIndex: number | null
}

// Request cho API POST /api/exam-attempt/{attemptId}/grading
export interface ManualGradingRequest {
  questions: QuestionGrading[]
}

export interface QuestionGrading {
  attemptQuestionId: number
  score: number
  feedback?: string
}

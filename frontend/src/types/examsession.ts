import { Exam } from "./exam";

export interface ExamSession {
  id: number;
  exam: Exam;
  name: string;
  code: string;
  joinToken: string;
  joinPath: string;

  status: ExamSessionStatus;

  startTime: string;
  endTime: string;
  durationMinutes: number;
  lateJoinMinutes: number;
  shuffleQuestion: boolean;
  shuffleAnswers: boolean;

  publicFlag: boolean;
  attemptLimit: number;

  settings: ExamSessionSetting
}

export enum ExamSessionStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export const ExamSessionStatusLabel: Record<ExamSessionStatus, String> = {
  [ExamSessionStatus.OPEN]: "Đang mở",
  [ExamSessionStatus.CLOSED]: "Đã đóng",
};

export interface ExamSessionSetting {
  antiCheat: AntiCheat;
  proctoring?: Proctoring;
}

export interface AntiCheat {
  blockCopyPaste?: boolean;
  blockDevTools?: boolean;
  maxWindowBlurAllowed?: boolean;
  maxExitFullscreenAllowed?: boolean;
}

export interface Proctoring {
  monitorEnabled?: boolean;
  identityMode?: IdentityMode;
  requireIdUpload?: boolean;
  screenRecording?: boolean;
}

export enum IdentityMode {
  WEBCAM,
  UPLOAD,
  NONE,
}

export interface Notifications {
  sendResultEmail?: boolean;
  releasePolicy?: ReleasePolicy;
}

export enum ReleasePolicy {
  IMMEDIATE,
  AFTER_EXAM_END,
}

export interface ExamSessionRequest {
  examId?: number;
  name?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  lateJoinMinnutes?: number;
  shuffleQuestion?: boolean;
  shuffleAnswers?: boolean;

  attemptLimit?: number;

  isPublic?: boolean;

  settings?: ExamSessionSetting;
}

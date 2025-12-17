export interface ExamSessionStudentResponse {
  id: number;
  examSessionId: number;
  name: string;

  joinToken: string;

  startTime: string;
  endTime: string;

  examName: string;

  duration?: number; // Integer -> optional,
  status: SessionStudentStatus;

  description?: string;
}

export interface CursorResponse<T> {
  data: T[];

  nextCursor?: string;
  previousCursor?: string;

  hasNext: boolean;
  hasPrevious: boolean;

  pageSize: number;
}

export interface CursorRequest {
  cursor?: string;
  limit?: number;
}

export interface ExamStudentFilterRequest extends CursorRequest {
  name?: string;

  startTime?: string; // ISO datetime
  endTime?: string; // ISO datetime

  status?: SessionStudentStatus;
}

export enum SessionStudentStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

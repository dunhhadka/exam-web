export interface Question {
  id: number;
  text?: string;
  point?: number;
  type: QuestionType;
  level: Level;
  isPublic?: boolean;
  status: Status;
  tags?: Tag[];

  maxWords?: number;
  minWords?: number;
  answerAnswer?: string;

  expectedAnswer?: string;
  caseSensitive?: string;
  exactMatch?: boolean;

  createdAt: string;
  createdBy: string;

  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface PagingRequest {
  key?: string;
  pageIndex: number;
  pageSize: number;
  total?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface QuestionFilterRequest extends PagingRequest {
  key?: string;
  createdBy?: "me" | "all";
  type?: QuestionType;
  level?: Level;
  isPublic?: boolean;
  status?: Status;
  tagIds?: number[];
}

export interface BaseQuestionRequest {
  text: string;
  point?: number | null;
  level?: Level;
  isPublic?: boolean;
  tagIds?: number[];
  type?: QuestionType;
}

export interface QuestionRequestInput extends BaseQuestionRequest {
  data: any;
}

export interface QuestionRequestSubmit extends BaseQuestionRequest {
  answers?: AnswerCreateRequest[];
}

export interface AnswerCreateRequest {
  orderIndex: number;
  value: string;
  result?: boolean;
  explanation?: string;
  explanationHtml?: string;
}

export enum QuestionType {
  ONE_CHOICE = "ONE_CHOICE",
  MULTI_CHOICE = "MULTI_CHOICE",
  PLAIN_TEXT = "PLAIN_TEXT",
  ESSAY = "ESSAY",
  TRUE_FALSE = "TRUE_FALSE",
  TABLE_CHOICE = "TABLE_CHOICE",
}

export const QuestionTypeLabel: Record<QuestionType, string> = {
  [QuestionType.ONE_CHOICE]: "Chọn một đáp án",
  [QuestionType.MULTI_CHOICE]: "Chọn nhiều đáp án",
  [QuestionType.PLAIN_TEXT]: "Điền đoạn văn",
  [QuestionType.ESSAY]: "Bài luận",
  [QuestionType.TRUE_FALSE]: "Câu hỏi đúng/sai",
  [QuestionType.TABLE_CHOICE]: "Bảng lựa chọn",
};

export enum Level {
  EASY = "EASY",
  NORMAL = "NORMAL",
  MEDIUM = "MEDIUM",
  DIFFICULT = "DIFFICULT",
}

export const LevelLabel: Record<Level, string> = {
  [Level.EASY]: "Dễ",
  [Level.NORMAL]: "Bình thường",
  [Level.MEDIUM]: "Trung bình",
  [Level.DIFFICULT]: "Khó",
};

export enum Status {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export const StatusLabel: Record<Status, string> = {
  [Status.DRAFT]: "Bản nháp",
  [Status.PUBLISHED]: "Đã xuất bản",
  [Status.ARCHIVED]: "Lưu trữ",
};

export interface Tag {
  id: number;
  name: string;
  slug?: string;
  colorCode?: string;
}

export const QuestionTypeColor: Record<QuestionType, string> = {
  [QuestionType.ONE_CHOICE]: "blue",
  [QuestionType.MULTI_CHOICE]: "cyan",
  [QuestionType.PLAIN_TEXT]: "purple",
  [QuestionType.ESSAY]: "volcano",
  [QuestionType.TRUE_FALSE]: "green",
  [QuestionType.TABLE_CHOICE]: "magenta",
};

export const LevelColor: Record<Level, string> = {
  [Level.EASY]: "green",
  [Level.NORMAL]: "blue",
  [Level.MEDIUM]: "orange",
  [Level.DIFFICULT]: "red",
};

export const StatusColor: Record<Status, string> = {
  [Status.DRAFT]: "gold",
  [Status.PUBLISHED]: "green",
  [Status.ARCHIVED]: "default",
};

export interface TagSearchRequest extends PagingRequest {
  name?: string;
  colorCode?: string;
}

export interface TagRequest {
  name: string;
  colorCode: string;
}

export interface SessionStudentItem {
  row: number
  email: string
  fullName?: string 
  userId?: string 
  avatarPreviews?: string[]
  avatarCount?: number
  hasAvatars?: boolean
  reason?: string
}

export interface SessionStudentPreviewResponse {
  sessionId?: number
  sessionName?: string
  
  validStudents: SessionStudentItem[]
  
  invalidStudents: SessionStudentItem[]
  
  duplicates: SessionStudentItem[]
  
  missingStudents: SessionStudentItem[]
  
  totalValid: number
  totalInvalid: number
  totalDuplicates: number
  totalMissing: number
}

export interface SessionStudentEntryResponse {
  userId: string
  email: string
  fullName: string
  avatarImages: string[]
}

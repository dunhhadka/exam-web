export interface WhitelistPreviewResponse {
  sessionId?: number | null
  sessionName?: string | null
  validEmails: WhitelistEmailItem[]
  invalidEmails: WhitelistEmailItem[]
  duplicates: WhitelistEmailItem[]
  totalValid: number
  totalInvalid: number
  totalDuplicates: number
}

export interface WhitelistEmailItem {
  row?: number | null
  email: string
  avatarPreviews?: string[]
  avatarCount?: number
  hasAvatars?: boolean
  reason?: string | null
}

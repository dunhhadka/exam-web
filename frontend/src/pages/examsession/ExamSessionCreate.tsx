import styled from '@emotion/styled'
import {
  Button,
  Checkbox,
  DatePicker,
  Radio,
  Space,
  Collapse,
  Switch,
  InputNumber,
  Input as AntInput,
  Modal,
  Image,
  Pagination,
  Tooltip,
} from 'antd'
import {
  CloseCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import ConfirmModal from '../../components/common/ConfirmModal'
import DropdownLoadMore from '../../components/common/DropDownLoadMore'
import { useToast } from '../../hooks/useToast'
import { useLazySearchExamQuery } from '../../services/api/examApi'
import { Exam } from '../../types/exam'
import {
  ExamSession,
  ExamSessionAccessMode,
  ExamSessionRequest,
  ExamSessionWhitelistEntry,
  IdentityMode,
  ReleasePolicy,
} from '../../types/examsession'
import { usePreviewSessionStudentsMutation } from '../../services/api/sessionStudentApi'
import { SessionStudentPreviewResponse } from '../../types/sessionStudent'
import { RequiredStar } from '../question/QuestionCreatePage'
import { StudentListModal } from '../../components/examsession/StudentListModal'
import { formatDateTimeToRequest } from '../../utils/times'

const { Panel } = Collapse

const AccessMode = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const satisfies Record<string, ExamSessionAccessMode>

interface AntiCheatSettings {
  enableAntiCheat?: boolean
  webcamCapture?: boolean
  uploadImage?: boolean
  uploadId?: boolean
  screenRecording?: boolean
  preventMemoryExit?: boolean
  preventCopyPaste?: boolean
  blockDevTools?: boolean
  preventRightClick?: boolean
  maxExitAttempts?: number
  maxFullscreenExitAttempts?: number
  enableGoogleMeet?: boolean
  meetActivation?: boolean
  sendResultEmail?: boolean
  releasePolicy?: ReleasePolicy
}

interface Props {
  initData?: ExamSession
  onSubmit: (data: ExamSessionRequest) => void
  loading?: boolean
  onClose: () => void
}

type ExamSessionFormData = Partial<Omit<ExamSessionRequest, 'startTime' | 'endTime'>> & {
  examName?: string
  startTime?: Dayjs | string | null
  endTime?: Dayjs | string | null
  accessMode?: ExamSessionAccessMode
  antiCheatSettings?: AntiCheatSettings
  studentIds?: string[]
  whitelistEmails?: string[]
}

type WhitelistEntryStatus = 'VALID' | 'INVALID' | 'DUPLICATE'

interface WhitelistEntry {
  id: string
  userId?: string
  email: string
  fullName?: string
  status: WhitelistEntryStatus
  reason?: string
  row?: number | null
  avatarCount?: number
  avatarPreviews?: string[]
  source?: 'IMPORT_VALID' | 'IMPORT_INVALID' | 'IMPORT_DUPLICATE' | 'MANUAL' | 'SELECTED'
  manualFiles?: (File | null)[]
}

const MAX_AVATARS_PER_EMAIL = 5
const WHITELIST_PAGE_SIZE = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const createEntryId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const parseDateSafely = (dateValue: string | Dayjs | null | undefined): Dayjs | null => {
  if (!dateValue) return null
  
  if (typeof dateValue === 'object' && 'isValid' in dateValue && typeof dateValue.isValid === 'function') {
    const dayjsObj = dateValue as Dayjs
    if (dayjsObj.isValid()) {
      return dayjsObj
    }
  }
  
  if (typeof dateValue === 'string') {
    const isoDate = dayjs(dateValue)
    if (isoDate.isValid()) {
      return isoDate
    }
    
    const customDate = dayjs(dateValue, 'DD-MM-YYYY HH:mm', true)
    if (customDate.isValid()) {
      return customDate
    }
    
    const autoDate = dayjs(dateValue)
    if (autoDate.isValid()) {
      return autoDate
    }
  }
  
  return null
}

const mapPreviewToEntries = (
  preview: SessionStudentPreviewResponse,
): WhitelistEntry[] => {
  const fromValid = preview.validStudents?.map((item) => ({
    id: createEntryId(),
    userId: item.userId,
    email: item.email ?? '',
    fullName: item.fullName,
    status: 'VALID' as WhitelistEntryStatus,
    reason: item.reason ?? '',
    row: item.row,
    avatarPreviews: item.avatarPreviews?.map(img => 
      img.length > 100 ? `${img.substring(0, 100)}...` : img
    ) ?? [],
    avatarCount: item.avatarPreviews?.length ?? item.avatarCount ?? 0,
    manualFiles: (item.avatarPreviews ?? []).map(() => null),
    source: 'IMPORT_VALID' as const,
  })) ?? []

  const fromInvalid = preview.invalidStudents?.map((item) => ({
    id: createEntryId(),
    userId: item.userId,
    email: item.email ?? '',
    fullName: item.fullName,
    status: 'INVALID' as WhitelistEntryStatus,
    reason: item.reason ?? 'Email không hợp lệ',
    row: item.row,
    avatarPreviews: item.avatarPreviews?.map(img => 
      img.length > 100 ? `${img.substring(0, 100)}...` : img
    ) ?? [],
    avatarCount: item.avatarPreviews?.length ?? item.avatarCount ?? 0,
    manualFiles: (item.avatarPreviews ?? []).map(() => null),
    source: 'IMPORT_INVALID' as const,
  })) ?? []

  const fromDuplicates = preview.duplicates?.map((item) => ({
    id: createEntryId(),
    userId: item.userId,
    email: item.email ?? '',
    fullName: item.fullName,
    status: 'DUPLICATE' as WhitelistEntryStatus,
    reason: item.reason ?? 'Sinh viên đã tồn tại trong phiên thi',
    row: item.row,
    avatarPreviews: item.avatarPreviews?.map(img => 
      img.length > 100 ? `${img.substring(0, 100)}...` : img
    ) ?? [],
    avatarCount: item.avatarPreviews?.length ?? item.avatarCount ?? 0,
    manualFiles: (item.avatarPreviews ?? []).map(() => null),
    source: 'IMPORT_DUPLICATE' as const,
  })) ?? []

  const fromMissing = preview.missingStudents?.map((item) => ({
    id: createEntryId(),
    userId: item.userId,
    email: item.email ?? '',
    fullName: item.fullName,
    status: 'INVALID' as WhitelistEntryStatus,
    reason: item.reason ?? 'Không tìm thấy tài khoản trong hệ thống',
    row: item.row,
    avatarPreviews: item.avatarPreviews?.map(img => 
      img.length > 100 ? `${img.substring(0, 100)}...` : img
    ) ?? [],
    avatarCount: item.avatarPreviews?.length ?? item.avatarCount ?? 0,
    manualFiles: (item.avatarPreviews ?? []).map(() => null),
    source: 'IMPORT_INVALID' as const,
  })) ?? []

  return [...fromValid, ...fromInvalid, ...fromDuplicates, ...fromMissing]
}

const recalcWhitelistStatuses = (entries: WhitelistEntry[]): WhitelistEntry[] => {
  const emailCount: Record<string, number> = {}

  entries.forEach((entry) => {
    const key = entry.email?.trim().toLowerCase()
    if (key) {
      emailCount[key] = (emailCount[key] ?? 0) + 1
    }
  })

  return entries.map((entry) => {
    const email = entry.email?.trim() ?? ''
    const avatarCount = entry.avatarPreviews?.length ?? 0
    const normalizedEntry: WhitelistEntry = {
      ...entry,
      avatarCount,
      manualFiles: entry.manualFiles
        ? entry.manualFiles.slice(0, avatarCount)
        : entry.manualFiles,
    }

    if (!email) {
      return { ...normalizedEntry, status: 'INVALID', reason: 'Email không được bỏ trống' }
    }

    if (avatarCount > MAX_AVATARS_PER_EMAIL) {
      return {
        ...normalizedEntry,
        status: 'INVALID',
        reason: `Tối đa ${MAX_AVATARS_PER_EMAIL} ảnh cho mỗi email (hiện có ${avatarCount})`,
      }
    }

    if (!EMAIL_PATTERN.test(email)) {
      return { ...normalizedEntry, status: 'INVALID', reason: 'Email không đúng định dạng' }
    }

    const normalized = email.toLowerCase()
    if ((emailCount[normalized] ?? 0) > 1) {
      return { ...normalizedEntry, status: 'DUPLICATE', reason: 'Email bị trùng trong danh sách' }
    }

    return { ...normalizedEntry, status: 'VALID', reason: '' }
  })
}

const ExamSessionCreate = ({
  initData,
  onSubmit,
  loading = false,
  onClose,
}: Props) => {
  const defaultFormValues = useMemo<ExamSessionFormData>(() => {
    if (!initData) {
      return {
        examId: undefined,
        examName: '',
        name: '',
        startTime: null,
        endTime: null,
        durationMinutes: 60,
        lateJoinMinutes: 15,
        shuffleAnswers: false,
        shuffleQuestion: false,
        attemptLimit: 1,
        isPublic: true,
        accessMode: AccessMode.PUBLIC,
        antiCheatSettings: {
          enableAntiCheat: false,
          webcamCapture: false,
          uploadImage: false,
          uploadId: false,
          screenRecording: false,
          preventMemoryExit: false,
          preventCopyPaste: false,
          blockDevTools: false,
          preventRightClick: false,
          maxExitAttempts: 3,
          maxFullscreenExitAttempts: 3,
          enableGoogleMeet: false,
          meetActivation: false,
          sendResultEmail: true,
          releasePolicy: ReleasePolicy.AFTER_MARKING,
        },
        whitelistEmails: [] as string[],
      }
    }

    const antiCheat = initData.settings?.antiCheat
    const proctoring = initData.settings?.proctoring
    const notifications = initData.settings?.notifications

    return {
      examId: initData.exam?.id,
      examName: initData.exam?.name ?? '',
      name: initData.name ?? '',
      startTime: parseDateSafely(initData.startTime),
      endTime: parseDateSafely(initData.endTime),
      durationMinutes: initData.durationMinutes ?? 60,
      lateJoinMinutes: initData.lateJoinMinutes ?? 15,
      shuffleAnswers: initData.shuffleAnswers ?? false,
      shuffleQuestion: initData.shuffleQuestion ?? false,
      attemptLimit: initData.attemptLimit ?? 1,
      isPublic: initData.publicFlag ?? true,
      accessMode: initData.accessMode ?? AccessMode.PUBLIC,
      antiCheatSettings: {
        enableAntiCheat: !!antiCheat || !!proctoring,
        webcamCapture: proctoring?.identityMode === IdentityMode.WEBCAM,
        uploadImage: proctoring?.identityMode === IdentityMode.UPLOAD,
        uploadId: !!proctoring?.requireIdUpload,
        screenRecording: !!proctoring?.screenRecording,
        preventCopyPaste: !!antiCheat?.blockCopyPaste,
        blockDevTools: !!antiCheat?.blockDevTools,
        preventRightClick:
          antiCheat?.maxWindowBlurAllowed !== null
          && antiCheat?.maxWindowBlurAllowed !== undefined,
        maxExitAttempts: antiCheat?.maxWindowBlurAllowed ?? 3,
        preventMemoryExit: antiCheat?.maxExitFullscreenAllowed !== null && antiCheat?.maxExitFullscreenAllowed !== undefined,
        maxFullscreenExitAttempts: antiCheat?.maxExitFullscreenAllowed ?? 3,
        enableGoogleMeet: false,
        meetActivation: false,
        sendResultEmail: notifications?.sendResultEmail ?? true,
        releasePolicy: notifications?.releasePolicy ?? ReleasePolicy.AFTER_MARKING,
      },
      whitelistEmails: initData.whitelistEntries?.map((entry) => entry.email) ?? [],
    }
  }, [initData])

  const initialWhitelistEntries = useMemo<WhitelistEntry[]>(() => {
    // Load from assignedStudents (new data structure with userId)
    if (initData?.assignedStudents?.length) {
      const mapped = initData.assignedStudents.map((entry) => ({
        id: createEntryId(),
        userId: entry.userId,
        email: entry.email,
        fullName: entry.fullName,
        status: 'VALID' as WhitelistEntryStatus,
        reason: '',
        avatarPreviews: entry.avatarImages ?? [],
        avatarCount: entry.avatarImages?.length ?? 0,
        manualFiles: (entry.avatarImages ?? []).map(() => null),
        source: 'SELECTED' as const,
      }))
      return recalcWhitelistStatuses(mapped)
    }

    // Fallback to whitelistEntries (old data structure without userId)
    if (initData?.whitelistEntries?.length) {
      const mapped = initData.whitelistEntries.map((entry) => ({
        id: createEntryId(),
        email: entry.email,
        status: 'VALID' as WhitelistEntryStatus,
        reason: '',
        avatarPreviews: entry.avatarImages ?? [],
        avatarCount: entry.avatarImages?.length ?? 0,
        manualFiles: (entry.avatarImages ?? []).map(() => null),
        source: 'IMPORT_VALID' as const,
      }))
      return recalcWhitelistStatuses(mapped)
    }

    return []
  }, [initData])

  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset,
  } = useForm<ExamSessionFormData>({
    defaultValues: defaultFormValues,
  })

  const toast = useToast()
  const [confirmModal, setConfirmModal] = useState(false)
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>(initialWhitelistEntries)
  const [studentModalVisible, setStudentModalVisible] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualEmail, setManualEmail] = useState('')
  const [previewEntry, setPreviewEntry] = useState<WhitelistEntry | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputsRef = useRef<Record<string, HTMLInputElement | null>>({})
  const [currentWhitelistPage, setCurrentWhitelistPage] = useState(1)
  const [previewSessionStudents, { isLoading: previewLoading }]
    = usePreviewSessionStudentsMutation()

  useEffect(() => {
    reset(defaultFormValues)
    setWhitelistEntries(initialWhitelistEntries)
    setCurrentWhitelistPage(1)
    setShowManualForm(false)
    setManualEmail('')
    setPreviewEntry(null)
    avatarInputsRef.current = {}
  }, [defaultFormValues, initialWhitelistEntries, reset])

  const handleFormSubmit = (data: ExamSessionFormData) => {
    const now = dayjs()
    const startTime = data.startTime ? dayjs(data.startTime) : null
    const endTime = data.endTime ? dayjs(data.endTime) : null

    // Chỉ validate thời gian khi TẠO MỚI
    if (!initData) {
      if (startTime && startTime.isBefore(now)) {
        toast.error('Thời gian bắt đầu không được ở trong quá khứ')
        return
      }

      if (endTime && endTime.isBefore(now)) {
        toast.error('Thời gian kết thúc không được ở trong quá khứ')
        return
      }
    }
    // Khi UPDATE: KHÔNG validate thời gian

    if (startTime && endTime && !endTime.isAfter(startTime)) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu')
      return
    }


    if (data.accessMode === AccessMode.PRIVATE && !validWhitelistEmails.length) {
      toast.error('Danh sách truy nhập chưa có email hợp lệ')
      return
    }

    const antiCheatForm = data.antiCheatSettings ?? {}
    const antiCheatPayload = antiCheatForm.enableAntiCheat
      ? {
          blockCopyPaste: !!antiCheatForm.preventCopyPaste,
          blockDevTools: !!antiCheatForm.blockDevTools,
          maxWindowBlurAllowed: antiCheatForm.preventRightClick
            ? 0
            : null,
          maxExitFullscreenAllowed: antiCheatForm.preventMemoryExit
            ? 0
            : null,
        }
      : undefined

    const selectedIdentityMode = antiCheatForm.webcamCapture
      ? IdentityMode.WEBCAM
      : antiCheatForm.uploadImage
        ? IdentityMode.UPLOAD
        : IdentityMode.NONE

    if (antiCheatForm.uploadId && selectedIdentityMode !== IdentityMode.UPLOAD) {
      toast.error('Vui lòng bật "Upload ảnh chân dung" trước khi yêu cầu "Upload ảnh ID"')
      return
    }

    const shouldIncludeProctoring = antiCheatForm.enableAntiCheat
      && (
        selectedIdentityMode !== IdentityMode.NONE
        || !!antiCheatForm.uploadId
        || !!antiCheatForm.screenRecording
      )

    const proctoringPayload = shouldIncludeProctoring
      ? {
          monitorEnabled: selectedIdentityMode === IdentityMode.WEBCAM,
          identityMode: selectedIdentityMode,
          requireIdUpload:
            selectedIdentityMode === IdentityMode.UPLOAD && antiCheatForm.uploadId ? true : false,
          screenRecording: !!antiCheatForm.screenRecording,
        }
      : undefined

    const notificationsPayload = {
      sendResultEmail: true,
      releasePolicy: ReleasePolicy.AFTER_MARKING,
    }

    const settingsPayload = antiCheatPayload || notificationsPayload || proctoringPayload
      ? {
          ...(antiCheatPayload ? { antiCheat: antiCheatPayload } : {}),
          ...(proctoringPayload ? { proctoring: proctoringPayload } : {}),
          ...(notificationsPayload ? { notifications: notificationsPayload } : {}),
        }
      : undefined

    const accessModeValue: ExamSessionAccessMode = data.accessMode ?? AccessMode.PUBLIC

    const requestData: ExamSessionRequest = {
      examId: data.examId!,
      name: data.name!,
      startTime: formatDateTimeToRequest(startTime),
      endTime: formatDateTimeToRequest(endTime),
      durationMinutes: data.durationMinutes ?? 60,
      lateJoinMinutes: data.lateJoinMinutes ?? 15,
      shuffleAnswers: data.shuffleAnswers ?? false,
      shuffleQuestion: data.shuffleQuestion ?? false,
      attemptLimit: data.attemptLimit ?? 1,
      isPublic:
        accessModeValue === AccessMode.PUBLIC ? data.isPublic ?? true : false,
      accessMode: accessModeValue,
      settings: settingsPayload,
    }

    if (accessModeValue === AccessMode.PRIVATE) {
      const whitelistPayload: ExamSessionWhitelistEntry[] = validWhitelistEntries
        .map((entry) => ({
          email: entry.email.trim(),
          avatarImages:
            entry.avatarPreviews && entry.avatarPreviews.length
              ? entry.avatarPreviews
              : undefined,
        }))
        .filter((entry) => entry.email)

      if (whitelistPayload.length) {
        requestData.whitelistEntries = whitelistPayload
        requestData.whitelistEmails = whitelistPayload.map((item) => item.email)
      }

      // Extract student IDs and avatars
      const studentIds = validWhitelistEntries
        .map((entry) => entry.userId)
        .filter((id): id is string => id !== undefined && id !== null && id.trim() !== '')

      if (studentIds.length > 0) {
        requestData.studentIds = studentIds
      }

      // Build studentAvatars map: only include entries with avatarPreviews
      const studentAvatars: Record<string, string[]> = {}
      validWhitelistEntries.forEach(entry => {
        if (entry.userId && entry.avatarPreviews && entry.avatarPreviews.length > 0) {
          studentAvatars[entry.userId] = entry.avatarPreviews
          
          // Debug: Log first 100 chars of each avatar
          entry.avatarPreviews.forEach((avatar, idx) => {
            const preview = avatar.length > 100 ? avatar.substring(0, 100) + '...' : avatar
            console.log(`Avatar ${idx} for ${entry.email}: ${preview}`)
          })
        }
      })

      if (Object.keys(studentAvatars).length > 0) {
        requestData.studentAvatars = studentAvatars
        console.log('Sending studentAvatars for', Object.keys(studentAvatars).length, 'students')
      }
    }

    onSubmit(requestData)
  }

  const startTimeValue = watch('startTime')
  const accessMode = watch('accessMode')
  const enableAntiCheat = watch('antiCheatSettings.enableAntiCheat')
  const warnOnWindowBlur = watch('antiCheatSettings.preventRightClick')
  const enforceFullscreen = watch('antiCheatSettings.preventMemoryExit')
  const webcamCapture = watch('antiCheatSettings.webcamCapture')
  const uploadImage = watch('antiCheatSettings.uploadImage')
  const uploadIdSelected = watch('antiCheatSettings.uploadId')

  useEffect(() => {
    if (webcamCapture && uploadImage) {
      setValue('antiCheatSettings.uploadImage', false)
    }
  }, [webcamCapture, uploadImage, setValue])

  useEffect(() => {
    if (!uploadImage && uploadIdSelected) {
      setValue('antiCheatSettings.uploadId', false)
    }
  }, [uploadImage, uploadIdSelected, setValue])

  const validWhitelistEntries = useMemo(
    () =>
      whitelistEntries.filter(
        (entry) => entry.status === 'VALID' && entry.email.trim(),
      ),
    [whitelistEntries],
  )

  const validWhitelistEmails = useMemo(
    () => validWhitelistEntries.map((entry) => entry.email.trim()),
    [validWhitelistEntries],
  )

  const whitelistSummary = useMemo(
    () =>
      whitelistEntries.reduce(
        (acc, entry) => {
          acc[entry.status] += 1
          return acc
        },
        { VALID: 0, INVALID: 0, DUPLICATE: 0 } as Record<WhitelistEntryStatus, number>,
      ),
    [whitelistEntries],
  )

  const paginatedEntries = useMemo(() => {
    const start = (currentWhitelistPage - 1) * WHITELIST_PAGE_SIZE
    return whitelistEntries.slice(start, start + WHITELIST_PAGE_SIZE)
  }, [whitelistEntries, currentWhitelistPage])

  const pageStartIndex = (currentWhitelistPage - 1) * WHITELIST_PAGE_SIZE

  useEffect(() => {
    if (accessMode === AccessMode.PRIVATE) {
      setValue('whitelistEmails', validWhitelistEmails)
    } else {
      setValue('whitelistEmails', [])
    }
  }, [accessMode, setValue, validWhitelistEmails])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(whitelistEntries.length / WHITELIST_PAGE_SIZE))
    if (currentWhitelistPage > totalPages) {
      setCurrentWhitelistPage(totalPages)
    }
  }, [whitelistEntries.length, currentWhitelistPage])

  const handleImportClick = () => {
    setStudentModalVisible(true)
  }

  const handleFileImport = async (file: File) => {
    try {
      console.log('Starting import for file:', file.name, 'sessionId:', initData?.id)
      
      const result = await previewSessionStudents({
        file,
        sessionId: initData?.id,
      })
      
      console.log('Raw mutation result:', result)
      
      const preview = result.data
      
      console.log('Preview response:', preview)

      // Validate response structure - must have at least one of the student arrays
      if (!preview || typeof preview !== 'object') {
        console.error('Invalid response structure:', preview)
        toast.error('Dữ liệu phản hồi không hợp lệ')
        return
      }

      const mapped = mapPreviewToEntries(preview)
      
      // Merge với students hiện tại: giữ lại student cũ nếu không bị trùng
      const existingEmails = new Set(mapped.map(s => s.email.toLowerCase()))
      const keptExisting = whitelistEntries.filter(
        existing => !existingEmails.has(existing.email.toLowerCase())
      )
      
      const mergedStudents = [...keptExisting, ...mapped]
      setWhitelistEntries(recalcWhitelistStatuses(mergedStudents))
      
      const validCount = mapped.filter(s => s.status === 'VALID').length
      const duplicateCount = preview.duplicates?.length || 0
      const invalidCount = (preview.invalidStudents?.length || 0) + (preview.missingStudents?.length || 0)
      
      if (validCount > 0) {
        toast.success(`Đã import ${validCount} sinh viên${duplicateCount > 0 ? ` (${duplicateCount} trùng)` : ''}${invalidCount > 0 ? ` (${invalidCount} không hợp lệ)` : ''}`)
      } else if (duplicateCount > 0) {
        toast.warning(`Tất cả ${duplicateCount} sinh viên đã tồn tại`)
      } else {
        toast.error('Không có sinh viên hợp lệ trong file Excel')
      }
    } catch (error: any) {
      console.error('Import error details:', {
        error,
        status: error?.status,
        data: error?.data,
        message: error?.message
      })
      toast.error('Không thể xem trước danh sách sinh viên, thử lại sau')
    }
  }

  const handleStudentModalConfirm = (students: WhitelistEntry[]) => {
    setWhitelistEntries(students)
    setCurrentWhitelistPage(1)
    setShowManualForm(false)
    
    const validCount = students.filter(s => s.status === 'VALID').length
    const duplicateCount = students.filter(s => s.status === 'DUPLICATE').length
    
    if (duplicateCount > 0) {
      toast.success(`Đã cập nhật ${validCount} sinh viên (${duplicateCount} sinh viên đã tồn tại)`)
    } else {
      toast.success(`Đã cập nhật ${validCount} sinh viên`)
    }
  }

  const toggleManualForm = () => {
    setStudentModalVisible(true)
  }

  const handleManualAdd = () => {
    if (!manualEmail.trim()) {
      toast.error('Vui lòng nhập email trước khi thêm')
      return
    }

    const newEntry: WhitelistEntry = {
      id: createEntryId(),
      email: manualEmail.trim(),
      status: 'VALID',
      reason: '',
      source: 'MANUAL',
      avatarPreviews: [],
      avatarCount: 0,
      manualFiles: [],
    }

    setWhitelistEntries((prev) => {
      const next = recalcWhitelistStatuses([...prev, newEntry])
      setCurrentWhitelistPage(Math.ceil(next.length / WHITELIST_PAGE_SIZE))
      return next
    })
    setManualEmail('')
  }

  const handleEntryEmailChange = (id: string, value: string) => {
    setWhitelistEntries((prev) => {
      const updated = prev.map((entry) =>
        entry.id === id ? { ...entry, email: value } : entry,
      )
      return recalcWhitelistStatuses(updated)
    })
  }

  const handleRemoveEntry = (id: string) => {
    delete avatarInputsRef.current[id]
    setWhitelistEntries((prev) => {
      const next = recalcWhitelistStatuses(prev.filter((entry) => entry.id !== id))
      setCurrentWhitelistPage((page) => {
        const maxPage = Math.max(1, Math.ceil(next.length / WHITELIST_PAGE_SIZE) || 1)
        return Math.min(page, maxPage)
      })
      return next
    })
    setPreviewEntry((prev) => (prev && prev.id === id ? null : prev))
  }

  const convertFileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleAvatarUpload = async (
    id: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (!files.length) {
      return
    }

    const targetEntry = whitelistEntries.find((entry) => entry.id === id)
    if (!targetEntry) {
      return
    }

    const existingPreviews = targetEntry.avatarPreviews ?? []
    const availableSlots = MAX_AVATARS_PER_EMAIL - existingPreviews.length

    if (availableSlots <= 0) {
      toast.error(`Mỗi email chỉ được tối đa ${MAX_AVATARS_PER_EMAIL} ảnh`)
      return
    }

    const filesToUse = files.slice(0, availableSlots)

    try {
      const newPreviews = await Promise.all(
        filesToUse.map((file) => convertFileToBase64(file)),
      )

      setWhitelistEntries((prev) =>
        recalcWhitelistStatuses(
          prev.map((entry) => {
            if (entry.id !== id) {
              return entry
            }

            const baseManualFiles = entry.manualFiles
              ?? (entry.avatarPreviews ?? []).map(() => null)

            return {
              ...entry,
              avatarPreviews: [...(entry.avatarPreviews ?? []), ...newPreviews],
              manualFiles: [...baseManualFiles, ...filesToUse],
            }
          }),
        ),
      )

      setPreviewEntry((prev) => {
        if (!prev || prev.id !== id) {
          return prev
        }

        const baseManualFiles = prev.manualFiles
          ?? (prev.avatarPreviews ?? []).map(() => null)

        return {
          ...prev,
          avatarPreviews: [...(prev.avatarPreviews ?? []), ...newPreviews],
          manualFiles: [...baseManualFiles, ...filesToUse],
        }
      })

      if (files.length > filesToUse.length) {
        toast.warning(`Đã chọn nhiều hơn ${MAX_AVATARS_PER_EMAIL} ảnh, chỉ lấy ${filesToUse.length} ảnh đầu tiên`)
      }
    } catch (error) {
      toast.error('Không thể tải ảnh, vui lòng thử lại')
    }
  }

  const handleRemoveAvatar = (entryId: string, index: number) => {
    setWhitelistEntries((prev) => {
      const updated = prev.map((entry) => {
        if (entry.id !== entryId) {
          return entry
        }

        const previews = [...(entry.avatarPreviews ?? [])]
        if (index < 0 || index >= previews.length) {
          return entry
        }

        previews.splice(index, 1)

        let manualFiles = entry.manualFiles
          ? [...entry.manualFiles]
          : undefined

        if (manualFiles && manualFiles.length > index) {
          manualFiles.splice(index, 1)
          if (!manualFiles.length) {
            manualFiles = []
          }
        }

        return {
          ...entry,
          avatarPreviews: previews,
          manualFiles,
        }
      })

      return recalcWhitelistStatuses(updated)
    })

    setPreviewEntry((prev) => {
      if (!prev || prev.id !== entryId) {
        return prev
      }

      const previews = [...(prev.avatarPreviews ?? [])]
      if (index < 0 || index >= previews.length) {
        return prev
      }

      previews.splice(index, 1)

      let manualFiles = prev.manualFiles
        ? [...prev.manualFiles]
        : undefined

      if (manualFiles && manualFiles.length > index) {
        manualFiles.splice(index, 1)
        if (!manualFiles.length) {
          manualFiles = []
        }
      }

      return {
        ...prev,
        avatarPreviews: previews,
        manualFiles,
      }
    })
  }

  const handleClearAvatars = (entryId: string) => {
    const input = avatarInputsRef.current[entryId]
    if (input) {
      input.value = ''
    }

    setWhitelistEntries((prev) =>
      recalcWhitelistStatuses(
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                avatarPreviews: [],
                manualFiles: [],
              }
            : entry,
        ),
      ),
    )

    setPreviewEntry((prev) =>
      prev && prev.id === entryId
        ? {
            ...prev,
            avatarPreviews: [],
            manualFiles: [],
          }
        : prev,
    )
  }

  const [searchExamLazy] = useLazySearchExamQuery()

  const fetchExam = useCallback(
    async ({
      page,
      pageSize,
      search,
    }: {
      page: number
      pageSize: number
      search?: string
    }) => {
      const response = await searchExamLazy({
        pageIndex: page,
        pageSize: pageSize,
        keyword: search,
      }).unwrap()

      return {
        data: response?.data ?? [],
        total: response?.count ?? 0,
        hasMore: false,
      }
    },
    [searchExamLazy],
  )

  const renderExamOption = useCallback(
    (item: Exam) => ({
      label: item.name,
      value: item.id,
    }),
    [],
  )

  return (
    <>
      <ContentWrapper>
        <IllustrationColumn>
          <IllustrationCard>
            <IllustrationImageWrapper>
              <IllustrationImage 
                src="/baitap.gif"
                alt="Exam Illustration"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/logo_create_session.png';
                }}
              />
            </IllustrationImageWrapper>
            <IllustrationText>Bài kiểm tra</IllustrationText>
          </IllustrationCard>
        </IllustrationColumn>

        <FormColumn>
          <FormContent>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                {/* Chọn bài kiểm tra */}
                <FormGroup>
                  <Label>
                    Chọn bài kiểm tra: <RequiredStar>*</RequiredStar>
                  </Label>
                  <Controller
                    name="examName"
                    control={control}
                    rules={{ required: 'Vui lòng chọn bài kiểm tra' }}
                    render={({ field }) => (
                      <>
                        <DropdownLoadMore<Exam>
                          {...field}
                          fetchData={fetchExam}
                          renderOption={renderExamOption}
                          onSelect={(value) => setValue('examId', value)}
                          placeholder="Chọn bài kiểm tra"
                          style={{ width: '100%' }}
                          disabled={!!initData}
                        />
                        {errors.examName && (
                          <ErrorText>{errors.examName.message}</ErrorText>
                        )}
                      </>
                    )}
                  />
                </FormGroup>

                {/* Tên bài kiểm tra */}
                <FormGroup>
                  <Label>
                    Tên bài kiểm tra: <RequiredStar>*</RequiredStar>
                  </Label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Vui lòng nhập tên bài kiểm tra' }}
                    render={({ field }) => (
                      <>
                        <StyledInput
                          {...field}
                          placeholder="Nhập tên bài kiểm tra"
                          status={errors.name ? 'error' : ''}
                        />
                        {errors.name && (
                          <ErrorText>{errors.name.message}</ErrorText>
                        )}
                      </>
                    )}
                  />
                </FormGroup>

                {/* Ngày bắt đầu */}
                <FormGroup>
                  <Label>
                    Ngày bắt đầu: <RequiredStar>*</RequiredStar>
                  </Label>
                  <Controller
                    name="startTime"
                    control={control}
                    rules={{ required: 'Vui lòng chọn ngày bắt đầu' }}
                    render={({ field }) => {
                      // Parse date an toàn cho DatePicker
                      const dateValue = field.value 
                        ? (typeof field.value === 'object' && 'isValid' in field.value 
                            ? (field.value as Dayjs).isValid() ? field.value as Dayjs : parseDateSafely(field.value)
                            : parseDateSafely(field.value))
                        : null
                      
                      return (
                        <>
                          <StyledDatePicker
                            {...field}
                            value={dateValue}
                            onChange={(date) => field.onChange(date)}
                            placeholder="Nhập ngày bắt đầu"
                            format="DD/MM/YYYY HH:mm"
                            showTime={{ format: 'HH:mm' }}
                            status={errors.startTime ? 'error' : ''}
                            getPopupContainer={(trigger) => trigger.parentElement || document.body}
                            popupStyle={{ position: 'absolute' }}
                          />
                          {errors.startTime && (
                            <ErrorText>{errors.startTime.message}</ErrorText>
                          )}
                        </>
                      )
                    }}
                  />
                </FormGroup>

                {/* Ngày kết thúc */}
                <FormGroup>
                  <Label>
                    Ngày kết thúc: <RequiredStar>*</RequiredStar>
                  </Label>
                  <Controller
                    name="endTime"
                    control={control}
                    rules={{
                      required: 'Vui lòng chọn ngày kết thúc',
                      validate: (value) => {
                        if (
                          startTimeValue &&
                          value &&
                          dayjs(value).isBefore(dayjs(startTimeValue))
                        ) {
                          return 'Ngày kết thúc phải sau ngày bắt đầu'
                        }
                        return true
                      },
                    }}
                    render={({ field }) => {
                      // Parse date an toàn cho DatePicker
                      const dateValue = field.value 
                        ? (typeof field.value === 'object' && 'isValid' in field.value 
                            ? (field.value as Dayjs).isValid() ? field.value as Dayjs : parseDateSafely(field.value)
                            : parseDateSafely(field.value))
                        : null
                      
                      return (
                        <>
                          <StyledDatePicker
                            {...field}
                            value={dateValue}
                            onChange={(date) => field.onChange(date)}
                            placeholder="Nhập ngày kết thúc"
                            format="DD/MM/YYYY HH:mm"
                            showTime={{ format: 'HH:mm' }}
                            status={errors.endTime ? 'error' : ''}
                            getPopupContainer={(trigger) => trigger.parentElement || document.body}
                            popupStyle={{ position: 'absolute' }}
                          />
                          {errors.endTime && (
                            <ErrorText>{errors.endTime.message}</ErrorText>
                          )}
                        </>
                      )
                    }}
                  />
                </FormGroup>

                {/* Thời gian làm bài */}
                <FormGroup>
                  <Label>
                    Thời gian làm bài: <RequiredStar>*</RequiredStar>
                  </Label>
                  <Controller
                    name="durationMinutes"
                    control={control}
                    rules={{
                      required: 'Vui lòng nhập thời gian làm bài',
                      min: { value: 1, message: 'Thời gian phải lớn hơn 0' },
                    }}
                    render={({ field }) => (
                      <>
                        <StyledInput
                          {...field}
                          placeholder="Phút"
                          type="number"
                          status={errors.durationMinutes ? 'error' : ''}
                        />
                        {errors.durationMinutes && (
                          <ErrorText>{errors.durationMinutes.message}</ErrorText>
                        )}
                      </>
                    )}
                  />
                </FormGroup>

                {/* Thời gian được vào trễ */}
                <FormGroup>
                  <LabelWithIcon>
                    Thời gian được vào trễ (phút): <RequiredStar>*</RequiredStar>
                    <InfoCircleOutlined />
                  </LabelWithIcon>
                  <Controller
                    name="lateJoinMinutes"
                    control={control}
                    rules={{
                      required: 'Vui lòng nhập thời gian vào trễ',
                      min: { value: 0, message: 'Thời gian không được âm' },
                    }}
                    render={({ field }) => (
                      <>
                        <StyledInput
                          {...field}
                          placeholder="Phút"
                          type="number"
                          status={errors.lateJoinMinutes ? 'error' : ''}
                        />
                        {errors.lateJoinMinutes && (
                          <ErrorText>{errors.lateJoinMinutes.message}</ErrorText>
                        )}
                      </>
                    )}
                  />
                </FormGroup>

                {/* Chế độ truy cập */}
                <FormGroup>
                  <Label>
                    Chế độ truy cập: <RequiredStar>*</RequiredStar>
                  </Label>
                  <Controller
                    control={control}
                    name="accessMode"
                    render={({ field }) => (
                      <Radio.Group {...field} disabled={!!initData}>
                        <Space direction="vertical" size={8}>
                          <Radio value={AccessMode.PUBLIC}>Công khai</Radio>
                          <Radio value={AccessMode.PRIVATE}>Riêng tư</Radio>
                        </Space>
                      </Radio.Group>
                    )}
                  />
                  {accessMode === AccessMode.PRIVATE && (
                    <WhitelistContainer>
                      <WhitelistActions>
                        <Button
                          icon={<PlusOutlined />}
                          onClick={handleImportClick}
                          loading={previewLoading}
                          type="primary"
                        >
                          {whitelistEntries.length > 0 ? 'Quản lý danh sách sinh viên' : 'Chọn sinh viên'}
                        </Button>
                      </WhitelistActions>

                      {whitelistEntries.length === 0 ? (
                        <WhitelistEmpty>
                          Chưa có sinh viên nào. Hãy click nút "Chọn sinh viên" để thêm.
                        </WhitelistEmpty>
                      ) : (
                        <>
                          <WhitelistSummary>
                            <SummaryItem data-status="VALID">
                              Hợp lệ: {whitelistSummary.VALID}
                            </SummaryItem>
                            <SummaryItem data-status="DUPLICATE">
                              Trùng: {whitelistSummary.DUPLICATE}
                            </SummaryItem>
                            <SummaryItem data-status="INVALID">
                              Không hợp lệ: {whitelistSummary.INVALID}
                            </SummaryItem>
                          </WhitelistSummary>
                          <Button
                            type="link"
                            onClick={handleImportClick}
                            style={{ marginTop: 8 }}
                          >
                            Xem và chỉnh sửa danh sách ({whitelistEntries.length} sinh viên)
                          </Button>
                        </>
                      )}
                    </WhitelistContainer>
                  )}

                  <InfoBox>
                    <InfoCircleOutlined />
                    <div>
                      <strong>Ghi chú:</strong>
                      <ul>
                        <li>"Công khai": Khi giao bài công khai, bất cứ học viên nào cũng có thể truy cập.</li>
                        <li>"Danh sách sinh viên": Khi giao bài với danh sách sinh viên, chỉ học sinh được phân công mới có thể truy cập.</li>
                      </ul>
                    </div>
                  </InfoBox>
                </FormGroup>

                {/* Chống gian lận */}
                <FormGroup>
                  <LabelRow>
                    <Label>Chống gian lận:</Label>
                    <Controller
                      name="antiCheatSettings.enableAntiCheat"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          size="small"
                        />
                      )}
                    />
                  </LabelRow>

                  {enableAntiCheat && (
                    <AntiCheatSection>
                      <StyledCollapse ghost expandIconPosition="end">
                        <Panel header="Xác minh danh tính" key="1">
                          <PanelContent>
                            <SubLabel>Ảnh chân dung</SubLabel>
                            <Controller
                              name="antiCheatSettings.webcamCapture"
                              control={control}
                              render={({ field }) => (
                                <StyledCheckbox
                                  checked={field.value}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    field.onChange(checked)
                                    if (checked) {
                                      setValue('antiCheatSettings.uploadImage', false)
                                      setValue('antiCheatSettings.uploadId', false)
                                    }
                                  }}
                                >
                                  Xác thực bằng chụp ảnh webcam
                                </StyledCheckbox>
                              )}
                            />
                            <div style={{ marginTop: 8, color: '#666', fontSize: 13, fontStyle: 'italic' }}>
                              <InfoCircleOutlined style={{ marginRight: 4 }} />
                              Lưu ý: Nếu ảnh ID đã được import, thí sinh sẽ không cần upload. Nếu chưa, thí sinh sẽ cần upload.
                            </div>
                          </PanelContent>
                        </Panel>

                        <Panel header="Bảo mật ghi hình" key="2">
                          <PanelContent>
                            <Controller
                              name="antiCheatSettings.screenRecording"
                              control={control}
                              render={({ field }) => (
                                <StyledCheckbox
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                >
                                  Ghi hình màn hình chia sẻ
                                </StyledCheckbox>
                              )}
                            />
                          </PanelContent>
                        </Panel>

                        <Panel header="Khóa trình duyệt web" key="3">
                          <PanelContent>
                            <Controller
                              name="antiCheatSettings.preventCopyPaste"
                              control={control}
                              render={({ field }) => (
                                <StyledCheckbox
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                >
                                  Khóa copy-paste
                                </StyledCheckbox>
                              )}
                            />
                            <Controller
                              name="antiCheatSettings.blockDevTools"
                              control={control}
                              render={({ field }) => (
                                <StyledCheckbox
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                >
                                  Chặn mở Developer Tool
                                </StyledCheckbox>
                              )}
                            />
                            <Controller
                              name="antiCheatSettings.preventRightClick"
                              control={control}
                              render={({ field }) => (
                                <StyledCheckbox
                                  checked={field.value}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    field.onChange(checked)
                                    // Khi bật, set số lần = 0 (không cho phép lần nào)
                                    if (checked) {
                                      setValue('antiCheatSettings.maxExitAttempts', 0)
                                    }
                                  }}
                                >
                                  Không cho phép chuyển sang tab khác
                                </StyledCheckbox>
                              )}
                            />
                            <Controller
                              name="antiCheatSettings.preventMemoryExit"
                              control={control}
                              render={({ field }) => (
                                <StyledCheckbox
                                  checked={field.value}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    field.onChange(checked)
                                    // Khi bật, set số lần = 0 (không cho phép lần nào)
                                    if (checked) {
                                      setValue('antiCheatSettings.maxFullscreenExitAttempts', 0)
                                    }
                                  }}
                                >
                                  Không cho phép thu nhỏ màn hình
                                </StyledCheckbox>
                              )}
                            />
                          </PanelContent>
                        </Panel>

                        
                      </StyledCollapse>

                      <Divider />

                      <SubSection>
                        <Label>Cài đặt:</Label>
                        <StyledCollapse ghost expandIconPosition="end" defaultActiveKey={['settings']}>
                          <Panel header="Cài đặt" key="settings">
                            <PanelContent>
                              <Controller
                                name="antiCheatSettings.sendResultEmail"
                                control={control}
                                render={({ field }) => (
                                  <CheckboxEnabled
                                    checked={true}
                                    disabled
                                  >
                                    Gửi mail thông báo kết quả
                                  </CheckboxEnabled>
                                )}
                              />
                              <div style={{ marginLeft: 24, marginTop: 12 }}>
                                <Controller
                                  name="antiCheatSettings.releasePolicy"
                                  control={control}
                                  render={({ field }) => (
                                    <CheckboxEnabled
                                      checked={true}
                                      disabled
                                    >
                                      Gửi sau khi giáo viên chấm xong
                                    </CheckboxEnabled>
                                  )}
                                />
                              </div>
                            </PanelContent>
                          </Panel>
                        </StyledCollapse>
                      </SubSection>
                    </AntiCheatSection>
                  )}
                </FormGroup>

                {/* Số lần làm bài & Xáo trộn */}
                <FormGroup>
                  <Label>
                    Số lần làm bài tối đa: <RequiredStar>*</RequiredStar>
                  </Label>
                  <Controller
                    name="attemptLimit"
                    control={control}
                    rules={{
                      required: 'Vui lòng nhập số lần làm bài',
                      min: { value: 1, message: 'Số lần phải lớn hơn 0' },
                    }}
                    render={({ field }) => (
                      <>
                        <StyledInput
                          {...field}
                          placeholder="1"
                          type="number"
                          status={errors.attemptLimit ? 'error' : ''}
                        />
                        {errors.attemptLimit && (
                          <ErrorText>{errors.attemptLimit.message}</ErrorText>
                        )}
                      </>
                    )}
                  />
                </FormGroup>

                <FormGroup>
                  <Controller
                    name="shuffleQuestion"
                    control={control}
                    render={({ field }) => (
                      <StyledCheckbox
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      >
                        Xáo trộn câu hỏi
                      </StyledCheckbox>
                    )}
                  />
                  <Controller
                    name="shuffleAnswers"
                    control={control}
                    render={({ field }) => (
                      <StyledCheckbox
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      >
                        Xáo trộn đáp án
                      </StyledCheckbox>
                    )}
                  />
                </FormGroup>
                <SaveButton type="primary" htmlType="submit" loading={loading} block>
                  Lưu
                </SaveButton>
              </form>
            </FormContent>
          </FormColumn>
        </ContentWrapper>

      <StudentListModal
        visible={studentModalVisible}
        onClose={() => setStudentModalVisible(false)}
        onConfirm={handleStudentModalConfirm}
        initialStudents={whitelistEntries}
        title="Quản lý danh sách sinh viên"
        previewLoading={previewLoading}
        onImportExcel={handleFileImport}
      />

      {confirmModal && (
        <ConfirmModal
          open={confirmModal}
          onOk={onClose}
          danger
          onCancel={() => setConfirmModal(false)}
        />
      )}

      <Modal
        open={!!previewEntry}
        onCancel={() => setPreviewEntry(null)}
        footer={null}
        title={previewEntry ? `Ảnh đi kèm ${previewEntry.email}` : 'Ảnh whitelist'}
        width={600}
      >
        <AvatarPreviewContent>
          {previewEntry?.avatarPreviews?.length ? (
            <Image.PreviewGroup>
              {previewEntry.avatarPreviews.map((src, index) => (
                <AvatarPreviewItem key={index}>
                  <RemoveAvatarButton
                    type="text"
                    shape="circle"
                    icon={<CloseCircleOutlined />}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      if (previewEntry) {
                        handleRemoveAvatar(previewEntry.id, index)
                      }
                    }}
                  />
                  <AvatarPreviewImage
                    src={src}
                    alt={`Avatar ${index + 1}`}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    preview={{
                      src: src,
                    }}
                  />
                </AvatarPreviewItem>
              ))}
            </Image.PreviewGroup>
          ) : (
            <EmptyPreviewText>Không có ảnh nào cho email này.</EmptyPreviewText>
          )}
        </AvatarPreviewContent>
      </Modal>
    </>
  )
}

export default ExamSessionCreate

// Styled Components
const ContentWrapper = styled.div`
  display: flex;
  width: 100%;
  min-height: 520px;
  max-height: 80vh;
  background: #fff;

  @media (max-width: 992px) {
    flex-direction: column;
    max-height: none;
  }
`

const IllustrationColumn = styled.div`
  width: 360px;
  padding: 40px 40px 40px 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9ff;
  border-right: 1px solid #eef0f6;
  flex-shrink: 0;

  @media (max-width: 992px) {
    width: 100%;
    padding: 28px 24px;
    border-right: none;
    border-bottom: 1px solid #eef0f6;
  }
`

const FormColumn = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  max-height: 80vh;
  overflow-y: auto;
  padding: 32px 36px;
  min-width: 0;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #c7cbe5;
    border-radius: 4px;

    &:hover {
      background: #9aa2d0;
    }
  }

  @media (max-width: 992px) {
    max-height: none;
    padding: 24px 20px 32px;
  }
`

const FormContent = styled.div`
  width: 100%;
  max-width: 520px;
  padding: 0 12px;
  margin: 0 auto;
`

const FormGroup = styled.div`
  margin-bottom: 20px;
  position: relative;
`

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
`

const LabelWithIcon = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  
  .anticon {
    color: #1890ff;
    font-size: 12px;
  }
`

const SubLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
`

const StyledInput = styled(AntInput)`
  height: 40px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  
  &:hover {
    border-color: #40a9ff;
  }
  
  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`

const StyledDatePicker = styled(DatePicker)`
  width: 100%;
  height: 40px;
  border-radius: 6px;
  
  .ant-picker-input {
    font-size: 14px;
  }
  
  &:hover {
    border-color: #40a9ff;
  }
  
  &:focus, &.ant-picker-focused {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  .ant-picker-dropdown {
    z-index: 1050 !important;
  }
`

const ErrorText = styled.span`
  display: block;
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
`

const InfoBox = styled.div`
  margin-top: 12px;
  padding: 12px 16px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  gap: 8px;
  
  .anticon {
    color: #1890ff;
    margin-top: 2px;
    flex-shrink: 0;
  }
  
  > div {
    flex: 1;
  }
  
  strong {
    display: block;
    margin-bottom: 4px;
    color: #0c5aa0;
  }
  
  ul {
    margin: 4px 0 0 0;
    padding-left: 20px;
  }
  
  li {
    margin: 4px 0;
    line-height: 1.5;
    color: #0c5aa0;
  }
`

const PasswordInput = styled.div`
  margin-top: 12px;
  padding-left: 24px;
`

const WhitelistContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #f8faff;
  border: 1px solid #e6eaff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const WhitelistActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`

const HiddenFileInput = styled.input`
  display: none;
`

const ManualAddRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`

const WhitelistList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const WhitelistRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e6eaff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.06);
  min-width: 0;

  @media (max-width: 720px) {
    flex-wrap: wrap;
    align-items: flex-start;
  }
`

const WhitelistIndex = styled.span`
  width: 32px;
  text-align: center;
  font-weight: 600;
  color: #4f46e5;
`

const WhitelistEmailWrapper = styled.div`
  flex: 1;
  min-width: 260px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  @media (max-width: 720px) {
    min-width: 100%;
    max-width: 100%;
  }
`

const WhitelistEmailInput = styled(AntInput)`
  width: 100%;
`

const StatusBadge = styled.span`
  min-width: 94px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  padding: 4px 12px;
  flex-shrink: 0;

  &[data-status='VALID'] {
    background: #ecfdf5;
    color: #047857;
  }

  &[data-status='DUPLICATE'] {
    background: #fef9c3;
    color: #b45309;
  }

  &[data-status='INVALID'] {
    background: #fee2e2;
    color: #b91c1c;
  }
`

const RemoveEntryButton = styled(Button)`
  color: #ef4444 !important;

  &:hover {
    color: #dc2626 !important;
  }
`

const RowLinkButton = styled(Button)`
  padding: 0;
  height: auto;
  font-size: 13px;
`

const RowIconButton = styled(Button)`
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444 !important;

  &:hover {
    color: #dc2626 !important;
  }
`

const WhitelistTrailing = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 50%;

  @media (max-width: 720px) {
    margin-left: 0;
    max-width: 100%;
    width: 100%;
    justify-content: flex-start;
  }
`

const WhitelistReason = styled.span`
  font-size: 12px;
  line-height: 1.4;
  padding: 4px 10px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4338ca;
  width: fit-content;
  max-width: 100%;
  overflow-wrap: anywhere;

  &[data-status='INVALID'] {
    background: #fee2e2;
    color: #991b1b;
  }

  &[data-status='DUPLICATE'] {
    background: #fef3c7;
    color: #92400e;
  }

  &[data-status='VALID'] {
    background: #dcfce7;
    color: #047857;
  }
`

const WhitelistEmpty = styled.div`
  padding: 16px;
  border-radius: 10px;
  border: 1px dashed #c7cffc;
  background: #f9faff;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
`

const WhitelistSummary = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
`

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;
`

const SummaryItem = styled.span`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #e6eaff;
  background: #ffffff;
  color: #4338ca;
  font-weight: 500;

  &[data-status='VALID'] {
    color: #047857;
    border-color: #bbf7d0;
    background: #f0fdf4;
  }

  &[data-status='DUPLICATE'] {
    color: #b45309;
    border-color: #fde68a;
    background: #fffbeb;
  }

  &[data-status='INVALID'] {
    color: #b91c1c;
    border-color: #fecaca;
    background: #fef2f2;
  }
`

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`

const AntiCheatSection = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`

const StyledCollapse = styled(Collapse)`
  background: transparent !important;
  border: none !important;
  
  .ant-collapse-item {
    border: 1px solid #e8e8e8 !important;
    margin-bottom: 8px;
    border-radius: 6px !important;
    background: white;
    overflow: hidden;
  }
  
  .ant-collapse-header {
    font-weight: 500 !important;
    font-size: 14px !important;
    padding: 12px 16px !important;
    background: #fafafa !important;
    color: #333 !important;
    
    &:hover {
      background: #f5f5f5 !important;
    }
  }
  
  .ant-collapse-content {
    border-top: 1px solid #f0f0f0 !important;
  }
  
  .ant-collapse-content-box {
    padding: 16px !important;
  }
`

const PanelContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const StyledCheckbox = styled(Checkbox)`
  font-size: 14px;
  color: #333;
  
  .ant-checkbox {
    top: 2px;
  }
  
  &:hover {
    color: #1890ff;
  }
`

const CheckboxEnabled = styled(Checkbox)`
  font-size: 14px;
  color: #333;
  
  .ant-checkbox {
    top: 2px;
  }
  
  &.ant-checkbox-wrapper-disabled {
    .ant-checkbox-checked .ant-checkbox-inner {
      background-color: #1890ff !important;
      border-color: #1890ff !important;
    }
    
    .ant-checkbox-inner::after {
      border-color: #fff !important;
    }
    
    span:not(.ant-checkbox) {
      color: #333 !important;
    }
  }
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-left: 24px;
  padding: 8px 0;
  
  span {
    font-size: 13px;
    color: #666;
    flex: 1;
  }
`

const SmallInputNumber = styled(InputNumber)`
  width: 80px;
  border-radius: 4px;
  
  input {
    text-align: center;
  }
`

const DisabledText = styled.div`
  color: #999;
  font-size: 13px;
  font-style: italic;
`

const SubSection = styled.div`
  margin-top: 16px;
`

const Divider = styled.div`
  height: 1px;
  background: #e8e8e8;
  margin: 16px 0;
`

const SaveButton = styled(Button)`
  height: 44px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  margin-top: 24px;
  background: #ff4757 !important;
  border-color: #ff4757 !important;
  color: white !important;
  
  &:hover:not(:disabled) {
    background: #ff3447 !important;
    border-color: #ff3447 !important;
    box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3) !important;
  }
  
  &:disabled {
    opacity: 0.6;
  }
`

const AvatarPreviewContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  padding-top: 12px;
`

const AvatarPreviewImage = styled(Image)`
  width: 160px;
  height: 160px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 4px;
  background: #ffffff;
  overflow: hidden;

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`

const AvatarPreviewItem = styled.div`
  position: relative;
`

const RemoveAvatarButton = styled(Button)`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.75) !important;
  border: none !important;
  color: #fff !important;

  &:hover {
    background: rgba(239, 68, 68, 0.9) !important;
    color: #fff !important;
  }
`

const EmptyPreviewText = styled.div`
  width: 100%;
  text-align: center;
  color: #6b7280;
  padding: 24px 0;
`

const IllustrationCard = styled.div`
  position: relative;
  width: 100%;
  max-width: 260px;
  padding: 28px 24px;
  border-radius: 24px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c4b5fd 50%, #a855f7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 18px 40px rgba(99, 102, 241, 0.25);

  &::after {
    content: '';
    position: absolute;
    right: -18px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 14px solid transparent;
    border-bottom: 14px solid transparent;
    border-left: 18px solid #c4b5fd;
  }

  @media (max-width: 992px) {
    max-width: 320px;

    &::after {
      display: none;
    }
  }
`

const IllustrationImageWrapper = styled.div`
  width: 100%;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.18);

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  animation: float 3s ease-in-out infinite;
`

const IllustrationImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
`

const IllustrationText = styled.div`
  color: #312e81;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.4px;
`
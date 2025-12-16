import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { set } from 'react-hook-form'

interface ExamSystemCheck {
  checkCamera?: boolean
  checkExtendedDisplay?: boolean
  cameraPermission?: 'pending' | 'granted' | 'denied'
  displayPermission?: 'pending' | 'granted' | 'denied'
  mediaStream?: MediaStream | null
  isPassed?: boolean
}

interface IdentityVerification {
  required?: boolean
  idCardImage?: string | null
  selfieImage?: string | null
  verificationStatus?: 'pending' | 'verifying' | 'success' | 'failed'
  verificationResult?: {
    matched: boolean
    confidence?: number
    message?: string
  }
  isPassed?: boolean
}

interface TakeExamSession {
  examCode: string | null
  candicateInfo?: {
    id?: string
    name?: string
    email?: string
  }
  examStartTime?: Date
  examEndTime?: Date
}

export interface ExamConfig {
  requireCammera?: boolean
  requireExtendedDisplayCheck?: boolean
  requireIdentityVerification?: boolean
  allowedExtendDisplays?: number // số màn hình cho phép được extend
}

interface TakeExamSate {
  currentStep:
    | 'loading'
    | 'system-check'
    | 'identity-verification'
    | 'exam-ready'
    | 'in-exam'
  examConfig: ExamConfig
  systemCheck: ExamSystemCheck
  identityVerification: IdentityVerification
  takeExamSession: TakeExamSession
  error?: string | null
  isLoading: boolean
  userId?: string | null
  userEmail?: string | null
}

const TAKE_EXAM_CODE_STORAGE_KEY = 'takeExam.examCode'

function getStoredExamCode(): string | null {
  try {
    const v = localStorage.getItem(TAKE_EXAM_CODE_STORAGE_KEY)
    return v && v !== 'null' && v !== 'undefined' ? v : null
  } catch {
    return null
  }
}

const initialState: TakeExamSate = {
  currentStep: 'loading',
  examConfig: {
    requireCammera: false,
    requireExtendedDisplayCheck: false,
    requireIdentityVerification: false,
    allowedExtendDisplays: 0,
  },
  systemCheck: {
    checkCamera: undefined,
    checkExtendedDisplay: undefined,
    cameraPermission: undefined,
    displayPermission: undefined,
    mediaStream: undefined,
    isPassed: undefined,
  },
  identityVerification: {
    required: false,
    idCardImage: undefined,
    selfieImage: undefined,
    verificationStatus: undefined,
    verificationResult: undefined,
    isPassed: undefined,
  },
  takeExamSession: {
    examCode: getStoredExamCode(),
    candicateInfo: undefined,
    examStartTime: undefined,
    examEndTime: undefined,
  },
  isLoading: false,
  error: null,
}

const takeExamSlice = createSlice({
  name: 'takeExam',
  initialState,
  reducers: {
    // load exam config from server
    loadExamConfig: (state, action: PayloadAction<ExamConfig>) => {
      state.examConfig = action.payload
      state.currentStep = 'system-check'
    },

    // system check actions
    setCamerPermission: (
      state,
      action: PayloadAction<'pending' | 'granted' | 'denied'>
    ) => {
      state.systemCheck.cameraPermission = action.payload
    },

    setDisplayPermission: (
      state,
      action: PayloadAction<'pending' | 'granted' | 'denied'>
    ) => {
      state.systemCheck.displayPermission = action.payload
    },

    setMediStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.systemCheck.mediaStream = action.payload
    },

    setSystemCheckPassed: (state, action: PayloadAction<boolean>) => {
      state.systemCheck.isPassed = action.payload
      // If don't need verify identity of candicate to take exam
      if (action.payload) {
        state.currentStep = state.examConfig.requireIdentityVerification
          ? 'identity-verification'
          : 'exam-ready'
      }
    },

    setIdCardImage: (state, action: PayloadAction<string>) => {
      state.identityVerification.idCardImage = action.payload
    },

    setSelfieImage: (state, action: PayloadAction<string>) => {
      state.identityVerification.selfieImage = action.payload
    },

    setVerificationStatus: (
      state,
      action: PayloadAction<'pending' | 'verifying' | 'success' | 'failed'>
    ) => {
      state.identityVerification.verificationStatus = action.payload
    },

    setVerificationResult: (
      state,
      action: PayloadAction<{
        matched: boolean
        confidence?: number
        message?: string
      }>
    ) => {
      state.identityVerification.verificationResult = action.payload
      state.identityVerification.isPassed = action.payload.matched
      if (action.payload.matched) {
        state.currentStep = 'exam-ready'
      }
    },

    setTakeExamCode: (state, action: PayloadAction<string>) => {
      state.takeExamSession.examCode = action.payload

      // Persist so refresh doesn't lose roomId (prevents joining /ws/null)
      try {
        localStorage.setItem(TAKE_EXAM_CODE_STORAGE_KEY, action.payload)
      } catch {
        // ignore
      }
    },

    setCandicateInfo: (state, action: PayloadAction<any>) => {
      state.takeExamSession.candicateInfo = action.payload
    },

    startTakeExam: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setStep: (
      state,
      action: PayloadAction<
        | 'loading'
        | 'system-check'
        | 'identity-verification'
        | 'exam-ready'
        | 'in-exam'
      >
    ) => {
      state.currentStep = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    setUserId: (state, action: PayloadAction<string | null>) => {
      state.userId = action.payload
    },

    setUserEmail: (state, action: PayloadAction<string | null>) => {
      state.userEmail = action.payload
    },
  },
})

export const {
  loadExamConfig,
  setCamerPermission,
  setDisplayPermission,
  setMediStream,
  setSystemCheckPassed,
  setIdCardImage,
  setSelfieImage,
  setVerificationStatus,
  setVerificationResult,
  setTakeExamCode,
  setCandicateInfo,
  startTakeExam,
  setLoading,
  setStep,
  setError,
  setUserId,
  setUserEmail,
} = takeExamSlice.actions

export default takeExamSlice.reducer

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from 'antd'
import { useToast } from '../../hooks/useToast'
import { useRequestOtpMutation, useLazyGetSessionInfoQuery } from '../../services/api/take-exam'
import axios from 'axios'
import CheckInWizard from './check-component/CheckInWizard'
import KYCFlow from './check-component/KYCFlow'

const PrepareCheckCandidateSystem = () => {
  const { roomId, userId } = useParams<{ roomId: string; userId: string }>()
  const navigate = useNavigate()
  const [requestOtp] = useRequestOtpMutation()
  const [getSessionInfo] = useLazyGetSessionInfoQuery()
  const toast = useToast()

  // Core flow states
  const [checkInComplete, setCheckInComplete] = useState(false)
  const [kycComplete, setKycComplete] = useState(false)
  const [sessionSettings, setSessionSettings] = useState<any>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [whitelistStatus, setWhitelistStatus] = useState<{hasAvatar: boolean} | null>(null)
  const [checkingWhitelist, setCheckingWhitelist] = useState(false)
  
  // Thêm ref để ngăn chặn gọi API nhiều lần
  const hasRequestedOtp = useRef(false)

  // Map settings từ backend format sang frontend format
  // Backend có thể trả về snake_case (từ DB) hoặc camelCase (từ Java)
  const mapBackendSettingsToFrontend = (backendSettings: any) => {
    if (!backendSettings) return null

    // Hỗ trợ cả snake_case và camelCase
    const antiCheat = backendSettings.antiCheat || backendSettings.anti_cheat || {}
    
    // Hỗ trợ cả snake_case và camelCase cho các fields
    const blockCopyPaste = antiCheat.blockCopyPaste ?? antiCheat.block_copy_paste ?? false
    const blockDevTools = antiCheat.blockDevTools ?? antiCheat.block_dev_tools ?? false
    const maxWindowBlurAllowed = antiCheat.maxWindowBlurAllowed ?? antiCheat.max_window_blur_allowed
    const maxExitFullscreenAllowed = antiCheat.maxExitFullscreenAllowed ?? antiCheat.max_exit_fullscreen_allowed
    
    // Map từ backend format sang frontend format
    const frontendSettings = {
      disableCopyPaste: !!blockCopyPaste,
      disableDeveloperTools: !!blockDevTools,
      preventTabSwitch: maxWindowBlurAllowed !== null && maxWindowBlurAllowed !== undefined,
      preventMinimize: maxExitFullscreenAllowed !== null && maxExitFullscreenAllowed !== undefined,
      requireFullscreen: maxExitFullscreenAllowed !== null && maxExitFullscreenAllowed !== undefined,
      maxFullscreenExitAllowed: maxExitFullscreenAllowed ?? undefined,
    }

    // Chỉ trả về settings nếu có ít nhất một setting được enable
    const hasAnySetting = Object.values(frontendSettings).some(v => v === true)
    
    return hasAnySetting ? frontendSettings : null
  }

  // Lấy session info và settings khi component mount
  useEffect(() => {
    const fetchSessionInfo = async () => {
      if (roomId) {
        console.log('📡 PrepareCheckCandidateSystem - Fetching session info for roomId:', roomId)
        try {
          const response = await getSessionInfo(roomId).unwrap()
          setSessionInfo(response)
          console.log('📡 PrepareCheckCandidateSystem - Session info received:', {
            hasSettings: !!response.settings,
            backendSettings: response.settings,
            settingsKeys: response.settings ? Object.keys(response.settings) : [],
            antiCheat: response.settings?.antiCheat || response.settings?.anti_cheat,
            antiCheatKeys: response.settings?.antiCheat ? Object.keys(response.settings.antiCheat) : 
                          response.settings?.anti_cheat ? Object.keys(response.settings.anti_cheat) : [],
            fullResponse: response,
          })
          
          // Map settings từ backend format sang frontend format
          const mappedSettings = mapBackendSettingsToFrontend(response.settings)
          console.log('📡 PrepareCheckCandidateSystem - Mapped settings:', {
            backendSettings: response.settings,
            frontendSettings: mappedSettings,
            hasMappedSettings: !!mappedSettings,
          })
          
          setSessionSettings(mappedSettings)
          console.log('📡 PrepareCheckCandidateSystem - Settings set to state:', mappedSettings)
        } catch (err) {
          console.warn('📡 PrepareCheckCandidateSystem - Failed to fetch session info:', err)
          // Nếu không lấy được, vẫn tiếp tục với settings = null
          setSessionSettings(null)
        }
      } else {
        console.warn('📡 PrepareCheckCandidateSystem - No roomId provided')
      }
    }
    fetchSessionInfo()
  }, [roomId, getSessionInfo])

  // Check whitelist status when session info is loaded and mode is UPLOAD
  useEffect(() => {
    const checkWhitelist = async () => {
      const settings = sessionInfo?.settings
      const proctoring = settings?.proctoring
      const identityMode = proctoring?.identity_mode || proctoring?.identityMode

      if (identityMode === 'UPLOAD' && userId && sessionInfo.sessionId) {
        setCheckingWhitelist(true)
        try {
          const formData = new FormData()
          formData.append('email', userId)
          formData.append('session_id', sessionInfo.sessionId.toString())
          
          const response = await axios.post('http://localhost:8000/api/kyc/check-whitelist', formData)
          setWhitelistStatus({ hasAvatar: response.data.has_avatar })
          console.log('Whitelist check result:', response.data)
        } catch (err) {
          console.error("Error checking whitelist:", err)
          setWhitelistStatus({ hasAvatar: false })
        } finally {
          setCheckingWhitelist(false)
        }
      }
    }
    
    const settings = sessionInfo?.settings
    const proctoring = settings?.proctoring
    const identityMode = proctoring?.identity_mode || proctoring?.identityMode

    if (sessionInfo && !whitelistStatus && !checkingWhitelist && identityMode === 'UPLOAD') {
        checkWhitelist()
    }
  }, [sessionInfo, userId, whitelistStatus, checkingWhitelist])

  // Skip KYC if identity_mode is not UPLOAD
  useEffect(() => {
    if (sessionInfo && checkInComplete && !kycComplete) {
      const settings = sessionInfo?.settings
      const proctoring = settings?.proctoring
      const identityMode = proctoring?.identity_mode || proctoring?.identityMode
      
      if (identityMode !== 'UPLOAD') {
         console.log('Skipping KYC because identity_mode is', identityMode)
         setKycComplete(true)
      }
    }
  }, [sessionInfo, checkInComplete, kycComplete])

  // Handle OTP request with navigation
  const handleRequestOtp = async () => {
    if (!roomId || !userId) {
      toast.warning('Phải nhập đủ thông tin')
      return
    }

    if (hasRequestedOtp.current) return // Prevent duplicates - chỉ check ref này thôi

    hasRequestedOtp.current = true // Đánh dấu đã gọi rồi - KHÔNG BAO GIỜ RESET

    try {
      await requestOtp({ sessionCode: roomId, email: userId }).unwrap()
      navigate('/exam-checkin-info', {
        state: {
          examCode: roomId,
          email: userId,
        },
      })
    } catch (err: any) {
      const errorMessage = err?.data?.message || 'Có lỗi xảy ra khi yêu cầu OTP. Vui lòng thử lại.'
      
      // Hiển thị popup lỗi và redirect ngay
      Modal.error({
        title: 'Lỗi',
        content: errorMessage,
        okText: 'OK',
        onOk: () => {
          // Quay về trang exam-checkin
          navigate(`/exam-checkin?code=${roomId}`)
        },
        onCancel: () => {
          // Nếu user đóng popup không nhấn OK
          navigate(`/exam-checkin?code=${roomId}`)
        },
      })
      
      // Tự động redirect sau 5 giây nếu user không nhấn gì
      setTimeout(() => {
        navigate(`/exam-checkin?code=${roomId}`)
      }, 5000)
      
      // KHÔNG set loading = false để giữ màn hình loading
      // KHÔNG RESET hasRequestedOtp.current để tránh vòng lặp
    }
  }

  // Trigger OTP request once prerequisites are met
  useEffect(() => {
    if (roomId && userId && checkInComplete && kycComplete && !hasRequestedOtp.current) {
      handleRequestOtp()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    roomId,
    userId,
    checkInComplete,
    kycComplete,
    // KHÔNG bao gồm isNavigating để tránh vòng lặp
  ])

  // Early returns for flow steps
  if (!checkInComplete) {
    // Merge settings với examCode để redirect về đúng trang checkin
    const settingsWithExamCode = sessionSettings ? {
      ...sessionSettings,
      examCode: roomId || '',
    } : { examCode: roomId || '' }
    
    console.log('📡 PrepareCheckCandidateSystem - Rendering CheckInWizard with settings:', {
      sessionSettings,
      settingsWithExamCode,
      hasSettings: !!sessionSettings,
      settingsKeys: sessionSettings ? Object.keys(sessionSettings) : [],
      examCode: roomId,
    })
    return (
      <div style={{ padding: 24 }}>
        <CheckInWizard
          settings={settingsWithExamCode}
          onComplete={(checks) => {
            setCheckInComplete(true)
            console.log('Check-in completed:', checks)
          }}
          onCancel={() => {
            // Optional: Handle cancel, e.g., navigate back
            console.log('Check-in cancelled')
          }}
        />
      </div>
    )
  }

  if (!kycComplete) {
    if (checkingWhitelist) {
        return <div style={{ padding: 24, textAlign: 'center' }}>Đang kiểm tra thông tin xác thực...</div>
    }
    
    const settings = sessionInfo?.settings
    const proctoring = settings?.proctoring
    const identityMode = proctoring?.identity_mode || proctoring?.identityMode

    return (
      <div style={{ padding: 24 }}>
        <KYCFlow
          onComplete={(result) => {
            setKycComplete(true)
            console.log('KYC completed:', result)
          }}
          onCancel={() => {
            // Optional: Handle cancel
            console.log('KYC cancelled')
          }}
          isWhitelistMode={identityMode === 'UPLOAD' && whitelistStatus?.hasAvatar === true}
          email={userId}
          sessionId={sessionInfo?.sessionId}
          candidateId={userId}
        />
      </div>
    )
  }

  // Main content - luôn hiển thị loading khi đang xử lý
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p>Đang chuẩn bị... Vui lòng chờ.</p>
    </div>
  )
}

export default PrepareCheckCandidateSystem

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useRequestOtpMutation } from '../../services/api/take-exam'
import CheckInWizard from './check-component/CheckInWizard'
import KYCFlow from './check-component/KYCFlow'

const PrepareCheckCandidateSystem = () => {
  const { roomId, userId } = useParams<{ roomId: string; userId: string }>()
  const navigate = useNavigate()
  const [requestOtp, { isLoading: isRequestOtpLoading }] =
    useRequestOtpMutation()
  const toast = useToast()

  // Core flow states
  const [checkInComplete, setCheckInComplete] = useState(false)
  const [kycComplete, setKycComplete] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Media/monitoring states (group if expanded later)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle OTP request with navigation
  const handleRequestOtp = async () => {
    if (!roomId || !userId) {
      toast.warning('Phải nhập đủ thông tin')
      return
    }

    if (isNavigating || isRequestOtpLoading) return // Prevent duplicates

    setIsNavigating(true)
    setLoading(true)
    setError(null)

    try {
      await requestOtp({ sessionCode: roomId, email: userId }).unwrap()
      navigate('/exam-checkin-verify-code', {
        state: {
          examCode: roomId,
          email: userId,
        },
      })
    } catch (err: any) {
      setError(err?.data?.message || 'Request OTP failed')
      toast.error('Yêu cầu OTP thất bại. Vui lòng thử lại.')
      setIsNavigating(false)
    } finally {
      setLoading(false)
    }
  }

  // Trigger OTP request once prerequisites are met
  useEffect(() => {
    if (roomId && userId && checkInComplete && kycComplete && !isNavigating) {
      handleRequestOtp()
    }
  }, [
    roomId,
    userId,
    checkInComplete,
    kycComplete,
    isNavigating,
    isRequestOtpLoading,
  ])

  // Early returns for flow steps
  if (!checkInComplete) {
    return (
      <div style={{ padding: 24 }}>
        <CheckInWizard
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
        />
      </div>
    )
  }

  // Main content (expand as needed; currently navigating away)
  if (isNavigating || loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Đang chuẩn bị... Vui lòng chờ.</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    )
  }

  // Placeholder for full exam prep UI (e.g., video, chat, monitoring)
  return (
    <div style={{ padding: 24 }}>
      <h1>PrepareCheckCandidateSystem</h1>
      {/* Expand with actual UI: video elements, chat, controls, etc. */}
      <p>
        Room: {roomId} | User: {userId}
      </p>
      <p>Check-in: ✅ | KYC: ✅</p>
      {/* Example: Add media controls, alerts, etc. */}
    </div>
  )
}

export default PrepareCheckCandidateSystem

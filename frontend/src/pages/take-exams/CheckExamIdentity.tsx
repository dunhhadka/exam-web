import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../../store'
import { setVerificationResult } from '../../store/slices/takeExamSlice'
import KYCFlow from './check-component/KYCFlow'
import { Spin, Result, Button, message } from 'antd'
import { useGetSessionInfoQuery } from '../../services/api/take-exam'
import axios from 'axios'

const CheckExamIdentity: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { takeExamSession } = useSelector((state: RootState) => state.takeExam)
  const examCode = takeExamSession.examCode
  const [checkingWhitelist, setCheckingWhitelist] = useState(false)
  const [whitelistStatus, setWhitelistStatus] = useState<{hasAvatar: boolean} | null>(null)

  const { data: sessionInfo, isLoading, error } = useGetSessionInfoQuery(examCode || '', {
    skip: !examCode
  })

  // Check whitelist status when session info is loaded and mode is WHITELIST
  useEffect(() => {
    const checkWhitelist = async () => {
      if (sessionInfo?.accessMode === 'WHITELIST' && takeExamSession.candicateInfo?.email && sessionInfo.sessionId) {
        setCheckingWhitelist(true)
        try {
          const formData = new FormData()
          formData.append('email', takeExamSession.candicateInfo.email)
          formData.append('session_id', sessionInfo.sessionId.toString())
          
          const response = await axios.post('http://localhost:8000/api/kyc/check-whitelist', formData)
          setWhitelistStatus({ hasAvatar: response.data.has_avatar })
          
          if (!response.data.has_avatar) {
             message.warning("Không tìm thấy ảnh mẫu trong whitelist. Vui lòng upload ảnh ID.")
          }
        } catch (err) {
          console.error("Error checking whitelist:", err)
          // Fallback to manual upload if check fails
          setWhitelistStatus({ hasAvatar: false })
        } finally {
          setCheckingWhitelist(false)
        }
      }
    }
    
    if (sessionInfo && !whitelistStatus && !checkingWhitelist) {
        checkWhitelist()
    }
  }, [sessionInfo, takeExamSession.candicateInfo, whitelistStatus, checkingWhitelist])

  useEffect(() => {
    if (sessionInfo) {
      // Check settings
      const settings = sessionInfo.settings || {}
      const requireIdUpload = settings.proctoring?.require_id_upload
      
      // If require_id_upload is explicitly false, skip KYC
      if (requireIdUpload === false) {
        dispatch(setVerificationResult({ matched: true }))
        navigate('/exam-checkin?code=' + examCode)
      }
    }
  }, [sessionInfo, dispatch, navigate, examCode])

  const handleKYCComplete = (result: any) => {
    if (result.passed) {
      dispatch(setVerificationResult({ matched: true }))
      navigate('/exam-checkin?code=' + examCode)
    }
  }

  if (!examCode) {
     return <Result status="error" title="Missing Exam Code" subTitle="Please join via code again." extra={<Button onClick={() => navigate('/')}>Go Home</Button>} />
  }

  if (isLoading || checkingWhitelist) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />
  }
  
  if (error) {
      return <Result status="error" title="Error loading session info" />
  }

  // Determine mode
  // Case 1: Whitelist mode AND we found avatar in DB -> Skip ID Upload
  // Case 2: Whitelist mode BUT no avatar -> Fallback to Manual Upload (isWhitelistMode = false)
  // Case 3: Normal mode -> Manual Upload
  
  const isWhitelistAccess = sessionInfo?.accessMode === 'WHITELIST'
  const hasWhitelistAvatar = whitelistStatus?.hasAvatar === true
  
  // Only enable "Whitelist Mode" (skip ID upload) if access is WHITELIST AND we actually have the avatar
  const isWhitelistMode = isWhitelistAccess && hasWhitelistAvatar

  return (
    <KYCFlow 
      onComplete={handleKYCComplete}
      onCancel={() => navigate(-1)}
      isWhitelistMode={isWhitelistMode}
      email={takeExamSession.candicateInfo?.email}
      sessionId={sessionInfo?.sessionId}
      candidateId={takeExamSession.candicateInfo?.id || takeExamSession.candicateInfo?.email || "unknown"}
    />
  )
}

export default CheckExamIdentity

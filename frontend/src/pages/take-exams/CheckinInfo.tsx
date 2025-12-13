import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { useStartExamAttemptMutation, useVerifyOtpMutation, useResendOtpMutation } from '../../services/api/take-exam'
import { StartAttemptRequest } from '../../types/take-exam'
import { useDispatch } from 'react-redux'
import { setUserEmail, setUserId } from '../../store/slices/takeExamSlice'
import { useToast } from '../../hooks/useToast'

const CheckInInfo = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = location
  const toast = useToast()

  const [step, setStep] = useState<'otp' | 'info'>('otp')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifiedSessionId, setVerifiedSessionId] = useState<number | null>(null)
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null)

  const email = state?.email
  const examCode = state?.examCode || state?.sessionCode
  const tokenJoinStart = state?.tokenJoinStart || verifiedToken
  const sessionId = state?.sessionId || verifiedSessionId
  const sessionSettings = state?.sessionSettings

  const [verifyOtp, { isLoading: isVerifyLoading }] = useVerifyOtpMutation()
  const [resendOtp, { isLoading: isResendLoading }] = useResendOtpMutation()
  const dispatch = useDispatch()

  useEffect(() => {
    if ((tokenJoinStart || verifiedToken) && (sessionId || verifiedSessionId)) {
      setStep('info')
    } else if (!email || !examCode) {
      toast.error('Bạn phải thực hiện nhập email và mã bài thi')
      navigate(-1)
    }
  }, [email, examCode, tokenJoinStart, sessionId, verifiedToken, verifiedSessionId, navigate, toast])

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số')
      return
    }

    try {
      const res = await verifyOtp({
        sessionCode: examCode,
        email: email,
        otp: otp,
      }).unwrap()

      toast.success('Xác thực thành công!')
      
      // Lưu sessionId và token vào state
      setVerifiedSessionId(res.sessionId)
      setVerifiedToken(res.tokenJoinStart)
      
      setStep('info')
      
      // Store token and sessionId for next step
      const updatedState = {
        ...state,
        tokenJoinStart: res.tokenJoinStart,
        sessionId: res.sessionId,
        sessionName: res.sessionName,
        email: res.email,
      }
      window.history.replaceState(
        updatedState,
        '',
        window.location.pathname
      )
    } catch (error) {
      toast.error('Mã OTP không đúng, vui lòng thử lại')
    }
  }

  const handleInfoSubmit = async () => {
    if (!name.trim()) {
      return
    }

    // Lấy sessionId và token từ nhiều nguồn để đảm bảo có giá trị
    const finalSessionId = verifiedSessionId || sessionId || location.state?.sessionId
    const finalToken = verifiedToken || tokenJoinStart || location.state?.tokenJoinStart

    if (!finalSessionId) {
      toast.error('Thiếu thông tin session. Vui lòng thử lại từ đầu.')
      return
    }

    if (!finalToken) {
      toast.error('Thiếu thông tin token. Vui lòng thử lại từ đầu.')
      return
    }

    setLoading(true)
    try {
      const startExamRequest: StartAttemptRequest = {
        sessionId: finalSessionId,
        sessionToken: finalToken,
        email: email,
        name: name,
      }

      dispatch(setUserId(email))
      dispatch(setUserEmail(email))

      navigate('/do-exam', { 
        state: { 
          startExamRequest, 
          tokenJoinStart: finalToken, 
          sessionSettings 
        } 
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email || !examCode) {
      toast.error('Thiếu thông tin email hoặc mã bài thi')
      return
    }

    try {
      await resendOtp({
        sessionCode: examCode,
        email: email,
      }).unwrap()

      toast.success('Đã gửi lại mã OTP. Vui lòng kiểm tra email của bạn.')
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.'
      toast.error(errorMessage)
    }
  }

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      if (step === 'otp' && otp.length === 6) {
        handleOtpSubmit()
      } else if (step === 'info' && name.trim()) {
        handleInfoSubmit()
      }
    }
  }

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <StepsWrapper>
            <StepItem>
              <div className="step-icon">✓</div>
              <span className="step-label">Kiểm tra hệ thống</span>
            </StepItem>
            <StepItem>
              <div className="step-icon">✓</div>
              <span className="step-label">Xác minh danh tính</span>
            </StepItem>
            <StepItem active>
              <div className="step-icon">✓</div>
              <span className="step-label">Thông tin thí sinh</span>
            </StepItem>
            <StepItem>
              <div className="step-icon">📝</div>
              <span className="step-label">Tham dự bài thi</span>
            </StepItem>
          </StepsWrapper>
        </HeaderContent>
      </Header>

      <MainContent>
        <HeaderSection>
          <div className="title-wrapper">
            <span className="icon">{step === 'otp' ? '🔐' : '👤'}</span>
            <h1>{step === 'otp' ? 'Xác thực OTP' : 'Thông tin người tham gia'}</h1>
          </div>
          <div className="subtitle">
            {step === 'otp' 
              ? `Vui lòng nhập mã OTP gồm 6 chữ số đã được gửi đến email ${email}`
              : 'Vui lòng nhập tên của bạn để bắt đầu làm bài thi'
            }
          </div>
        </HeaderSection>

        <CardWrapper>
          {step === 'otp' ? (
            <Card>
              <OTPWrapper>
                <Input.OTP
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  size="large"
                />
              </OTPWrapper>

              <ActionButtons>
                <SubmitButton
                  type="primary"
                  size="large"
                  loading={isVerifyLoading}
                  disabled={otp.length !== 6}
                  onClick={handleOtpSubmit}
                >
                  Xác nhận
                </SubmitButton>
              </ActionButtons>

              <ResendWrapper>
                <ResendText>Không nhận được mã?</ResendText>
                <ResendButton 
                  type="link" 
                  onClick={handleResendOtp}
                  loading={isResendLoading}
                  disabled={isResendLoading}
                >
                  Gửi lại
                </ResendButton>
              </ResendWrapper>
            </Card>
          ) : (
            <Card>
              <FormWrapper>
                <StyledInput
                  size="large"
                  placeholder="Nhập họ và tên của bạn"
                  prefix={<UserOutlined style={{ color: '#999' }} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={100}
                />
              </FormWrapper>

              <ActionButtons>
                <SubmitButton
                  type="primary"
                  size="large"
                  loading={loading}
                  disabled={!name.trim()}
                  onClick={handleInfoSubmit}
                >
                  Bắt đầu làm bài
                </SubmitButton>
              </ActionButtons>

              <InfoText>
                Hãy đảm bảo bạn đã sẵn sàng trước khi bắt đầu làm bài
              </InfoText>
            </Card>
          )}
        </CardWrapper>
      </MainContent>
    </PageContainer>
  )
}

export default CheckInInfo

// Styles
const PageContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
`

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 16px 0;
`

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`

const StepsWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 16px 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 28px;
    left: 60px;
    right: 60px;
    height: 2px;
    background: #d9d9d9;
    z-index: 0;
  }
`

const StepItem = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;
  z-index: 1;
  
  .step-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.active ? '#1890ff' : 'white'};
    color: ${props => props.active ? 'white' : '#999'};
    font-size: 14px;
    border: 2px solid ${props => props.active ? '#1890ff' : '#d9d9d9'};
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .step-label {
    color: ${props => props.active ? '#1890ff' : '#999'};
    font-size: 13px;
    text-align: center;
    margin-top: 4px;
  }
`

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
`

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 48px;
  
  .title-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;
    
    .icon {
      font-size: 48px;
    }
    
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
    }
  }
  
  .subtitle {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
  }
`

const CardWrapper = styled.div`
  max-width: 600px;
  margin: 0 auto;
`

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const FormWrapper = styled.div`
  margin-bottom: 32px;
`

const StyledInput = styled(Input)`
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  
  .ant-input-prefix {
    margin-right: 12px;
  }
`

const OTPWrapper = styled.div`
  margin-bottom: 32px;
  display: flex;
  justify-content: center;

  .ant-otp {
    display: flex !important;
    justify-content: center !important;
    gap: 12px;
  }

  .ant-otp-input {
    width: 48px !important;
    height: 56px !important;
    font-size: 24px;
    font-weight: 600;
    border-radius: 8px;
  }
`

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`

const SubmitButton = styled(Button)`
  min-width: 200px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
`

const ResendWrapper = styled.div`
  text-align: center;
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`

const ResendText = styled.span`
  font-size: 14px;
  color: #666;
`

const ResendButton = styled(Button)`
  font-size: 14px;
  font-weight: 600;
  padding: 0;
  height: auto;
`


const InfoText = styled.p`
  font-size: 13px;
  color: #999;
  text-align: center;
  margin: 0;
  line-height: 1.5;
`

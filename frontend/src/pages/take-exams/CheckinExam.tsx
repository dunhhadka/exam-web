import { useEffect, useState } from 'react'
import { Input, Button } from 'antd'
import {
  LockOutlined,
  CheckOutlined,
  MailOutlined,
  SafetyOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useJoinExamByCodeMutation,
  useRequestOtpMutation,
  useLazyGetSessionInfoQuery,
} from '../../services/api/take-exam'
import { useToast } from '../../hooks/useToast'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import {
  ExamConfig,
  loadExamConfig,
  setLoading,
  setStep,
  setTakeExamCode,
  setCandicateInfo,
} from '../../store/slices/takeExamSlice'
import { useLazyGetExamSessionByIdQuery } from '../../services/api/examsession'
import { getExamTimeStatus } from '../../hooks/useExamCountDown'

const CheckinExam = () => {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')

  const [examCode, setExamCode] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [requiresWhitelist, setRequiresWhitelist] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  const navigate = useNavigate()
  const toast = useToast()

  const [getSessionInfo, { isLoading: isLoadingInfo }] =
    useLazyGetSessionInfoQuery()
  const [joinExamByCode, { isLoading: isJoinExamLoading }] =
    useJoinExamByCodeMutation()
  const [requestOtp, { isLoading: isRequestOtpLoading }] =
    useRequestOtpMutation()

  const [getExamSessionById, { isLoading: isExamSessionLoading }] =
    useLazyGetExamSessionByIdQuery()

  // Validate email sau khi người dùng nhập xong
  useEffect(() => {
    const timer = setTimeout(() => {
      setEmailValid(
        email.length > 0 && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)
      )
    }, 500)
    return () => clearTimeout(timer)
  }, [email])

  // Validate password
  useEffect(() => {
    setPasswordValid(password.length > 0)
  }, [password])

  // Check session info when exam code changes
  useEffect(() => {
    const checkSessionInfo = async () => {
      if (examCode && examCode.length >= 6) {
        try {
          const response = await getSessionInfo(examCode).unwrap()
          setRequiresPassword(response.requiresPassword)
          setRequiresWhitelist(response.requiresWhitelist)
          setSessionChecked(true)

          if (response.requiresPassword) {
            toast.info('Phiên thi này yêu cầu mật khẩu')
          } else if (response.requiresWhitelist) {
            toast.info('Phiên thi này chỉ cho phép email trong danh sách')
          }
        } catch (err: any) {
          toast.error(err?.data?.message || 'Không tìm thấy phiên thi')
          setSessionChecked(false)
        }
      } else {
        setSessionChecked(false)
        setRequiresPassword(false)
        setRequiresWhitelist(false)
      }
    }

    const timer = setTimeout(checkSessionInfo, 500)
    return () => clearTimeout(timer)
  }, [examCode, getSessionInfo, toast])

  const dispatch = useDispatch()
  const {
    currentStep,
    examConfig,
    error,
    isLoading,
    takeExamSession,
    systemCheck,
    identityVerification,
  } = useSelector((state: RootState) => state.takeExam)

  const handleRequestOtp = async () => {
    // Validate inputs
    if (!examCode) {
      toast.warning('Phải nhập mã truy cập bài thi')
      return
    }

    if (!sessionChecked) {
      toast.warning('Đang kiểm tra thông tin phiên thi, vui lòng đợi')
      return
    }

    if (requiresPassword && !password) {
      toast.warning('Phải nhập mật khẩu')
      return
    }

    if (!email) {
      toast.warning('Phải nhập email')
      return
    }

    if (!emailValid) {
      toast.warning('Email không hợp lệ')
      return
    }

    // Dispatch email to Redux store so it's available for KYC
    dispatch(setCandicateInfo({ email: email }))

    const examSessionInfo = await getSessionInfo(examCode).unwrap()
    if (!examSessionInfo) {
      toast.error('Không tìm thấy phiên thi')
      return
    }

    console.log('examSessionInfo', examSessionInfo)

    const status = getExamTimeStatus(
      examSessionInfo.startTime,
      examSessionInfo.endTime
    )

    if (status === 'NOT_STARTED') {
      toast.warning(
        'Phiên thi chưa bắt đầu. Vui lòng tham gia khi phiên thi bắt đầu.'
      )
      return
    } else if (status === 'ENDED') {
      toast.warning(
        'Phiên thi đã kết thúc. Bạn không thể tham gia phiên thi này.'
      )
      return
    }

    if (status === 'COUNTDOWN') {
      toast.info('Phiên thi sắp bắt đầu. Vui lòng chuẩn bị.')
      // get value
      navigate(`/exam-waiting/${examSessionInfo.sessionId}`, {
        state: {
          examSessionInfo,
          email,
        },
      })
      return
    }

    navigate(`/candidate/${examCode}/${email}`)

    try {
      // Step 1: Verify session access (password check if needed)
      // const joinRequest: any = { code: examCode }
      // if (requiresPassword) {
      //   joinRequest.password = password
      // }
      // await joinExamByCode(joinRequest).unwrap()
      // // Step 2: Request OTP
      // await requestOtp({ sessionCode: examCode, email: email }).unwrap()
      // // Step 3: Navigate to OTP verification
      // navigate('/exam-checkin-verify-code', {
      //   state: {
      //     examCode,
      //     email,
      //   },
      // })
    } catch (err: any) {
      const errorMessage =
        err?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      toast.error(errorMessage)
      navigate(`/candidate/${examCode}/${email}`)

      // try {
      //   await requestOtp({ sessionCode: examCode, email: email })
      //   navigate('/exam-checkin-verify-code', {
      //     state: {
      //       examCode,
      //       email,
      //     },
      //   })
      // } catch (err) {}
    }
  }

  const handleSubmit = async () => {
    if (!examCode) {
      toast.warning('Phải nhập mã truy cập bài thi')
      return
    }

    try {
      const res = await joinExamByCode({ code: examCode }).unwrap()
      if (!!res.status && res.status !== 200) {
        toast.error(res.message)
        return
      } else {
        toast.info(res.message)
      }
    } catch (err) {
      console.log(err)
    }
  }

  const initalizeExam = async () => {
    const code = searchParams.get('code')
    if (!code) {
      toast.error('Mã bài thi không hợp lệ.')
      navigate('/')
      return
    }

    dispatch(setTakeExamCode(code))
    dispatch(setLoading(true))

    //TODO: get config from server
    const config: ExamConfig = {
      requireCammera: true,
      requireExtendedDisplayCheck: true,
      requireIdentityVerification: true,
      allowedExtendDisplays: 1,
    }

    dispatch(loadExamConfig(config))

    if (
      (config.requireCammera || config.requireExtendedDisplayCheck) &&
      !systemCheck.isPassed &&
      !identityVerification.isPassed
    ) {
      dispatch(setStep('system-check'))
      //navigate('/identity-verification')
      // navigate('/check-exam-system')
    }
  }

  useEffect(() => {
    if (!!code) {
      setExamCode(code)
    }
  }, [code])

  useEffect(() => {
    initalizeExam()
  }, [])

  return (
    <Container>
      <BackgroundPattern />
      <ContentWrapper>
        <LogoSection>
          <LogoCircle>
            <SafetyOutlined />
          </LogoCircle>
        </LogoSection>

        <Card>
          <CardHeader>
            <HeaderBadge>
              <SafetyOutlined style={{ fontSize: '16px' }} />
              <span>Xác thực an toàn</span>
            </HeaderBadge>
            <Title>Truy cập bài thi</Title>
            <Subtitle>
              Vui lòng nhập mã truy cập và email để bắt đầu làm bài kiểm tra
            </Subtitle>
          </CardHeader>

          <FormContent>
            <InputGroup>
              <InputLabel>
                <LockOutlined style={{ marginRight: '6px' }} />
                Mã truy cập bài thi
              </InputLabel>
              <StyledInput
                placeholder="Nhập mã truy cập"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                size="large"
                suffix={
                  sessionChecked && (
                    <CheckCircle>
                      <CheckOutlined style={{ fontSize: '12px' }} />
                    </CheckCircle>
                  )
                }
              />
            </InputGroup>

            {requiresPassword && (
              <InputGroup>
                <InputLabel>
                  <LockOutlined style={{ marginRight: '6px' }} />
                  Mật khẩu bài thi
                </InputLabel>
                <StyledInput
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="large"
                  suffix={
                    passwordValid && (
                      <CheckCircle>
                        <CheckOutlined style={{ fontSize: '12px' }} />
                      </CheckCircle>
                    )
                  }
                />
              </InputGroup>
            )}

            <InputGroup>
              <InputLabel>
                <MailOutlined style={{ marginRight: '6px' }} />
                Email của bạn
              </InputLabel>
              <StyledInput
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="large"
                autoComplete="off"
                suffix={
                  emailValid && (
                    <CheckCircle>
                      <CheckOutlined style={{ fontSize: '12px' }} />
                    </CheckCircle>
                  )
                }
              />
            </InputGroup>

            <InfoBox>
              <InfoIcon>ℹ️</InfoIcon>
              <InfoText>
                {requiresWhitelist
                  ? 'Email của bạn phải có trong danh sách được phép. Mã OTP sẽ được gửi đến email để xác thực.'
                  : 'Mã OTP sẽ được gửi đến email của bạn để xác thực danh tính'}
              </InfoText>
            </InfoBox>

            <ButtonGroup>
              <SubmitButton
                type="primary"
                size="large"
                block
                loading={isJoinExamLoading || isRequestOtpLoading}
                disabled={
                  !sessionChecked ||
                  !emailValid ||
                  (requiresPassword && !passwordValid)
                }
                onClick={handleRequestOtp}
              >
                Tiếp tục
                <ArrowRightOutlined style={{ marginLeft: '8px' }} />
              </SubmitButton>
            </ButtonGroup>
            {/* <SubmitButton
              type="primary"
              size="large"
              block
              loading={isJoinExamLoading || isRequestOtpLoading}
              icon={<CheckOutlined />}
              onClick={handleRequestOtp}
            >
              Tiếp tục
            </SubmitButton> */}
          </FormContent>
        </Card>

        <Footer>
          <FooterText>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <FooterLink href="#">Điều khoản sử dụng</FooterLink> và{' '}
            <FooterLink href="#">Chính sách bảo mật</FooterLink>
          </FooterText>
        </Footer>
      </ContentWrapper>
    </Container>
  )
}

export default CheckinExam

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  padding: 24px;
  position: relative;
  overflow: hidden;
`

const BackgroundPattern = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(#e8e8e8 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.4;
  pointer-events: none;
`

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  animation: fadeIn 0.6s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 32px;
`

const LogoCircle = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.25);
  animation: float 3s ease-in-out infinite;

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`

const Card = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: 48px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 576px) {
    padding: 32px 24px;
  }
`

const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`

const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0f7ff;
  color: #1890ff;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
  border: 1px solid #d6e9ff;
`

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #262626;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
`

const Subtitle = styled.p`
  font-size: 15px;
  color: #8c8c8c;
  margin: 0;
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
`

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
`

const StyledInput = styled(Input)`
  height: 52px;
  border-radius: 12px;
  border: 2px solid #f0f0f0;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 20px;

  &:hover {
    border-color: #d9d9d9;
  }

  &:focus,
  &.ant-input-focused {
    border-color: #1890ff;
    box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.08);
  }

  &::placeholder {
    color: #bfbfbf;
  }
`

const CheckCircle = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #52c41a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease;

  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
`

const InfoBox = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #f6f8fa;
  border-radius: 12px;
  border: 1px solid #e8eaed;
`

const InfoIcon = styled.div`
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
`

const InfoText = styled.p`
  font-size: 13px;
  color: #595959;
  margin: 0;
  line-height: 1.6;
`

const ButtonGroup = styled.div`
  margin-top: 8px;
`

const SubmitButton = styled(Button)`
  height: 56px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(24, 144, 255, 0.35);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #f5f5f5;
    color: #bfbfbf;
  }
`

const Footer = styled.div`
  margin-top: 32px;
  text-align: center;
`

const FooterText = styled.p`
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
  line-height: 1.6;
`

const FooterLink = styled.a`
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #096dd9;
    text-decoration: underline;
  }
`

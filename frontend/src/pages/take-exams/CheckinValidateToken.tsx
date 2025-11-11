import styled from '@emotion/styled'
import { Button, Input } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useVerifyOtpMutation } from '../../services/api/take-exam'

const CheckinValidateToken = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location

  const email = state?.email
  const examCode = state?.examCode

  const [verifyOtp, { isLoading: isVerifyLoading }] = useVerifyOtpMutation()

  const toast = useToast()

  const [otp, setOtp] = useState('')

  useEffect(() => {
    if (!email || !examCode) {
      toast.error('Bạn phải thực hiện nhập email và mã bài thi')
      navigate(-1)
    } else {
      toast.success(`Nhập mã nhận được từ email ${email}`)
    }
  }, [email, examCode, navigate, toast])

  const handleChange = (value: string) => {
    setOtp(value)
  }

  const handleSubmit = async () => {
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

      console.log('OTP:', otp)
      toast.success('Xác thực thành công!')
      // navigate('/next-page')

      navigate('/exam-checkin-info', {
        state: {
          tokenJoinStart: res.tokenJoinStart,
          sessionId: res.sessionId,
          sessionName: res.sessionName,
          email: res.email,
        },
      })
    } catch (error) {
      toast.error('Mã OTP không đúng, vui lòng thử lại')
    }
  }

  const handleResend = () => {
    toast.success('Đã gửi lại mã OTP')
    // Call API để resend OTP
  }

  return (
    <Container>
      <ContentWrapper>
        <Title>Xác thực OTP</Title>
        <Description>
          Vui lòng nhập mã OTP gồm 6 chữ số đã được gửi đến email
          <EmailText>{email}</EmailText>
        </Description>

        <OTPWrapper>
          <Input.OTP
            length={6}
            value={otp}
            onChange={handleChange}
            size="large"
          />
        </OTPWrapper>

        <SubmitButton
          type="primary"
          size="large"
          block
          loading={isVerifyLoading}
          disabled={otp.length !== 6}
          onClick={handleSubmit}
        >
          Xác nhận
        </SubmitButton>

        <ResendWrapper>
          <ResendText>Không nhận được mã?</ResendText>
          <ResendButton type="link" onClick={handleResend}>
            Gửi lại
          </ResendButton>
        </ResendWrapper>
      </ContentWrapper>
    </Container>
  )
}

export default CheckinValidateToken

// Styles
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`

const ContentWrapper = styled.div`
  background: white;
  padding: 48px 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 480px;
  width: 100%;
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
  margin-bottom: 12px;
`

const Description = styled.p`
  font-size: 15px;
  color: #666;
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.6;
`

const EmailText = styled.span`
  display: block;
  color: #667eea;
  font-weight: 600;
  margin-top: 8px;
  word-break: break-all;
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
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    transition: all 0.3s;

    &:hover {
      border-color: #667eea;
    }

    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`

const SubmitButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: #667eea;
  border: none;

  &:hover:not(:disabled) {
    background: #5568d3;
  }

  &:disabled {
    background: #e0e0e0;
    color: #999;
  }
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

  &:hover {
    color: #5568d3;
  }
`

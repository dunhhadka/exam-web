import { useEffect, useState } from 'react'
import { Input, Button } from 'antd'
import {
  LockOutlined,
  CheckOutlined,
  MailOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useJoinExamByCodeMutation,
  useRequestOtpMutation,
} from '../../services/api/take-exam'
import { useToast } from '../../hooks/useToast'

const CheckinExam = () => {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')

  const [examCode, setExamCode] = useState('')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const toast = useToast()
  const [joinExamByCode, { isLoading }] = useJoinExamByCodeMutation()
  const [requestOtp, { isLoading: isRequestOtpLoading }] =
    useRequestOtpMutation()

  const handleRequestOtp = async () => {
    if (!examCode || !email) {
      toast.warning('Phải nhập đủ thông tin')
      return
    }

    try {
      await requestOtp({ sessionCode: examCode, email: email })
      navigate('/exam-checkin-verify-code', {
        state: {
          examCode,
          email,
        },
      })
    } catch (err) {}
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

  useEffect(() => {
    if (!!code) {
      setExamCode(code)
    }
  }, [code])

  return (
    <Container>
      <BackgroundDecoration />
      <ContentWrapper>
        <Card>
          <Header>
            <IconWrapper>
              <SafetyOutlined />
            </IconWrapper>
            <Title>Truy cập bài thi</Title>
            <Subtitle>Nhập thông tin để bắt đầu làm bài</Subtitle>
          </Header>

          <FormContent>
            <InputGroup>
              <InputLabel>Mã truy cập bài thi</InputLabel>
              <StyledInput
                prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                placeholder="Nhập mã truy cập"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                size="large"
              />
            </InputGroup>

            <InputGroup>
              <InputLabel>Email của bạn</InputLabel>
              <StyledInput
                prefix={<MailOutlined style={{ color: '#8c8c8c' }} />}
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="large"
              />
            </InputGroup>

            <SubmitButton
              type="primary"
              size="large"
              block
              loading={isLoading || isRequestOtpLoading}
              icon={<CheckOutlined />}
              onClick={handleRequestOtp}
            >
              Tiếp tục
            </SubmitButton>
          </FormContent>

          <Footer>
            <FooterText>
              Bạn sẽ nhận được mã OTP qua email để xác thực
            </FooterText>
          </Footer>
        </Card>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
`

const BackgroundDecoration = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(
      circle at 20% 50%,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 80%,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
  pointer-events: none;
`

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
`

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 48px 40px;
  animation: slideUp 0.5s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`

const IconWrapper = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`

const Subtitle = styled.p`
  font-size: 15px;
  color: #8c8c8c;
  margin: 0;
`

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`

const StyledInput = styled(Input)`
  height: 48px;
  border-radius: 8px;
  border: 2px solid #f0f0f0;
  font-size: 15px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
  }

  &:focus,
  &.ant-input-focused {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .ant-input-prefix {
    margin-right: 12px;
  }

  &::placeholder {
    color: #bfbfbf;
  }
`

const SubmitButton = styled(Button)`
  height: 52px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-top: 8px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5568d3 0%, #6941a0 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  transition: all 0.3s ease;
`

const Footer = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
`

const FooterText = styled.p`
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
  line-height: 1.6;
`

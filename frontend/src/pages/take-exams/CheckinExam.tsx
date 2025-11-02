import { useEffect, useState } from 'react'
import { Input, Button, Typography } from 'antd'
import { LockOutlined, CheckOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useJoinExamByCodeMutation,
  useRequestOtpMutation,
} from '../../services/api/take-exam'
import { useToast } from '../../hooks/useToast'

const { Title } = Typography

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
    }

    try {
      await requestOtp({ sessionCode: examCode, email: email })
      // TODO: save to reducer
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
      <Card>
        <Header>
          <IconWrapper>
            <LockOutlined />
          </IconWrapper>
          <Title level={3}>Truy cập bài thi</Title>
        </Header>

        <FormWrapper>
          <Label>
            Mã truy cập bài thi <Required>*</Required>
          </Label>
          <StyledInput
            placeholder="Mã truy cập bài thi"
            value={examCode}
            onChange={(e) => setExamCode(e.target.value)}
            size="large"
          />
        </FormWrapper>

        <FormWrapper>
          <Label>
            Email của bạn <Required>*</Required>
          </Label>
          <StyledInput
            placeholder="Nhập email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="large"
          />
        </FormWrapper>

        <ButtonWrapper>
          <StyledButton
            type="primary"
            size="large"
            loading={isLoading || isRequestOtpLoading}
            icon={<CheckOutlined />}
            onClick={handleRequestOtp}
          >
            Xác nhận
          </StyledButton>
        </ButtonWrapper>
      </Card>
    </Container>
  )
}

export default CheckinExam

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
`

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 48px;
  width: 100%;
  max-width: 600px;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;

  h3 {
    margin: 16px 0 0 0;
    color: #8c8c8c;
    font-weight: 500;
  }
`

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #8c8c8c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`

const FormWrapper = styled.div`
  background-color: #f5f5f5;
  padding: 32px;
  border-radius: 8px;
  margin-bottom: 32px;
`

const Label = styled.div`
  margin-bottom: 12px;
  font-size: 14px;
  color: #262626;
  font-weight: 500;
`

const Required = styled.span`
  color: #ff4d4f;
  margin-left: 4px;
`

const StyledInput = styled(Input)`
  border-radius: 6px;

  &::placeholder {
    color: #bfbfbf;
    font-style: italic;
  }
`

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const StyledButton = styled(Button)`
  min-width: 160px;
  height: 44px;
  border-radius: 6px;
  font-weight: 500;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }

  transition: all 0.3s ease;
`

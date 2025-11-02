import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { useStartExamAttemptMutation } from '../../services/api/take-exam'
import { StartAttemptRequest } from '../../types/take-exam'

const CheckInInfo = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const location = useLocation()
  const { state } = location

  const tokenJoinStart = state?.tokenJoinStart
  const sessionId = state?.sessionId
  const email = state?.email

  const handleSubmit = async () => {
    if (!name.trim()) {
      return
    }

    setLoading(true)
    try {
      // Call API để lưu thông tin và bắt đầu làm bài
      const startExamRequest: StartAttemptRequest = {
        sessionId: sessionId,
        sessionToken: tokenJoinStart,
        email: email,
        name: name,
      }

      navigate('/do-exam', { state: { startExamRequest, tokenJoinStart } })
      // Navigate đến trang làm bài
      // navigate('/exam')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSubmit()
    }
  }

  return (
    <Container>
      <ContentWrapper>
        <IconWrapper>
          <UserIconStyled />
        </IconWrapper>

        <Title>Thông tin người tham gia</Title>
        <Description>
          Vui lòng nhập tên của bạn để bắt đầu làm bài thi
        </Description>

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

          <SubmitButton
            type="primary"
            size="large"
            block
            loading={loading}
            disabled={!name.trim()}
            onClick={handleSubmit}
          >
            Bắt đầu làm bài
          </SubmitButton>
        </FormWrapper>

        <InfoText>
          Hãy đảm bảo bạn đã sẵn sàng trước khi bắt đầu làm bài
        </InfoText>
      </ContentWrapper>
    </Container>
  )
}

export default CheckInInfo

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

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
`

const UserIconStyled = styled(UserOutlined)`
  font-size: 36px;
  color: white;
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

const FormWrapper = styled.div`
  margin-bottom: 24px;
`

const StyledInput = styled(Input)`
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  font-size: 16px;
  margin-bottom: 20px;
  transition: all 0.3s;

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
`

const SubmitButton = styled(Button)`
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: #667eea;
  border: none;

  &:hover:not(:disabled) {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    background: #e0e0e0;
    color: #999;
  }

  transition: all 0.3s;
`

const InfoText = styled.p`
  font-size: 13px;
  color: #999;
  text-align: center;
  margin: 0;
  line-height: 1.5;
`

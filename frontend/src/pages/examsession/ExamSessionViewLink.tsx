import styled from '@emotion/styled'
import { ExamSession } from '../../types/examsession'
import { CopyOutlined, ShareAltOutlined } from '@ant-design/icons'
import { useToast } from '../../hooks/useToast'

interface Props {
  examsession: ExamSession
}

const ExamSessionViewLink = ({ examsession }: Props) => {
  const toast = useToast()
  const baseInviteLink = 'http://localhost:3000/exam-checkin?code='

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(baseInviteLink + examsession.code)
      toast.success('Sao chép link thành công')
    } catch (error) {
      toast.error('Sao chép link không thành công')
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(examsession.code)
      toast.success('Sao chép mã code thành công')
    } catch (err) {
      toast.error('Sao chép mã code không thành công')
    }
  }

  return (
    <Container>
      <QRCodeContainer></QRCodeContainer>

      <InstructionText>
        Quét mã QR <br /> hoặc <br /> Sao chép đường link dưới đây
      </InstructionText>

      <ActionsContainer onClick={handleCopyLink}>
        <ActionButton>
          <ShareAltOutlined />
          <span>Sao chép link</span>
        </ActionButton>

        <CodeDisplay onClick={handleCopyCode}>
          <CopyOutlined />
          <CodeText>{examsession.code}</CodeText>
        </CodeDisplay>
      </ActionsContainer>
    </Container>
  )
}

export default ExamSessionViewLink

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 400px;
  margin: 0 auto;
`

const QRCodeContainer = styled.div`
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12px;
  border: 2px dashed #d9d9d9;
`

const InstructionText = styled.span`
  text-align: center;
  font-size: 14px;
  color: #595959;
  line-height: 1.6;
`

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`

const ActionButton = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #1890ff;
  color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #40a9ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  span {
    font-weight: 500;
    font-size: 14px;
  }

  .anticon {
    font-size: 16px;
  }
`

const CodeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e6f7ff;
    border-color: #1890ff;
  }

  .anticon {
    font-size: 16px;
    color: #1890ff;
  }
`

const CodeText = styled.span`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #262626;
  font-weight: 500;
`

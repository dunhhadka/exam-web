import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Modal, Tag } from 'antd'
import { useState } from 'react'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import { useGetAttemptsBySessionQuery } from '../../services/api/attemptApi'
import {
  AttemptListResponse,
  GradingStatus,
  GradingStatusColor,
  GradingStatusLabel,
} from '../../types/attempt'
import { formatInstant } from '../../utils/times'
import { AttemptGradingModal } from './AttemptGradingModal'

interface AttemptListModalProps {
  sessionId: number
  sessionName: string
  open: boolean
  onClose: () => void
}

export const AttemptListModal = ({
  sessionId,
  sessionName,
  open,
  onClose,
}: AttemptListModalProps) => {
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(
    null
  )

  const {
    data: attempts,
    isLoading,
    isFetching,
  } = useGetAttemptsBySessionQuery(sessionId, {
    skip: !open,
  })

  const columns = [
    createColumn<AttemptListResponse>('Tên học sinh', 'studentName', {
      render: (value: string) => <StudentName>{value}</StudentName>,
    }),
    createColumn<AttemptListResponse>('Tài khoản', 'studentEmail', {
      render: (value: string) => <EmailText>{value}</EmailText>,
    }),
    createColumn<AttemptListResponse>('Mã số', 'attemptNo', {
      render: (value: number) => <AttemptTag>#{value}</AttemptTag>,
    }),
    createColumn<AttemptListResponse>('Thời gian bắt đầu', 'startedAt', {
      render: (value: string) => <TimeText>{formatInstant(value)}</TimeText>,
    }),
    createColumn<AttemptListResponse>('Thời gian nộp bài', 'submittedAt', {
      render: (value: string | null) => (
        <TimeText>{value ? formatInstant(value) : <EmptyText>Chưa nộp</EmptyText>}</TimeText>
      ),
    }),
    createColumn<AttemptListResponse>('Số câu đúng', 'correctAnswers', {
      render: (value: number, record: AttemptListResponse) => (
        <ScoreText>
          <ScoreValue>{value}</ScoreValue>/{record.totalQuestions}
        </ScoreText>
      ),
    }),
    createColumn<AttemptListResponse>('Số lỗi vi phạm', 'unansweredQuestions', {
      render: (value: number) => (
        <ViolationText violation={value > 0}>{value}</ViolationText>
      ),
    }),
    createColumn<AttemptListResponse>('Điểm', 'totalScore', {
      render: (value: number) => <TotalScore>{value}</TotalScore>,
    }),
    createColumn<AttemptListResponse>('Đã chấm điểm', 'gradingStatus', {
      render: (value: GradingStatus) => (
        <StyledTag color={GradingStatusColor[value]}>
          {GradingStatusLabel[value]}
        </StyledTag>
      ),
    }),
    createColumn<AttemptListResponse>('Hành động', 'attemptId', {
      render: (attemptId: number, record: AttemptListResponse) => (
        <ActionButtons>
          <ActionButton 
            title="Chấm điểm"
            onClick={() => setSelectedAttemptId(attemptId)}
          >
            <EditOutlined />
          </ActionButton>
          <ActionButton title="Xem chi tiết">
            <EyeOutlined />
          </ActionButton>
        </ActionButtons>
      ),
    }),
  ]

  return (
    <>
      <StyledModal
        open={open}
        title={
          <ModalHeader>
            <ModalTitle>Chấm điểm</ModalTitle>
            <SessionName>{sessionName}</SessionName>
          </ModalHeader>
        }
        onCancel={onClose}
        width={1400}
        centered
        footer={null}
        destroyOnClose
      >
        <ModalContent>
          {!isLoading && !isFetching && (!attempts || attempts.length === 0) ? (
            <EmptyState>
              <EmptyIcon>📝</EmptyIcon>
              <EmptyTitle>Chưa có học sinh nào làm bài</EmptyTitle>
              <EmptyDescription>
                Khi có học sinh tham gia và làm bài, danh sách sẽ hiển thị tại đây
              </EmptyDescription>
            </EmptyState>
          ) : (
            <TableWrapper>
              <CustomTable<AttemptListResponse>
                columns={columns}
                data={attempts ?? []}
                loading={isLoading || isFetching}
                rowKey="attemptId"
              />
            </TableWrapper>
          )}
        </ModalContent>
      </StyledModal>

      {selectedAttemptId && (
        <AttemptGradingModal
          attemptId={selectedAttemptId}
          open={!!selectedAttemptId}
          onClose={() => setSelectedAttemptId(null)}
        />
      )}
    </>
  )
}

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  }

  .ant-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    background: #ffffff;
  }

  .ant-modal-body {
    padding: 0;
    background: #fafafa;
  }

  .ant-modal-close {
    top: 16px;
    right: 16px;
  }

  .ant-modal-close-x {
    width: 40px;
    height: 40px;
    line-height: 40px;
    font-size: 16px;
    color: #8c8c8c;
  }
`

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ModalTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #262626;
`

const SessionName = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #8c8c8c;
`

const ModalContent = styled.div`
  min-height: 800px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 24px;
`

const TableWrapper = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  
  .ant-table {
    font-size: 14px;
  }

  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
    color: #595959;
    font-size: 13px;
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .ant-table-tbody > tr {
    border-bottom: 1px solid #f5f5f5;
  }

  .ant-table-tbody > tr:last-child {
    border-bottom: none;
  }

  .ant-table-tbody > tr > td {
    padding: 16px;
    background: #ffffff;
    border-bottom: none;
  }

  .ant-table-tbody > tr:hover > td {
    background: #ffffff !important;
  }

  .ant-table-cell {
    vertical-align: middle;
  }
`

const StudentName = styled.span`
  font-weight: 500;
  color: #262626;
  font-size: 14px;
`

const EmailText = styled.span`
  color: #8c8c8c;
  font-size: 13px;
`

const AttemptTag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
`

const TimeText = styled.span`
  color: #595959;
  font-size: 13px;
`

const EmptyText = styled.span`
  color: #bfbfbf;
  font-style: italic;
`

const ScoreText = styled.span`
  color: #595959;
  font-size: 14px;
`

const ScoreValue = styled.span`
  color: #52c41a;
  font-weight: 600;
`

const ViolationText = styled.span<{ violation: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 10px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 13px;
  background: ${props => props.violation ? '#fff1f0' : '#f6ffed'};
  color: ${props => props.violation ? '#ff4d4f' : '#52c41a'};
`

const TotalScore = styled.strong`
  font-size: 15px;
  font-weight: 700;
  color: #1890ff;
`

const StyledTag = styled(Tag)`
  margin: 0;
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
  border: none;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`

const EmptyIcon = styled.div`
  font-size: 72px;
  margin-bottom: 20px;
  opacity: 0.6;
`

const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
`

const EmptyDescription = styled.div`
  font-size: 14px;
  color: #8c8c8c;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e8e8e8;
  background: #ffffff;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: #f5f5f5;
    border-color: #d9d9d9;
  }

  &:active {
    transform: scale(0.96);
  }

  svg {
    font-size: 15px;
    color: #595959;
    transition: color 0.2s ease;
  }

  &:hover svg {
    color: #1890ff;
  }
`
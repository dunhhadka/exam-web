import { 
  EditOutlined, 
  EyeOutlined, 
  MailOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  TrophyOutlined,
  TeamOutlined,
  CheckOutlined,
  WarningOutlined
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Modal, Progress } from 'antd'
import { useState } from 'react'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import { 
  useGetAttemptsBySessionQuery,
  useSendResultNotificationsMutation 
} from '../../services/api/attemptApi'
import {
  AttemptListResponse,
  GradingStatus,
} from '../../types/attempt'
import { formatInstant } from '../../utils/times'
import { useToast } from '../../hooks/useToast'
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
  const toast = useToast()
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)

  const {
    data: attempts,
    isLoading,
    isFetching,
  } = useGetAttemptsBySessionQuery(sessionId, {
    skip: !open,
  })

  const [sendResultNotifications, { isLoading: isSending }] = 
    useSendResultNotificationsMutation()

  const gradedCount = attempts?.filter(
    (attempt) => attempt.gradingStatus === GradingStatus.DONE
  ).length ?? 0

  const totalCount = attempts?.length ?? 0
  const progressPercent = totalCount > 0 ? (gradedCount / totalCount) * 100 : 0

  const handleSendNotifications = async () => {
    if (gradedCount === 0) {
      toast.warning('Chưa có bài nào được chấm điểm', 'Vui lòng chấm điểm trước khi gửi thông báo')
      return
    }

    try {
      await sendResultNotifications(sessionId).unwrap()
      toast.success(
        'Đã gửi thông báo kết quả',
        `Đã gửi email thông báo kết quả cho ${gradedCount} học sinh đã được chấm điểm`
      )
    } catch (error: any) {
      toast.error(
        'Lỗi gửi thông báo',
        error?.data?.message || 'Có lỗi xảy ra khi gửi email, vui lòng thử lại'
      )
    }
  }

  const columns = [
    createColumn<AttemptListResponse>('Học sinh', 'studentName', {
      width: 280,
      render: (value: string, record: AttemptListResponse) => (
        <StudentCell>
          <StudentAvatar>
            <UserOutlined />
          </StudentAvatar>
          <StudentInfo>
            <StudentName>{value}</StudentName>
            <StudentEmail>{record.studentEmail}</StudentEmail>
          </StudentInfo>
        </StudentCell>
      ),
    }),
    createColumn<AttemptListResponse>('Lần thi', 'attemptNo', {
      width: 100,
      align: 'center',
      render: (value: number) => <AttemptBadge>#{value}</AttemptBadge>,
    }),
    createColumn<AttemptListResponse>('Thời gian', 'startedAt', {
      width: 200,
      render: (value: string, record: AttemptListResponse) => (
        <TimeCell>
          <TimeRow>
            <TimeLabel>Bắt đầu</TimeLabel>
            <TimeValue>{formatInstant(value)}</TimeValue>
          </TimeRow>
          {record.submittedAt ? (
            <TimeRow>
              <TimeLabel>Nộp bài</TimeLabel>
              <TimeValue>{formatInstant(record.submittedAt)}</TimeValue>
            </TimeRow>
          ) : (
            <TimeRow>
              <TimeLabel>Nộp bài</TimeLabel>
              <EmptyValue>Chưa nộp</EmptyValue>
            </TimeRow>
          )}
        </TimeCell>
      ),
    }),
    createColumn<AttemptListResponse>('Kết quả', 'correctAnswers', {
      width: 140,
      render: (value: number, record: AttemptListResponse) => (
        <ResultCell>
          <ResultRow>
            <ResultLabel>Đúng</ResultLabel>
            <ResultValue $correct>
              {value}/{record.totalQuestions}
            </ResultValue>
          </ResultRow>
          <ResultRow>
            <ResultLabel>Vi phạm</ResultLabel>
            <ResultValue $violation={record.unansweredQuestions > 0}>
              {record.unansweredQuestions}
            </ResultValue>
          </ResultRow>
        </ResultCell>
      ),
    }),
    createColumn<AttemptListResponse>('Điểm', 'totalScore', {
      width: 100,
      align: 'center',
      render: (value: number) => (
        <ScoreValue>{value}</ScoreValue>
      ),
    }),
    createColumn<AttemptListResponse>('Trạng thái', 'gradingStatus', {
      width: 140,
      align: 'center',
      render: (value: GradingStatus) => (
        <StatusBadge $status={value}>
          {value === GradingStatus.DONE ? (
            <>
              <CheckCircleOutlined />
              <span>Đã chấm</span>
            </>
          ) : (
            <>
              <ClockCircleOutlined />
              <span>Chờ chấm</span>
            </>
          )}
        </StatusBadge>
      ),
    }),
    createColumn<AttemptListResponse>('Thao tác', 'attemptId', {
      width: 180,
      align: 'center',
      render: (attemptId: number) => (
        <ActionButtons>
          <ActionButton 
            $primary
            onClick={() => setSelectedAttemptId(attemptId)}
          >
            <EditOutlined />
            Chấm điểm
          </ActionButton>
          <IconButton>
            <EyeOutlined />
          </IconButton>
        </ActionButtons>
      ),
    }),
  ]

  return (
    <>
      <StyledModal
        open={open}
        title={null}
        onCancel={onClose}
        width={1600}
        centered
        footer={null}
        destroyOnClose
      >
        <ModalHeader>
          <HeaderContent>
            <TitleSection>
              <TitleRow>
                <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div>
                  <ModalTitle>Quản lý chấm điểm</ModalTitle>
                  <SessionName>{sessionName}</SessionName>
                </div>
              </TitleRow>
            </TitleSection>

            <HeaderStats>
              <StatCard>
                <StatHeader>
                  <TeamOutlined />
                  <StatLabel>Tổng số bài</StatLabel>
                </StatHeader>
                <StatValue>{totalCount}</StatValue>
              </StatCard>

              <StatCard>
                <StatHeader>
                  <CheckOutlined />
                  <StatLabel>Đã chấm</StatLabel>
                </StatHeader>
                <StatValue $success>{gradedCount}</StatValue>
              </StatCard>

              <StatCard $wide>
                <StatHeader>
                  <TrophyOutlined />
                  <StatLabel>Tiến độ</StatLabel>
                </StatHeader>
                <ProgressWrapper>
                  <StyledProgress 
                    percent={progressPercent} 
                    strokeColor="#52c41a"
                    trailColor="#f0f0f0"
                    showInfo={false}
                  />
                  <ProgressText>{Math.round(progressPercent)}%</ProgressText>
                </ProgressWrapper>
              </StatCard>
            </HeaderStats>

            <NotificationSection>
              <NotificationContent>
                <NotificationLabel>
                  <MailOutlined />
                  Thông báo kết quả
                </NotificationLabel>
                <NotificationText>
                  Gửi email cho <strong>{gradedCount}</strong> học sinh đã chấm điểm
                </NotificationText>
              </NotificationContent>
              <SendButton
                type="primary"
                icon={<MailOutlined />}
                onClick={handleSendNotifications}
                loading={isSending}
                disabled={gradedCount === 0}
              >
                Gửi thông báo
              </SendButton>
            </NotificationSection>
          </HeaderContent>
        </ModalHeader>

        <ModalBody>
          {!isLoading && !isFetching && (!attempts || attempts.length === 0) ? (
            <EmptyState>
              <EmptyIcon>
                <FileTextOutlined />
              </EmptyIcon>
              <EmptyTitle>Chưa có bài thi nào</EmptyTitle>
              <EmptyDescription>
                Danh sách bài thi sẽ xuất hiện khi có học sinh bắt đầu làm bài
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
        </ModalBody>
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
    border-radius: 12px;
    overflow: hidden;
    padding: 0;
  }

  .ant-modal-body {
    padding: 0;
  }

  .ant-modal-close {
    top: 24px;
    right: 24px;
    width: 36px;
    height: 36px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.06);
      transform: scale(1.1);
    }
  }

  .ant-modal-close-x {
    width: 36px;
    height: 36px;
    line-height: 36px;
    font-size: 18px;
    color: #595959;
    
    &:hover {
      color: #262626;
    }
  }
`

const ModalHeader = styled.div`
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: relative;

`

const HeaderContent = styled.div`
  padding: 32px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 32px;
  align-items: start;
`

const TitleSection = styled.div``

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  line-height: 1.3;
`

const SessionName = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: #8c8c8c;
  font-weight: 400;
`

const HeaderStats = styled.div`
  display: flex;
  gap: 12px;
`

const StatCard = styled.div<{ $wide?: boolean }>`
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  min-width: ${props => props.$wide ? '200px' : '140px'};
`

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #8c8c8c;
  font-size: 16px;
`

const StatLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #595959;
`

const StatValue = styled.div<{ $success?: boolean }>`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.$success ? '#52c41a' : '#262626'};
  line-height: 1;
`

const ProgressWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const StyledProgress = styled(Progress)`
  flex: 1;
  
  .ant-progress-bg {
    height: 8px !important;
  }
`

const ProgressText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  min-width: 45px;
  text-align: right;
`

const NotificationSection = styled.div`
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 280px;
`

const NotificationContent = styled.div``

const NotificationLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0050b3;
  margin-bottom: 4px;
  
  .anticon {
    font-size: 16px;
  }
`

const NotificationText = styled.div`
  font-size: 13px;
  color: #096dd9;
  line-height: 1.5;
  
  strong {
    font-weight: 700;
  }
`

const SendButton = styled(Button)`
  width: 100%;
  height: 36px;
  font-weight: 600;
`

const ModalBody = styled.div`
  background: #fafafa;
  min-height: 600px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
`

const TableWrapper = styled.div`
  margin: 24px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;

  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
    color: #262626;
    font-size: 13px;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-table-tbody > tr > td {
    padding: 16px;
    border-bottom: 1px solid #f5f5f5;
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-tbody > tr:hover > td {
    background: #fafafa !important;
  }
`

const StudentCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const StudentAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`

const StudentInfo = styled.div`
  min-width: 0;
  flex: 1;
`

const StudentName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const StudentEmail = styled.div`
  font-size: 13px;
  color: #8c8c8c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const AttemptBadge = styled.div`
  display: inline-block;
  padding: 4px 12px;
  background: #f0f0f0;
  color: #595959;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
`

const TimeCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const TimeLabel = styled.span`
  font-size: 12px;
  color: #8c8c8c;
  width: 60px;
  flex-shrink: 0;
`

const TimeValue = styled.span`
  font-size: 13px;
  color: #262626;
  font-weight: 500;
`

const EmptyValue = styled.span`
  font-size: 13px;
  color: #bfbfbf;
  font-style: italic;
`

const ResultCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const ResultLabel = styled.span`
  font-size: 12px;
  color: #8c8c8c;
`

const ResultValue = styled.span<{ $correct?: boolean; $violation?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  
  ${props => {
    if (props.$correct) {
      return `
        background: #f6ffed;
        color: #52c41a;
      `;
    }
    if (props.$violation) {
      return `
        background: #fff2f0;
        color: #ff4d4f;
      `;
    }
    return `
      background: #f6ffed;
      color: #52c41a;
    `;
  }}
`

const ScoreValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
`

const StatusBadge = styled.div<{ $status: GradingStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  
  ${props => props.$status === GradingStatus.DONE ? `
    background: #f6ffed;
    color: #52c41a;
  ` : `
    background: #fff7e6;
    color: #fa8c16;
  `}
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #595959;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$primary && `
    border-color: #1890ff;
    color: #1890ff;
    
    &:hover {
      background: #1890ff;
      color: #fff;
    }
  `}

  ${props => !props.$primary && `
    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  `}
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #595959;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 40px;
  margin: 24px;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
`

const EmptyIcon = styled.div`
  font-size: 64px;
  color: #d9d9d9;
  margin-bottom: 24px;
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
  line-height: 1.6;
`

export default AttemptListModal
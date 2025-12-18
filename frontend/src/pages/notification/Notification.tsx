import { 
  MailOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Table, Tag, Space, Card, Spin, Empty } from 'antd'
import { useState } from 'react'
import { useFilterExamSessionQuery } from '../../services/api/examsession'
import { 
  useGetEmailNotificationsBySessionQuery 
} from '../../services/api/emailNotificationApi'
import { 
  useSendResultNotificationForAttemptMutation 
} from '../../services/api/attemptApi'
import { useToast } from '../../hooks/useToast'
import { formatInstant } from '../../utils/times'
import type { EmailNotification } from '../../services/api/emailNotificationApi'

function NotificationContent() {
  const toast = useToast()
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())

  const { data: sessionsData, isLoading: isLoadingSessions } = useFilterExamSessionQuery({
    pageIndex: 0,
    pageSize: 200,
  })

  const [sendNotification, { isLoading: isSending }] = 
    useSendResultNotificationForAttemptMutation()

  const sessions = sessionsData?.data || []

  const toggleSession = (sessionId: number) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const handleResendEmail = async (attemptId: number, studentEmail: string) => {
    try {
      await sendNotification(attemptId).unwrap()
      toast.success('Đã gửi lại email', `Email đã được gửi lại cho ${studentEmail}`)
    } catch (error: any) {
      toast.error(
        'Lỗi gửi email',
        error?.data?.message || 'Có lỗi xảy ra khi gửi email, vui lòng thử lại'
      )
    }
  }

  const getStatusTag = (status: EmailNotification['status']) => {
    switch (status) {
      case 'SENT':
        return <StatusTag color="success" icon={<CheckCircleOutlined />}>Đã gửi</StatusTag>
      case 'FAILED':
        return <StatusTag color="error" icon={<CloseCircleOutlined />}>Thất bại</StatusTag>
      case 'PENDING':
        return <StatusTag color="warning" icon={<ClockCircleOutlined />}>Đang chờ</StatusTag>
      default:
        return <StatusTag>{status}</StatusTag>
    }
  }

  const sessionColumns = [
    {
      title: 'Tên phiên thi',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <SessionName>{name}</SessionName>,
    },
    {
      title: 'Mã phiên thi',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <SessionCode>{code}</SessionCode>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => toggleSession(record.id)}
        >
          {expandedSessions.has(record.id) ? 'Ẩn chi tiết' : 'Xem chi tiết'}
        </Button>
      ),
    },
  ]

  if (isLoadingSessions) {
    return (
      <Container>
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <TitleSection>
          <FileTextOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
          <Title>Quản lý thông báo kết quả</Title>
        </TitleSection>
        <Subtitle>Xem và quản lý các email thông báo kết quả đã gửi cho học sinh</Subtitle>
      </Header>

      <Content>
        {sessions.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📧</EmptyIcon>
            <EmptyTitle>Chưa có phiên thi nào</EmptyTitle>
            <EmptyDescription>
              Danh sách phiên thi sẽ hiển thị tại đây khi có phiên thi được tạo
            </EmptyDescription>
          </EmptyState>
        ) : (
          <SessionsList>
            {sessions.map((session) => (
              <SessionCard key={session.id}>
                <SessionHeader>
                  <SessionInfo>
                    <SessionName>{session.name}</SessionName>
                    <SessionCode>Mã: {session.code}</SessionCode>
                  </SessionInfo>
                  <DetailButton
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => toggleSession(session.id)}
                  >
                    {expandedSessions.has(session.id) ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </DetailButton>
                </SessionHeader>

                {expandedSessions.has(session.id) && (
                  <EmailList sessionId={session.id} onResend={handleResendEmail} />
                )}
              </SessionCard>
            ))}
          </SessionsList>
        )}
      </Content>
    </Container>
  )
}

interface EmailListProps {
  sessionId: number
  onResend: (attemptId: number, studentEmail: string) => void
}

const EmailList = ({ sessionId, onResend }: EmailListProps) => {
  const { data: emails, isLoading, refetch } = useGetEmailNotificationsBySessionQuery(sessionId)

  const columns: any[] = [
    {
      title: 'Học sinh',
      key: 'student',
      render: (_: any, record: EmailNotification) => (
        <StudentCell>
          <StudentName>{record.studentName || record.studentEmail}</StudentName>
          <StudentEmail>{record.studentEmail}</StudentEmail>
        </StudentCell>
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string) => <SubjectText>{subject}</SubjectText>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: EmailNotification['status'], record: EmailNotification) => (
        <StatusCell>
          {status === 'SENT' ? (
            <StatusTag color="success" icon={<CheckCircleOutlined />}>Đã gửi</StatusTag>
          ) : status === 'FAILED' ? (
            <StatusTag color="error" icon={<CloseCircleOutlined />}>Thất bại</StatusTag>
          ) : (
            <StatusTag color="warning" icon={<ClockCircleOutlined />}>Đang chờ</StatusTag>
          )}
          {record.retryCount > 0 && (
            <RetryCount>Đã thử: {record.retryCount}</RetryCount>
          )}
        </StatusCell>
      ),
    },
    {
      title: 'Thời gian gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => <TimeText>{formatInstant(createdAt)}</TimeText>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: EmailNotification) => (
        <ActionButtons>
          {record.status === 'FAILED' && (
            <ResendButton
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => onResend(record.attemptId, record.studentEmail)}
            >
              Gửi lại
            </ResendButton>
          )}
          {record.status !== 'FAILED' && record.status !== 'SENT' && (
            <ResendButton
              type="default"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => onResend(record.attemptId, record.studentEmail)}
            >
              Gửi lại
            </ResendButton>
          )}
        </ActionButtons>
      ),
    },
  ]

  if (isLoading) {
    return (
      <EmailListContainer>
        <LoadingContainer>
          <Spin />
          <LoadingText>Đang tải danh sách email...</LoadingText>
        </LoadingContainer>
      </EmailListContainer>
    )
  }

  if (!emails || emails.length === 0) {
    return (
      <EmailListContainer>
        <EmptyState>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyTitle>Chưa có email nào được gửi</EmptyTitle>
          <EmptyDescription>
            Email sẽ xuất hiện tại đây sau khi giáo viên gửi thông báo kết quả
          </EmptyDescription>
        </EmptyState>
      </EmailListContainer>
    )
  }

  return (
    <EmailListContainer>
      <EmailTable
        columns={columns}
        dataSource={emails}
        rowKey="emailId"
        pagination={false}
        size="small"
      />
    </EmailListContainer>
  )
}

const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
`

const Header = styled.div`
  margin-bottom: 24px;
`

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8c8c8c;
  margin-left: 36px;
`

const Content = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SessionCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .ant-card-body {
    padding: 20px;
  }
`

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const SessionInfo = styled.div`
  flex: 1;
`

const SessionName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
`

const SessionCode = styled.div`
  font-size: 13px;
  color: #8c8c8c;
`

const DetailButton = styled(Button)`
  flex-shrink: 0;
`

const EmailListContainer = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
`

const EmailTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
    color: #262626;
    font-size: 13px;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
  }
`

const StudentCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const StudentName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`

const StudentEmail = styled.div`
  font-size: 12px;
  color: #8c8c8c;
`

const SubjectText = styled.div`
  font-size: 14px;
  color: #595959;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const StatusCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const StatusTag = styled(Tag)`
  margin: 0;
  font-weight: 500;
`

const RetryCount = styled.div`
  font-size: 11px;
  color: #8c8c8c;
`

const TimeText = styled.div`
  font-size: 13px;
  color: #595959;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`

const ResendButton = styled(Button)`
  font-size: 12px;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
`

const LoadingText = styled.div`
  font-size: 14px;
  color: #8c8c8c;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
`

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
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
  max-width: 400px;
  line-height: 1.6;
`

export default NotificationContent

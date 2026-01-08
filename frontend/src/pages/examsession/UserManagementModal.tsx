import { DeleteOutlined, EditOutlined, EyeOutlined, SyncOutlined, SearchOutlined, ReconciliationOutlined, CalendarOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined, InboxOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Input, Modal, Table, Tag, Empty } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useGetSessionStatsQuery, useGetSessionUsersQuery } from '../../services/api/sessionUserApi'
import { SessionUser } from '../../types/session-user'
import { useGetLogsGroupedByAttemptQuery, Log, AttemptWithLogs } from '../../services/api/logApi'

interface UserManagementModalProps {
  sessionId: number
  sessionName: string
  open: boolean
  onClose: () => void
}

export const UserManagementModal = ({
  sessionId,
  sessionName = "Test",
  open = true,
  onClose,
}: UserManagementModalProps) => {
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')

  // Fetch session stats
  const { data: stats, isLoading: statsLoading } = useGetSessionStatsQuery(sessionId, {
    skip: !open || !sessionId,
  })

  // Fetch session users with filters
  const { data: usersData, isLoading: usersLoading, refetch } = useGetSessionUsersQuery(
    {
      sessionId,
      searchText: searchText || undefined,
      pageIndex: page - 1,
      pageSize: pageSize,
    },
    {
      skip: !open || !sessionId,
    }
  )

  const loading = statsLoading || usersLoading
  const users = usersData?.data || []
  const total = usersData?.total || 0

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleViewLogs = (user: SessionUser) => {
    if (user.email) {
      setSelectedStudentEmail(user.email)
      setSelectedUserName(user.name)
    }
  }

  const handleCloseLogModal = () => {
    setSelectedStudentEmail(null)
    setSelectedUserName('')
  }

  const columns: ColumnsType<SessionUser> = [
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <NameText>{text}</NameText>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => <RoleText>{text}</RoleText>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => <EmailText>{text}</EmailText>,
    },
    {
      title: 'Mã số',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <CodeText>{text}</CodeText>,
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (text: string) => <GenderText>{text}</GenderText>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <StatusTag $status={text}>
          <StatusDot />
          {text}
        </StatusTag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_: any, record: SessionUser) => (
        <ActionButtons>
          <ActionIcon 
            onClick={() => handleViewLogs(record)}
            disabled={!record.email}
            title={record.email ? 'Xem log vi phạm' : 'Chưa có thông tin'}
          >
            <EyeOutlined />
          </ActionIcon>
        </ActionButtons>
      ),
    },
  ]

  return (
    <StyledModal
      open={open}
      onCancel={onClose}
      width={1400}
      centered
      footer={null}
      destroyOnClose
      mask={true}
      maskClosable={true}
      closeIcon={<CloseIcon>✕</CloseIcon>}
    >
      <ModalHeader>
        <HeaderContent>
          <ImageSection>
            <SessionImage 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop" 
              alt="Session"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/160x100/F3F4F6/9CA3AF?text=Session';
              }}
            />
          </ImageSection>
          
          <StatsGrid>
            <StatCard>
              <StatIcon><ReconciliationOutlined /></StatIcon>
              <StatContent>
                <StatLabel>Mã phiên</StatLabel>
                <StatValue>{stats?.code || 'N/A'}</StatValue>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><CalendarOutlined /></StatIcon>
              <StatContent>
                <StatLabel>Ngày bắt đầu</StatLabel>
                <StatValue>{stats?.startDate || 'N/A'}</StatValue>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><CalendarOutlined /></StatIcon>
              <StatContent>
                <StatLabel>Ngày kết thúc</StatLabel>
                <StatValue>{stats?.endDate || 'N/A'}</StatValue>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><TeamOutlined /></StatIcon>
              <StatContent>
                <StatLabel>Số học sinh</StatLabel>
                <StatValue>{stats?.totalStudents || 0}</StatValue>
              </StatContent>
            </StatCard>
          </StatsGrid>
        </HeaderContent>
      </ModalHeader>

      <ModalBody>
        <TitleSection>
          <SessionTitle>{sessionName}</SessionTitle>
        </TitleSection>

        <SearchSection>
          <SearchWrapper>
            <StyledInput
              placeholder="Tìm kiếm theo tên, email hoặc mã số..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            />
            <SearchButton type="primary" onClick={handleSearch}>
              Tìm kiếm
            </SearchButton>
          </SearchWrapper>
        </SearchSection>

        <TableWrapper>
          <StyledTable
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              position: ['bottomCenter'],
              showSizeChanger: false,
              current: page,
              pageSize: pageSize,
              total: total,
              onChange: handlePageChange,
              simple: true,
            }}
          />
        </TableWrapper>
      </ModalBody>

      <LogDetailModal
        open={selectedStudentEmail !== null}
        onClose={handleCloseLogModal}
        sessionId={sessionId}
        studentEmail={selectedStudentEmail}
        userName={selectedUserName}
      />
    </StyledModal>
  )
}

// Log Detail Modal Component
interface LogDetailModalProps {
  open: boolean
  onClose: () => void
  sessionId: number
  studentEmail: string | null
  userName: string
}

const LogDetailModal = ({ open, onClose, sessionId, studentEmail, userName }: LogDetailModalProps) => {
  const { data: attempts, isLoading } = useGetLogsGroupedByAttemptQuery(
    { sessionId, email: studentEmail! },
    { skip: !studentEmail }
  )

  const totalLogs = attempts?.reduce((sum, attempt) => sum + attempt.logs.length, 0) || 0

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A'
    try {
      const parts = dateStr.split(' ')
      if (parts.length !== 2) return dateStr
      
      const [datePart, timePart] = parts
      const [day, month, year] = datePart.split('-')
      const timeComponents = timePart.split(':')
      const hour = timeComponents[0]
      const minute = timeComponents[1]
      const second = timeComponents[2] || '00'
      
      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`
      const date = new Date(isoString)
      
      if (isNaN(date.getTime())) return dateStr
      
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      console.error('Error parsing date:', error)
      return dateStr
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#EF4444'
      case 'SERIOUS': return '#F97316'
      case 'WARNING': return '#F59E0B'
      case 'INFO': return '#3B82F6'
      default: return '#6B7280'
    }
  }

  const getLogTypeLabel = (logType: string) => {
    const labels: Record<string, string> = {
      DEVTOOLS_OPEN: 'Mở DevTools',
      TAB_SWITCH: 'Chuyển tab',
      FULLSCREEN_EXIT: 'Thoát fullscreen',
      COPY_PASTE_ATTEMPT: 'Copy/Paste',
      SUSPICIOUS_ACTIVITY: 'Hoạt động đáng ngờ',
      OTHER: 'Khác'
    }
    return labels[logType] || logType
  }

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      CRITICAL: 'Nghiêm trọng',
      SERIOUS: 'Nghiêm túc',
      WARNING: 'Cảnh báo',
      INFO: 'Thông tin'
    }
    return labels[severity] || severity
  }

  const columns: ColumnsType<Log> = [
    {
      title: 'Thời gian',
      dataIndex: 'loggedAt',
      key: 'loggedAt',
      width: 180,
      render: (text: string) => <LogTime>{text}</LogTime>,
    },
    {
      title: 'Loại vi phạm',
      dataIndex: 'logType',
      key: 'logType',
      width: 150,
      render: (text: string) => (
        <LogTypeTag>{getLogTypeLabel(text)}</LogTypeTag>
      ),
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      width: 130,
      render: (text: string) => (
        <SeverityTag $color={getSeverityColor(text)}>
          {getSeverityLabel(text)}
        </SeverityTag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'message',
      key: 'message',
      render: (text: string) => <LogMessage>{text}</LogMessage>,
    },
  ]

  return (
    <StyledLogModal
      open={open}
      onCancel={onClose}
      width={1100}
      centered
      footer={null}
      destroyOnClose
      mask={true}
      maskClosable={true}
      closeIcon={<CloseIcon>✕</CloseIcon>}
    >
      <LogModalHeader>
        <LogHeaderTitle>
          <LogIcon><ReconciliationOutlined /></LogIcon>
          <div>
            <LogTitle>Logs</LogTitle>
            <LogSubtitle>{userName}</LogSubtitle>
          </div>
        </LogHeaderTitle>
        <LogTotalBadge>
          Tổng: <strong>{totalLogs}</strong> vi phạm
        </LogTotalBadge>
      </LogModalHeader>

      <LogModalBody>
        {attempts && attempts.length > 0 ? (
          attempts.map((attempt, index) => (
            <AttemptCard key={attempt.attemptId}>
              <AttemptCardHeader>
                <AttemptInfo>
                  <AttemptNumber>Lần {index + 1}</AttemptNumber>
                  <AttemptMeta>
                    <MetaItem>
                      <MetaIcon><ClockCircleOutlined /></MetaIcon>
                      Bắt đầu: {formatDate(attempt.attemptStartedAt)}
                    </MetaItem>
                    {attempt.attemptSubmittedAt && (
                      <MetaItem>
                        <MetaIcon><CheckCircleOutlined /></MetaIcon>
                        Nộp bài: {formatDate(attempt.attemptSubmittedAt)}
                      </MetaItem>
                    )}
                  </AttemptMeta>
                </AttemptInfo>
                <AttemptCount>
                  {attempt.logs.length} vi phạm
                </AttemptCount>
              </AttemptCardHeader>
              
              {attempt.logs.length > 0 ? (
                <LogTableWrapper>
                  <LogTable
                    columns={columns}
                    dataSource={attempt.logs}
                    rowKey="id"
                    loading={isLoading}
                    pagination={false}
                    size="small"
                  />
                </LogTableWrapper>
              ) : (
                <EmptyLogMessage>
                  Không có vi phạm nào trong lần làm bài này
                </EmptyLogMessage>
              )}
            </AttemptCard>
          ))
        ) : (
          !isLoading && (
            <EmptyStateWrapper>
              <EmptyIcon><InboxOutlined /></EmptyIcon>
              <EmptyMessage>Không có lịch sử làm bài</EmptyMessage>
            </EmptyStateWrapper>
          )
        )}
      </LogModalBody>
    </StyledLogModal>
  )
}

// Styled Components
const StyledModal = styled(Modal)`
  .ant-modal-mask {
    background-color: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
  }

  .ant-modal-content {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .ant-modal-body {
    padding: 0;
  }

  .ant-modal-close {
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
  }
`

const CloseIcon = styled.span`
  font-size: 20px;
  color: #6B7280;
  font-weight: 400;
  display: block;
  line-height: 32px;
`

const ModalHeader = styled.div`
  background: white;
  border-bottom: 1px solid #F3F4F6;
  padding: 32px;
`

const HeaderContent = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`

const ImageSection = styled.div`
  flex-shrink: 0;
`

const SessionImage = styled.img`
  width: 160px;
  height: 100px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
`

const StatsGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 10px;
  border: 1px solid #F3F4F6;
`

const StatIcon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StatContent = styled.div`
  min-width: 0;
`

const StatLabel = styled.div`
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
  margin-bottom: 2px;
`

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ModalBody = styled.div`
  padding: 32px;
  background: white;
`

const TitleSection = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F3F4F6;
`

const SessionTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
`

const SearchSection = styled.div`
  margin-bottom: 24px;
`

const SearchWrapper = styled.div`
  display: flex;
  gap: 12px;
  max-width: 500px;
`

const StyledInput = styled(Input)`
  height: 40px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  font-size: 14px;
  
  &:hover {
    border-color: #D1D5DB;
  }
  
  &:focus {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .ant-input-prefix {
    margin-right: 8px;
  }
`

const SearchButton = styled(Button)`
  height: 40px;
  border-radius: 10px;
  background: #111827;
  border: none;
  padding: 0 20px;
  font-weight: 500;
  font-size: 14px;
  
  &:hover {
    background: #1F2937;
  }

  &:focus {
    background: #1F2937;
  }
`

const TableWrapper = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #F3F4F6;
  overflow: hidden;
`

const StyledTable = styled(Table<SessionUser>)`
  .ant-table {
    background: white;
  }

  .ant-table-thead > tr > th {
    background: #FAFAFA;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    padding: 14px 16px;
    border-bottom: 1px solid #F3F4F6;
  }

  .ant-table-tbody > tr > td {
    padding: 14px 16px;
    border-bottom: 1px solid #F9FAFB;
    font-size: 14px;
  }

  .ant-table-tbody > tr {
    transition: background 0.2s;
    
    &:hover > td {
      background: #FAFAFA;
    }
  }

  .ant-pagination {
    margin: 16px 0;
  }
`

const NameText = styled.span`
  color: #111827;
  font-weight: 500;
`

const RoleText = styled.span`
  color: #6B7280;
  font-size: 13px;
`

const EmailText = styled.span`
  color: #6B7280;
  font-size: 13px;
`

const CodeText = styled.span`
  color: #374151;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  font-size: 13px;
`

const GenderText = styled.span`
  color: #6B7280;
  font-size: 13px;
`

const StatusTag = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.$status === 'Active' ? '#ECFDF5' : '#FEF2F2'};
  color: ${props => props.$status === 'Active' ? '#059669' : '#DC2626'};
`

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`

const ActionIcon = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #F9FAFB;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: #F3F4F6;
    color: #111827;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

// Log Modal Styles
const StyledLogModal = styled(Modal)`
  .ant-modal-mask {
    background-color: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
  }

  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .ant-modal-body {
    padding: 0;
  }

  .ant-modal-close {
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
  }
`

const LogModalHeader = styled.div`
  background: white;
  padding: 24px 32px;
  border-bottom: 1px solid #F3F4F6;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const LogHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const LogIcon = styled.div`
  font-size: 28px;
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
`

const LogTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  line-height: 1.3;
`

const LogSubtitle = styled.div`
  font-size: 14px;
  color: #6B7280;
  margin-top: 2px;
`

const LogTotalBadge = styled.div`
  padding: 8px 16px;
  background: #F3F4F6;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  
  strong {
    color: #111827;
    font-weight: 600;
  }
`

const LogModalBody = styled.div`
  padding: 24px 32px 32px;
  background: #FAFAFA;
  max-height: 70vh;
  overflow-y: auto;
`

const AttemptCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  margin-bottom: 20px;
  overflow: hidden;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const AttemptCardHeader = styled.div`
  padding: 16px 20px;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const AttemptInfo = styled.div`
  flex: 1;
`

const AttemptNumber = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
`

const AttemptMeta = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6B7280;
  font-family: 'Courier New', monospace;
`

const MetaIcon = styled.span`
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  color: #6B7280;
`

const AttemptCount = styled.div`
  padding: 6px 14px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
`

const LogTableWrapper = styled.div`
  background: white;
  max-height: 520px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #F9FAFB;
  }

  &::-webkit-scrollbar-thumb {
    background: #D1D5DB;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
  }
`

const LogTable = styled(Table<Log>)`
  .ant-table {
    background: white;
  }

  .ant-table-thead > tr > th {
    background: #FAFAFA;
    font-weight: 600;
    color: #374151;
    font-size: 13px;
    padding: 12px 16px;
    border-bottom: 1px solid #F3F4F6;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    border-bottom: 1px solid #F9FAFB;
    font-size: 13px;
  }

  .ant-table-tbody > tr {
    transition: background 0.2s;
    
    &:hover > td {
      background: #FAFAFA;
    }
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }
`

const LogTime = styled.span`
  color: #6B7280;
  font-size: 13px;
  font-family: 'Courier New', monospace;
`

const LogTypeTag = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: #EFF6FF;
  color: #1E40AF;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
`

const SeverityTag = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 4px 10px;
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
`

const LogMessage = styled.span`
  color: #374151;
  font-size: 13px;
  line-height: 1.5;
`

const EmptyLogMessage = styled.div`
  padding: 32px 20px;
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
`

const EmptyStateWrapper = styled.div`
  text-align: center;
  padding: 60px 20px;
`

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  justify-content: center;
`

const EmptyMessage = styled.div`
  color: #9CA3AF;
  font-size: 15px;
`

export default UserManagementModal
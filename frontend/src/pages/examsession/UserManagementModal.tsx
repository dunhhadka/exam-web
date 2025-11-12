import { DeleteOutlined, EditOutlined, EyeOutlined, SyncOutlined, SearchOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Input, Modal, Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useGetSessionStatsQuery, useGetSessionUsersQuery } from '../../services/api/sessionUserApi'
import { SessionUser } from '../../types/session-user'

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

  // Fetch session stats
  const { data: stats, isLoading: statsLoading } = useGetSessionStatsQuery(sessionId, {
    skip: !open || !sessionId,
  })

  // Fetch session users with filters
  const { data: usersData, isLoading: usersLoading, refetch } = useGetSessionUsersQuery(
    {
      sessionId,
      searchText: searchText || undefined,
      pageIndex: page - 1, // Backend uses 0-based index
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
      render: (text: string) => <RoleText>{text} ▼</RoleText>,
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
      render: (text: string) => <GenderText>{text} ▼</GenderText>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => <StatusActive>{text} ▼</StatusActive>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
      render: () => (
        <ActionButtons>
          <ActionIcon $color="#5B8CFF">
            <SyncOutlined />
          </ActionIcon>
          <ActionIcon $color="#5B8CFF">
            <EditOutlined />
          </ActionIcon>
          <ActionIcon $color="#5B8CFF">
            <EyeOutlined />
          </ActionIcon>
          <ActionIcon $color="#5B8CFF">
            <EditOutlined />
          </ActionIcon>
          <ActionIcon $color="#FF4D4F">
            <DeleteOutlined />
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
      closeIcon={<CloseIcon>×</CloseIcon>}
      bodyStyle={{ maxHeight: '85vh', overflow: 'auto' }}
    >
      <HeaderSection>
        <HeaderCard>
          <ImageBox>
            <SessionImage 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop" 
              alt="Session"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/180x120/5B8CFF/FFFFFF?text=Session+Image';
              }}
            />
          </ImageBox>
          
          <StatsContainer>
            <StatBox>
              <IconCircle $color="#5B8CFF">
                <IconText>📋</IconText>
              </IconCircle>
              <StatInfo>
                <StatLabel>Code</StatLabel>
                <StatValue>{stats?.code || 'N/A'}</StatValue>
              </StatInfo>
            </StatBox>

            <StatBox>
              <IconCircle $color="#5B8CFF">
                <IconText>📅</IconText>
              </IconCircle>
              <StatInfo>
                <StatLabel>Ngày bắt đầu</StatLabel>
                <StatValue>{stats?.startDate || 'N/A'}</StatValue>
              </StatInfo>
            </StatBox>

            <StatBox>
              <IconCircle $color="#5B8CFF">
                <IconText>📅</IconText>
              </IconCircle>
              <StatInfo>
                <StatLabel>Ngày kết thúc</StatLabel>
                <StatValue>{stats?.endDate || 'N/A'}</StatValue>
              </StatInfo>
            </StatBox>

            <StatBox>
              <IconCircle $color="#5B8CFF">
                <IconText>🎓</IconText>
              </IconCircle>
              <StatInfo>
                <StatLabel>Tổng số học sinh</StatLabel>
                <StatValue>{stats?.totalStudents || 0}</StatValue>
              </StatInfo>
            </StatBox>
          </StatsContainer>
        </HeaderCard>
      </HeaderSection>

      <ContentSection>
        <TitleRow>
          <PageTitle>{sessionName}</PageTitle>
        </TitleRow>

        <SearchRow>
          <Input.Group compact style={{ display: 'flex', maxWidth: 450 }}>
            <StyledInput
              placeholder="Tìm kiếm"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
            <SearchButton type="primary" onClick={handleSearch}>
              <SearchOutlined /> Tìm kiếm
            </SearchButton>
          </Input.Group>
        </SearchRow>

        <TableContainer>
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
        </TableContainer>
      </ContentSection>
    </StyledModal>
  )
}

const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }

  .ant-modal-body {
    padding: 0;
  }

  .ant-modal-close {
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
`

const CloseIcon = styled.span`
  font-size: 28px;
  color: #333;
  font-weight: 300;
  display: block;
  line-height: 36px;
`

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #5B8CFF 0%, #4169E1 100%);
  padding: 32px 40px;
`

const HeaderCard = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`

const ImageBox = styled.div`
  flex-shrink: 0;
`

const SessionImage = styled.img`
  width: 180px;
  height: 120px;
  border-radius: 16px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: block;
  background: rgba(255, 255, 255, 0.1);
`

const StatsContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 24px;
  justify-content: space-between;
`

const StatBox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const IconCircle = styled.div<{ $color: string }>`
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const IconText = styled.span`
  font-size: 28px;
`

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const StatLabel = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
`

const StatValue = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: white;
`

const ContentSection = styled.div`
  padding: 28px 40px 36px;
  background: #FAFBFC;
`

const TitleRow = styled.div`
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E8EAED;
`

const PageTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1F2937;
`

const SearchRow = styled.div`
  margin-bottom: 20px;
`

const StyledInput = styled(Input)`
  height: 42px !important;
  font-size: 14px;
  border-radius: 10px 0 0 10px !important;
  border: 1px solid #E0E0E0;
  flex: 1;
  
  &:focus {
    border-color: #5B8CFF !important;
    box-shadow: 0 0 0 2px rgba(91, 140, 255, 0.1) !important;
  }

  &:hover {
    border-color: #5B8CFF !important;
  }
`

const SearchButton = styled(Button)`
  height: 42px !important;
  border-radius: 0 10px 10px 0 !important;
  background: #5B8CFF !important;
  border-color: #5B8CFF !important;
  padding: 0 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px;
  font-weight: 500;
  
  &:hover {
    background: #4169E1 !important;
    border-color: #4169E1 !important;
  }

  &:focus {
    background: #4169E1 !important;
    border-color: #4169E1 !important;
  }
`

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`

const StyledTable = styled(Table<SessionUser>)`
  .ant-table {
    background: white;
  }

  .ant-table-thead > tr > th {
    background: #F8F9FA;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
    padding: 16px 16px;
    border-bottom: 2px solid #E5E7EB;
  }

  .ant-table-tbody > tr > td {
    padding: 16px 16px;
    border-bottom: 1px solid #F3F4F6;
    color: #6B7280;
    font-size: 14px;
  }

  .ant-table-tbody > tr {
    transition: all 0.2s;
    
    &:hover > td {
      background: #F9FAFB;
    }
  }

  .ant-pagination {
    margin: 20px 0 8px 0;
  }

  .ant-pagination-simple .ant-pagination-simple-pager {
    margin: 0 12px;
  }
`

const NameText = styled.span`
  color: #1F2937;
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
  color: #1F2937;
  font-weight: 500;
`

const GenderText = styled.span`
  color: #6B7280;
  font-size: 13px;
`

const StatusActive = styled.span`
  color: #6B7280;
  font-weight: 500;
  font-size: 13px;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
`

const ActionIcon = styled.button<{ $color: string }>`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;

  &:hover {
    background: ${props => props.$color}15;
    transform: scale(1.05);
  }

  svg {
    font-size: 15px;
  }
`

export default UserManagementModal
// pages/student-page/StudentExamSession.tsx
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  KeyOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
  Input,
  DatePicker,
  Select,
} from 'antd'
import styled from '@emotion/styled'
import dayjs from 'dayjs'
import { useState } from 'react'
enum ExamSessionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

interface ExamSession {
  id: number
  name: string
  status: ExamSessionStatus
  joinToken: string
  startTime: string
  endTime: string
  examName?: string
  description?: string
  duration?: number // phút
}

const mockExamSessions: ExamSession[] = [
  {
    id: 1,
    name: 'Kiểm tra giữa kỳ - Toán học',
    status: ExamSessionStatus.NOT_STARTED,
    joinToken: 'MATH2024',
    startTime: '2024-12-20T08:00:00',
    endTime: '2024-12-20T10:00:00',
    examName: 'Đề thi Toán cao cấp',
    description: 'Kiểm tra chương 1-5',
    duration: 90,
  },
  {
    id: 2,
    name: 'Bài kiểm tra 15 phút - Vật lý',
    status: ExamSessionStatus.IN_PROGRESS,
    joinToken: 'PHY2024',
    startTime: '2024-12-15T14:00:00',
    endTime: '2024-12-15T14:15:00',
    examName: 'Đề thi Vật lý 1',
    description: 'Kiểm tra nhanh chương 3',
    duration: 15,
  },
  {
    id: 3,
    name: 'Thi cuối kỳ - Hóa học',
    status: ExamSessionStatus.COMPLETED,
    joinToken: 'CHEM2024',
    startTime: '2024-12-10T08:00:00',
    endTime: '2024-12-10T10:30:00',
    examName: 'Đề thi Hóa hữu cơ',
    description: 'Thi cuối kỳ học kỳ 1',
    duration: 120,
  },
  {
    id: 4,
    name: 'Kiểm tra - Tiếng Anh',
    status: ExamSessionStatus.NOT_STARTED,
    joinToken: 'ENG2024',
    startTime: '2024-12-22T10:00:00',
    endTime: '2024-12-22T11:30:00',
    examName: 'TOEIC Practice Test',
    description: 'Luyện tập TOEIC',
    duration: 90,
  },
  {
    id: 5,
    name: 'Kiểm tra - Lập trình Java',
    status: ExamSessionStatus.EXPIRED,
    joinToken: 'JAVA2024',
    startTime: '2024-12-05T08:00:00',
    endTime: '2024-12-05T10:00:00',
    examName: 'Java OOP Test',
    description: 'Kiểm tra OOP và Collections',
    duration: 120,
  },
  {
    id: 6,
    name: 'Kiểm tra - Cơ sở dữ liệu',
    status: ExamSessionStatus.COMPLETED,
    joinToken: 'DB2024',
    startTime: '2024-12-12T13:00:00',
    endTime: '2024-12-12T15:00:00',
    examName: 'Database Design Test',
    description: 'Thiết kế CSDL',
    duration: 120,
  },
]

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const StudentExamSession = () => {
  const examSessions = mockExamSessions
  const [searchName, setSearchName] = useState('')
  const [dateRange, setDateRange] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<ExamSessionStatus | 'ALL'>(
    'ALL'
  )

  // Hàm lấy status config
  const getStatusConfig = (status: ExamSessionStatus) => {
    switch (status) {
      case ExamSessionStatus.NOT_STARTED:
        return {
          color: 'default',
          text: 'Chưa bắt đầu',
          icon: <ClockCircleOutlined />,
        }
      case ExamSessionStatus.IN_PROGRESS:
        return {
          color: 'processing',
          text: 'Đang diễn ra',
          icon: <PlayCircleOutlined />,
        }
      case ExamSessionStatus.COMPLETED:
        return {
          color: 'success',
          text: 'Đã hoàn thành',
          icon: <CheckCircleOutlined />,
        }
      case ExamSessionStatus.EXPIRED:
        return {
          color: 'error',
          text: 'Đã hết hạn',
          icon: <CloseCircleOutlined />,
        }
      default:
        return {
          color: 'default',
          text: 'Không xác định',
          icon: <ClockCircleOutlined />,
        }
    }
  }

  // Hàm xử lý tham gia bài thi
  const handleJoinExam = (session: ExamSession) => {
    console.log('Joining exam:', session)
  }

  // Hàm xử lý xem kết quả
  const handleViewResult = (session: ExamSession) => {
    console.log('Viewing result:', session)
  }

  // Hàm xử lý reset filter
  const handleResetFilter = () => {
    setSearchName('')
    setDateRange(null)
    setStatusFilter('ALL')
  }

  // Hàm xử lý tìm kiếm
  const handleSearch = () => {
    console.log('Searching with:', {
      name: searchName,
      dateRange,
      status: statusFilter,
    })
    // TODO: Implement filter logic
  }

  // Render action buttons
  const renderActionButtons = (session: ExamSession) => {
    const { status } = session

    if (status === ExamSessionStatus.IN_PROGRESS) {
      return (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          block
          size="large"
          onClick={() => handleJoinExam(session)}
        >
          Vào làm bài
        </Button>
      )
    }

    if (status === ExamSessionStatus.COMPLETED) {
      return (
        <Button
          type="default"
          icon={<FileTextOutlined />}
          block
          onClick={() => handleViewResult(session)}
        >
          Xem kết quả
        </Button>
      )
    }

    if (status === ExamSessionStatus.NOT_STARTED) {
      return (
        <Button type="default" block disabled>
          Chưa đến giờ thi
        </Button>
      )
    }

    return (
      <Button type="default" block disabled>
        Đã hết hạn
      </Button>
    )
  }

  // Render exam card
  const renderExamCard = (session: ExamSession) => {
    const statusConfig = getStatusConfig(session.status)

    return (
      <Col xs={24} sm={24} md={12} lg={8} key={session.id}>
        <StyledCard
          title={
            <CardTitle>
              <ExamName level={5}>{session.name}</ExamName>
              <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {statusConfig.text}
              </Tag>
            </CardTitle>
          }
        >
          {/* Description */}
          {session.description && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 16, minHeight: 44 }}
            >
              {session.description}
            </Paragraph>
          )}

          {/* Exam Info */}
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <InfoRow>
              <FileTextOutlined />
              <Text>{session.examName}</Text>
            </InfoRow>

            <InfoRow>
              <CalendarOutlined />
              <Text>
                {dayjs(session.startTime).format('DD/MM/YYYY HH:mm')} -{' '}
                {dayjs(session.endTime).format('HH:mm')}
              </Text>
            </InfoRow>

            <InfoRow>
              <ClockCircleOutlined />
              <Text>Thời gian: {session.duration} phút</Text>
            </InfoRow>
          </Space>

          {/* Join Token */}
          <TokenBox>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã tham gia
            </Text>
            <div>
              <TokenText>{session.joinToken}</TokenText>
            </div>
          </TokenBox>

          {/* Action Buttons */}
          <ActionButtons>{renderActionButtons(session)}</ActionButtons>
        </StyledCard>
      </Col>
    )
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title level={3} style={{ margin: 0 }}>
          Bài kiểm tra của tôi
        </Title>
        <Text type="secondary">
          Danh sách các bài kiểm tra được giao cho bạn
        </Text>
      </PageHeader>

      {/* Filter Section */}
      <FilterSection>
        <FilterRow>
          <FilterItem style={{ flex: 2 }}>
            <FilterLabel>Tìm kiếm theo tên</FilterLabel>
            <Input
              placeholder="Nhập tên bài kiểm tra..."
              prefix={<SearchOutlined />}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              allowClear
              size="large"
            />
          </FilterItem>

          <FilterItem style={{ flex: 1.5 }}>
            <FilterLabel>Thời gian thi</FilterLabel>
            <RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              size="large"
              style={{ width: '100%' }}
            />
          </FilterItem>

          <FilterItem style={{ flex: 1 }}>
            <FilterLabel>Trạng thái</FilterLabel>
            <Select
              placeholder="Chọn trạng thái"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              size="large"
              style={{ width: '100%' }}
            >
              <Option value="ALL">
                <Space>
                  <FilterOutlined />
                  Tất cả
                </Space>
              </Option>
              <Option value={ExamSessionStatus.IN_PROGRESS}>
                <Space>
                  <PlayCircleOutlined style={{ color: '#1890ff' }} />
                  Đang diễn ra
                </Space>
              </Option>
              <Option value={ExamSessionStatus.NOT_STARTED}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#666' }} />
                  Chưa bắt đầu
                </Space>
              </Option>
              <Option value={ExamSessionStatus.COMPLETED}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  Đã hoàn thành
                </Space>
              </Option>
              <Option value={ExamSessionStatus.EXPIRED}>
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  Đã hết hạn
                </Space>
              </Option>
            </Select>
          </FilterItem>

          <FilterItem style={{ flex: '0 0 auto', minWidth: 'auto' }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
              <Button onClick={handleResetFilter} size="large">
                Đặt lại
              </Button>
            </Space>
          </FilterItem>
        </FilterRow>
      </FilterSection>

      {/* Results Info */}
      <ResultsInfo>
        <Text>
          Hiển thị <Text strong>{examSessions.length}</Text> bài kiểm tra
        </Text>
        <Space>
          <Tag color="processing">
            Đang diễn ra:{' '}
            {
              examSessions.filter(
                (e) => e.status === ExamSessionStatus.IN_PROGRESS
              ).length
            }
          </Tag>
          <Tag color="default">
            Chưa bắt đầu:{' '}
            {
              examSessions.filter(
                (e) => e.status === ExamSessionStatus.NOT_STARTED
              ).length
            }
          </Tag>
          <Tag color="success">
            Đã hoàn thành:{' '}
            {
              examSessions.filter(
                (e) => e.status === ExamSessionStatus.COMPLETED
              ).length
            }
          </Tag>
        </Space>
      </ResultsInfo>

      {/* Exam Cards */}
      {examSessions.length === 0 ? (
        <Empty
          description="Chưa có bài kiểm tra nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Row gutter={[16, 16]}>{examSessions.map(renderExamCard)}</Row>
      )}
    </PageContainer>
  )
}

export default StudentExamSession

// Styled Components
const PageContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
`

const PageHeader = styled.div`
  margin-bottom: 24px;
`

const FilterSection = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .ant-card-body {
    padding: 20px;
  }
`

const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const FilterItem = styled.div`
  flex: 1;
  min-width: 200px;

  @media (max-width: 768px) {
    min-width: 100%;
  }
`

const FilterLabel = styled.div`
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
`

const StyledCard = styled(Card)`
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }

  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
    padding: 16px 20px;
  }

  .ant-card-body {
    padding: 20px;
  }
`

const CardTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
`

const ExamName = styled(Title)`
  margin: 0 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  flex: 1;
`

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #666;

  &:last-child {
    margin-bottom: 0;
  }

  .anticon {
    font-size: 16px;
    color: #1890ff;
  }
`

const TokenBox = styled.div`
  background: #f0f5ff;
  border: 1px dashed #1890ff;
  border-radius: 8px;
  padding: 8px 12px;
  text-align: center;
  margin: 12px 0;
`

const TokenText = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
  letter-spacing: 2px;
`

const ActionButtons = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
`

const ResultsInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
`

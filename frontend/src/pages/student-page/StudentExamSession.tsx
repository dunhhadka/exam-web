// pages/student-page/StudentExamSession.tsx
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  PlayCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useGetExamSessionsStudentsQuery } from '../../services/api/examSessionStudentApi'
import {
  ExamSessionStudentResponse,
  ExamStudentFilterRequest,
  SessionStudentStatus,
} from '../../types/examSessionStudent'
import {
  formatEndOfDay,
  formatInstant,
  formatStartOfDay,
} from '../../utils/times'
import ExamSessionStudent from './ExamSessionStudent'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const StudentExamSession = () => {
  const [searchName, setSearchName] = useState('')
  const [dateRange, setDateRange] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<
    SessionStudentStatus | 'ALL'
  >('ALL')
  const [confirmJoinExam, setConfirmJoinExam] = useState<{
    confirm: boolean
    exam?: ExamSessionStudentResponse
  }>({ confirm: false, exam: undefined })

  const [filter, setFilter] = useState<ExamStudentFilterRequest>({ limit: 100 })

  // Lấy isLoading và isFetching từ query
  const {
    data: cursorResponse,
    isLoading,
    isFetching,
  } = useGetExamSessionsStudentsQuery(filter, {
    refetchOnMountOrArgChange: true,
  })
  const examSessions = cursorResponse ? cursorResponse.data : []

  const handleResetFilter = () => {
    setSearchName('')
    setDateRange(null)
    setStatusFilter('ALL')
    setFilter({})
  }

  const handleSearch = () => {
    console.log('Searching with:', {
      name: searchName,
      dateRange,
      status: statusFilter,
    })

    setFilter({
      name: searchName || undefined,
      startTime: dateRange
        ? formatStartOfDay(dateRange[0].toDate())
        : undefined,
      endTime: dateRange ? formatEndOfDay(dateRange[1].toDate()) : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    })
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title level={3} style={{ margin: 0 }}>
          Danh sách bài kiểm tra
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
              disabled={isLoading || isFetching}
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
              disabled={isLoading || isFetching}
            />
          </FilterItem>

          <FilterItem style={{ flex: '0 0 auto', minWidth: 'auto' }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                onClick={handleSearch}
                loading={isLoading || isFetching}
              >
                Tìm kiếm
              </Button>
              <Button
                onClick={handleResetFilter}
                size="large"
                disabled={isLoading || isFetching}
              >
                Đặt lại
              </Button>
            </Space>
          </FilterItem>
        </FilterRow>
      </FilterSection>

      {/* Loading State */}
      {isLoading ? (
        <LoadingContainer>
          <Spin size="large" />
          <Text style={{ marginTop: 16 }}>Đang tải dữ liệu...</Text>
        </LoadingContainer>
      ) : examSessions.length === 0 ? (
        <Empty
          description="Chưa có bài kiểm tra nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <CardListContainer $isFetching={isFetching}>
          <Row gutter={[16, 16]}>
            {examSessions.map((item) => (
              <ExamSessionStudent session={item} />
            ))}
          </Row>
          {isFetching && <FetchingOverlay />}
        </CardListContainer>
      )}

      {confirmJoinExam.confirm && confirmJoinExam.exam && (
        <ConfirmModal
          open={confirmJoinExam.confirm}
          onOk={() => {}}
          onCancel={() =>
            setConfirmJoinExam({ confirm: false, exam: undefined })
          }
        />
      )}
    </PageContainer>
  )
}

export default StudentExamSession

// Styled Components
export const PageContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
`

export const PageHeader = styled.div`
  margin-bottom: 24px;
`

export const FilterSection = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .ant-card-body {
    padding: 20px;
  }
`

export const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`

export const FilterItem = styled.div`
  flex: 1;
  min-width: 200px;

  @media (max-width: 768px) {
    min-width: 100%;
  }
`

export const FilterLabel = styled.div`
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
`

export const StyledCard = styled(Card)`
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

export const CardTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
`

export const ExamName = styled(Title)`
  margin: 0 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  flex: 1;
`

export const InfoRow = styled.div`
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

export const TokenBox = styled.div`
  background: #f0f5ff;
  border: 1px dashed #1890ff;
  border-radius: 8px;
  padding: 8px 12px;
  text-align: center;
  margin: 12px 0;
`

export const TokenText = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
  letter-spacing: 2px;
`

export const ActionButtons = styled.div`
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

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`

export const CardListContainer = styled.div<{ $isFetching: boolean }>`
  position: relative;
  opacity: ${(props) => (props.$isFetching ? 0.6 : 1)};
  transition: opacity 0.3s ease;
`

export const FetchingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  z-index: 10;
  backdrop-filter: blur(2px);

  &::after {
    content: '';
    position: absolute;
    width: 40px;
    height: 40px;
    border: 4px solid #1890ff;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

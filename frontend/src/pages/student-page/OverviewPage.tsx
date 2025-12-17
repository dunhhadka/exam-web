import { useState } from 'react'
import { Card, Row, Col, Statistic, Select, Progress, Tag, Table } from 'antd'
import {
  TrophyOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
} from 'recharts'

const PageContainer = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`

const PageHeader = styled.div`
  margin-bottom: 24px;
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0 0 8px 0;
`

const Subtitle = styled.p`
  color: #8c8c8c;
  margin: 0;
`

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
`

const StatsCard = styled(Card)`
  height: 100%;

  .ant-card-body {
    padding: 20px;
  }

  .ant-statistic-title {
    color: #8c8c8c;
    font-size: 14px;
  }

  .ant-statistic-content {
    color: #1f1f1f;
    font-size: 28px;
    font-weight: 600;
  }
`

const ChartCard = styled(Card)`
  margin-bottom: 24px;

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-card-head-title {
    font-size: 16px;
    font-weight: 600;
  }
`

const TrendIndicator = styled.span<{ trend: 'up' | 'down' }>`
  color: ${(props) => (props.trend === 'up' ? '#52c41a' : '#ff4d4f')};
  font-size: 14px;
  margin-left: 8px;
`

const OverviewPage = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')

  // Dữ liệu tổng quan của sinh viên
  const studentStats = {
    totalExams: 24,
    completedExams: 18,
    averageScore: 8.3,
    highestScore: 9.8,
    rank: 5,
    totalStudents: 120,
    trend: 'up' as const,
    scoreTrend: 12,
  }

  // Lịch sử điểm theo thời gian
  const scoreHistoryData = [
    { date: '01/11', score: 7.5, exam: 'Toán A1' },
    { date: '05/11', score: 8.2, exam: 'Lý A2' },
    { date: '10/11', score: 7.8, exam: 'Hóa B1' },
    { date: '15/11', score: 8.9, exam: 'Anh C1' },
    { date: '20/11', score: 8.5, exam: 'Văn D2' },
    { date: '25/11', score: 9.2, exam: 'Sinh E1' },
    { date: '30/11', score: 8.7, exam: 'Sử F1' },
    { date: '05/12', score: 9.5, exam: 'Địa G1' },
  ]

  // Thống kê thời gian làm bài
  const timeStatisticsData = [
    { month: 'T7', totalTime: 180, avgTime: 36 },
    { month: 'T8', totalTime: 240, avgTime: 40 },
    { month: 'T9', totalTime: 300, avgTime: 43 },
    { month: 'T10', totalTime: 270, avgTime: 38 },
    { month: 'T11', totalTime: 360, avgTime: 45 },
    { month: 'T12', totalTime: 320, avgTime: 40 },
  ]

  // Phân bố điểm của sinh viên
  const myScoreDistribution = [
    { range: '9-10', count: 6, color: '#52c41a' },
    { range: '8-9', count: 8, color: '#73d13d' },
    { range: '7-8', count: 3, color: '#95de64' },
    { range: '6-7', count: 1, color: '#ffc53d' },
    { range: '0-6', count: 0, color: '#ff4d4f' },
  ]

  // Các bài thi gần đây
  const recentExamsData = [
    {
      key: '1',
      exam: 'Toán cao cấp - Kiểm tra giữa kỳ',
      date: '05/12/2024',
      score: 9.5,
      status: 'completed',
      duration: '45 phút',
    },
    {
      key: '2',
      exam: 'Tiếng Anh B1 - Listening',
      date: '03/12/2024',
      score: 8.7,
      status: 'completed',
      duration: '30 phút',
    },
    {
      key: '3',
      exam: 'Lập trình C++ - Bài tập tuần 5',
      date: '01/12/2024',
      score: 9.2,
      status: 'completed',
      duration: '60 phút',
    },
    {
      key: '4',
      exam: 'Vật lý đại cương - Quiz',
      date: 'Đang làm',
      score: null,
      status: 'in-progress',
      duration: '20 phút',
    },
  ]

  const examColumns = [
    {
      title: 'Bài thi',
      dataIndex: 'exam',
      key: 'exam',
      width: '40%',
    },
    {
      title: 'Ngày thi',
      dataIndex: 'date',
      key: 'date',
      width: '20%',
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      width: '15%',
      render: (score: number | null, record: any) => {
        if (record.status === 'in-progress') {
          return <Tag color="processing">Đang làm</Tag>
        }
        return (
          <span
            style={{
              fontWeight: 600,
              color:
                score && score >= 8
                  ? '#52c41a'
                  : score && score >= 5
                  ? '#faad14'
                  : '#ff4d4f',
            }}
          >
            {score?.toFixed(1)}
          </span>
        )
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'duration',
      key: 'duration',
      width: '15%',
    },
  ]

  const COLORS = ['#52c41a', '#73d13d', '#95de64', '#ffc53d', '#ff4d4f']

  return (
    <PageContainer>
      <PageHeader>
        <Title>Tổng quan kết quả học tập</Title>
        <Subtitle>Theo dõi tiến độ và thành tích của bạn</Subtitle>
      </PageHeader>

      <FilterSection>
        <span style={{ color: '#8c8c8c' }}>Khoảng thời gian:</span>
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 150 }}
        >
          <Select.Option value="week">7 ngày qua</Select.Option>
          <Select.Option value="month">30 ngày qua</Select.Option>
          <Select.Option value="all">Tất cả</Select.Option>
        </Select>
      </FilterSection>

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard>
            <Statistic
              title="Tổng số bài thi"
              value={studentStats.totalExams}
              prefix={<FileTextOutlined />}
              suffix={
                <TrendIndicator trend={studentStats.trend}>
                  <RiseOutlined /> {studentStats.scoreTrend}%
                </TrendIndicator>
              }
            />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard>
            <Statistic
              title="Đã hoàn thành"
              value={studentStats.completedExams}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={Math.round(
                (studentStats.completedExams / studentStats.totalExams) * 100
              )}
              strokeColor="#52c41a"
              style={{ marginTop: 8 }}
            />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard>
            <Statistic
              title="Điểm trung bình"
              value={studentStats.averageScore}
              precision={1}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={`/ 10`}
            />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard>
            <Statistic
              title="Xếp hạng"
              value={`${studentStats.rank}/${studentStats.totalStudents}`}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </StatsCard>
        </Col>
      </Row>

      {/* Biểu đồ điểm theo thời gian */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <ChartCard title="Lịch sử điểm số">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={scoreHistoryData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          style={{
                            background: 'white',
                            padding: '10px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                          }}
                        >
                          <p style={{ margin: 0, fontWeight: 600 }}>
                            {payload[0].payload.exam}
                          </p>
                          <p style={{ margin: '4px 0 0 0', color: '#1890ff' }}>
                            Điểm: {payload[0].value}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#1890ff"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>

        {/* Phân bố điểm */}
        <Col xs={24} lg={8}>
          <ChartCard title="Phân bố điểm số">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={myScoreDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {myScoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>
      </Row>

      {/* Biểu đồ thời gian làm bài */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ChartCard title="Thống kê thời gian làm bài (phút)">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={timeStatisticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalTime"
                  stroke="#1890ff"
                  strokeWidth={2}
                  name="Tổng thời gian"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  stroke="#52c41a"
                  strokeWidth={2}
                  name="Thời gian TB/bài"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Col>

        {/* Bảng các bài thi gần đây */}
        <Col xs={24} lg={12}>
          <ChartCard title="Bài thi gần đây">
            <Table
              columns={examColumns}
              dataSource={recentExamsData}
              pagination={false}
              size="small"
            />
          </ChartCard>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default OverviewPage

import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { RiseOutlined, UserOutlined, FileTextOutlined, TrophyOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { Row, Col, Spin } from 'antd'
import * as Chart from 'chart.js'
import { useGetDashboardStatsQuery } from '../../services/api/dashboardApi'

const Home = () => {
  const { data: dashboardData, isLoading, isError } = useGetDashboardStatsQuery()
  
  const barChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const radarChartRef = useRef<HTMLCanvasElement>(null)
  const areaChartRef = useRef<HTMLCanvasElement>(null)

  const chartInstances = useRef<Chart.Chart[]>([])

  useEffect(() => {
    if (!dashboardData) return
    // Đăng ký tất cả components của Chart.js
    Chart.Chart.register(
      Chart.CategoryScale,
      Chart.LinearScale,
      Chart.BarElement,
      Chart.BarController,
      Chart.LineElement,
      Chart.LineController,
      Chart.PointElement,
      Chart.ArcElement,
      Chart.DoughnutController,
      Chart.RadarController,
      Chart.RadialLinearScale,
      Chart.Filler,
      Chart.Title,
      Chart.Tooltip,
      Chart.Legend
    )

    // Destroy old charts before creating new ones
    chartInstances.current.forEach(chart => {
      if (chart) {
        chart.destroy()
      }
    })
    chartInstances.current = []

    // Bar Chart - Phân bố điểm số
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d')
      if (!ctx) return
      
      const scoreLabels = dashboardData.scoreDistribution.map(item => item.range)
      const scoreData = dashboardData.scoreDistribution.map(item => item.count)
      
      const barChart = new Chart.Chart(ctx, {
        type: 'bar',
        data: {
          labels: scoreLabels,
          datasets: [{
            label: 'Số lượng học viên',
            data: scoreData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(255, 159, 64, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(54, 162, 235, 0.8)',
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
            ],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              border: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              border: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          },
          animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
          }
        }
      })
      chartInstances.current.push(barChart)
    }

    // Pie Chart - Trạng thái bài thi
    if (pieChartRef.current) {
      const ctx = pieChartRef.current.getContext('2d')
      if (!ctx) return
      
      const statusLabels = dashboardData.attemptStatusDistribution.map(item => {
        if (item.status === 'SUBMITTED') return 'Đã nộp'
        if (item.status === 'IN_PROGRESS') return 'Đang làm'
        if (item.status === 'ABANDONED') return 'Bỏ dở'
        return item.status
      })
      const statusData = dashboardData.attemptStatusDistribution.map(item => item.count)
      
      const pieChart = new Chart.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusData,
            backgroundColor: [
              'rgba(82, 196, 26, 0.8)',
              'rgba(24, 144, 255, 0.8)',
              'rgba(255, 77, 79, 0.8)',
            ],
            borderColor: [
              'rgb(82, 196, 26)',
              'rgb(24, 144, 255)',
              'rgb(255, 77, 79)',
            ],
            borderWidth: 3,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                font: {
                  size: 13
                },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.parsed || 0
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${label}: ${value} (${percentage}%)`
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeInOutQuart'
          }
        }
      })
      chartInstances.current.push(pieChart)
    }

    // Line Chart - Lượt thi theo thời gian
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d')
      if (!ctx) return
      
      const timeLabels = dashboardData.attemptsOverTime.map(item => item.date)
      const timeData = dashboardData.attemptsOverTime.map(item => item.count)
      
      const lineChart = new Chart.Chart(ctx, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'Số lượt thi',
            data: timeData,
            borderColor: 'rgb(82, 196, 26)',
            backgroundColor: 'rgba(82, 196, 26, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgb(82, 196, 26)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(82, 196, 26)',
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              border: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              border: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          },
          animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
          }
        }
      })
      chartInstances.current.push(lineChart)
    }

    // Bar Chart - Tỷ lệ hoàn thành theo mức độ
    if (radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d')
      if (!ctx) return
      
      const levelLabels = dashboardData.completionRateByLevel.map(item => {
        if (item.level === 'EASY') return 'Dễ'
        if (item.level === 'MEDIUM') return 'Trung bình'
        if (item.level === 'HARD') return 'Khó'
        return item.level
      })
      const completionRateData = dashboardData.completionRateByLevel.map(item => item.completionRate)
      
      const completionRateChart = new Chart.Chart(ctx, {
        type: 'bar',
        data: {
          labels: levelLabels,
          datasets: [{
            label: 'Tỷ lệ hoàn thành (%)',
            data: completionRateData,
            backgroundColor: [
              'rgba(82, 196, 26, 0.8)',
              'rgba(24, 144, 255, 0.8)',
              'rgba(255, 77, 79, 0.8)',
            ],
            borderColor: [
              'rgb(82, 196, 26)',
              'rgb(24, 144, 255)',
              'rgb(255, 77, 79)',
            ],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                afterLabel: function(context) {
                  const index = context.dataIndex
                  const item = dashboardData.completionRateByLevel[index]
                  return `Đã nộp: ${item.submittedAttempts} / Tổng: ${item.totalAttempts}`
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                font: {
                  size: 12
                },
                callback: function(value) {
                  return value + '%'
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              border: {
                display: false
              }
            },
            x: {
              grid: {
                display: false
              },
              border: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          },
          animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
          }
        }
      })
      chartInstances.current.push(completionRateChart)
    }

    // Area Chart - Bài thi được tạo theo tháng
    if (areaChartRef.current) {
      const ctx = areaChartRef.current.getContext('2d')
      if (!ctx) return
      const gradient = ctx.createLinearGradient(0, 0, 0, 300)
      gradient.addColorStop(0, 'rgba(250, 173, 20, 0.4)')
      gradient.addColorStop(1, 'rgba(250, 173, 20, 0.01)')

      const monthLabels = dashboardData.examsCreatedOverTime.map(item => item.month)
      const monthData = dashboardData.examsCreatedOverTime.map(item => item.count)
      
      const areaChart = new Chart.Chart(ctx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Số bài thi tạo',
            data: monthData,
            borderColor: 'rgb(250, 173, 20)',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgb(250, 173, 20)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(250, 173, 20)',
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              border: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              border: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          },
          animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
          }
        }
      })
      chartInstances.current.push(areaChart)
    }

    return () => {
      chartInstances.current.forEach(chart => chart?.destroy())
    }
  }, [dashboardData])

  const stats = dashboardData ? [
    {
      title: 'Tổng số bài thi',
      value: dashboardData.totalExams.toString(),
      icon: <FileTextOutlined />,
      color: '#1890ff',
      bgColor: '#e6f7ff',
    },
    {
      title: 'Tổng học viên',
      value: dashboardData.totalStudents.toString(),
      icon: <UserOutlined />,
      color: '#52c41a',
      bgColor: '#f6ffed',
    },
    {
      title: 'Điểm trung bình',
      value: dashboardData.averageScore.toFixed(1),
      icon: <TrophyOutlined />,
      color: '#faad14',
      bgColor: '#fffbe6',
    },
    {
      title: 'Thời gian làm bài trung bình',
      value: `${Math.round(dashboardData.averageTime)} phút`,
      icon: <ClockCircleOutlined />,
      color: '#722ed1',
      bgColor: '#f9f0ff',
    },
  ] : []

  if (isLoading) {
    return (
      <Container>
        <LoadingWrapper>
          <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
        </LoadingWrapper>
      </Container>
    )
  }

  if (isError || !dashboardData) {
    return (
      <Container>
        <ErrorWrapper>
          <h3>Không thể tải dữ liệu dashboard</h3>
          <p>Vui lòng thử lại sau</p>
        </ErrorWrapper>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Title>
          <RiseOutlined /> Dashboard Thống Kê
        </Title>
        <Subtitle>Tổng quan hệ thống thi trắc nghiệm</Subtitle>
      </Header>

      {/* Stats Cards */}
      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index} bgColor={stat.bgColor}>
            <StatIcon className="stat-icon" color={stat.color}>{stat.icon}</StatIcon>
            <StatContent>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.title}</StatLabel>
            </StatContent>
          </StatCard>
        ))}
      </StatsGrid>

      {/* Top 2 Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <ChartCard>
            <CardTitle>Phân bố điểm số</CardTitle>
            <CanvasContainer>
              <canvas ref={barChartRef}></canvas>
            </CanvasContainer>
          </ChartCard>
        </Col>

        <Col xs={24} lg={12}>
          <ChartCard>
            <CardTitle>Trạng thái bài thi</CardTitle>
            <CanvasContainer>
              <canvas ref={pieChartRef}></canvas>
            </CanvasContainer>
          </ChartCard>
        </Col>
      </Row>

      {/* Middle 2 Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <ChartCard>
            <CardTitle>Lượt thi gần đây</CardTitle>
            <CanvasContainer>
              <canvas ref={lineChartRef}></canvas>
            </CanvasContainer>
          </ChartCard>
        </Col>

        <Col xs={24} lg={12}>
          <ChartCard>
            <CardTitle>Tỷ lệ hoàn thành theo mức độ</CardTitle>
            <CanvasContainer>
              <canvas ref={radarChartRef}></canvas>
            </CanvasContainer>
          </ChartCard>
        </Col>
      </Row>

      {/* Bottom Chart */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ChartCard>
            <CardTitle>Bài thi được tạo theo tháng</CardTitle>
            <CanvasContainer style={{ height: '320px' }}>
              <canvas ref={areaChartRef}></canvas>
            </CanvasContainer>
          </ChartCard>
        </Col>
      </Row>
    </Container>
  )
}

// Styled Components
const Container = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`

const Header = styled.div`
  margin-bottom: 32px;
  animation: fadeInDown 0.6s ease-out;

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #262626;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;

  .anticon {
    color: #1890ff;
  }
`

const Subtitle = styled.p`
  font-size: 16px;
  color: #8c8c8c;
  margin: 0;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`

const StatCard = styled.div<{ bgColor: string }>`
  background: white;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ bgColor }) => bgColor};
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    &::before {
      transform: scaleX(1);
    }

    .stat-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const StatIcon = styled.div<{ color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: ${({ color }) => color};
  background: ${({ color }) => `${color}15`};
  transition: all 0.3s ease;
`

const StatContent = styled.div`
  flex: 1;
`

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 4px;
`

const StatLabel = styled.div`
  font-size: 14px;
  color: #8c8c8c;
`

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.8s ease-out;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 20px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
`

const CanvasContainer = styled.div`
  position: relative;
  height: 300px;
`

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
`

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  
  h3 {
    color: #ff4d4f;
    font-size: 20px;
    margin-bottom: 8px;
  }
  
  p {
    color: #8c8c8c;
    font-size: 14px;
  }
`

export default Home
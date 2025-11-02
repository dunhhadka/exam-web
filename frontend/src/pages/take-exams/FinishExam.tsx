import React from 'react'
import { Result, Button, Card, Space, Statistic, Row, Col } from 'antd'
import {
  CheckCircleOutlined,
  HomeOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

const ContentWrapper = styled.div`
  max-width: 800px;
  width: 100%;
`

const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

  .ant-card-body {
    padding: 48px;
  }
`

const StatsCard = styled(Card)`
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);

  .ant-statistic-title {
    font-weight: 500;
    color: #595959;
  }

  .ant-statistic-content {
    font-weight: 600;
  }
`

const ActionButton = styled(Button)`
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  padding: 0 32px;
`

const FinishExam = () => {
  return (
    <Container>
      <ContentWrapper>
        <StyledCard>
          <Result
            status="success"
            title="Chúc mừng! Bạn đã hoàn thành bài thi"
            subTitle="Bài làm của bạn đã được nộp thành công. Kết quả sẽ được thông báo sớm nhất có thể."
            icon={<CheckCircleOutlined style={{ fontSize: 72 }} />}
          />

          <Row gutter={[16, 16]} style={{ marginTop: 32, marginBottom: 32 }}>
            <Col xs={24} sm={12}>
              <StatsCard>
                <Statistic
                  title="Thời gian hoàn thành"
                  value="45:32"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </StatsCard>
            </Col>
            <Col xs={24} sm={12}>
              <StatsCard>
                <Statistic
                  title="Số câu đã làm"
                  value={40}
                  suffix="/ 40"
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </StatsCard>
            </Col>
            <Col xs={24} sm={12}>
              <StatsCard>
                <Statistic
                  title="Độ hoàn thành"
                  value={100}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </StatsCard>
            </Col>
            <Col xs={24} sm={12}>
              <StatsCard>
                <Statistic
                  title="Trạng thái"
                  value="Đã nộp"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: 20 }}
                />
              </StatsCard>
            </Col>
          </Row>

          <Space
            size="middle"
            style={{
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            <ActionButton
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => (window.location.href = '/')}
            >
              Về trang chủ
            </ActionButton>
            <ActionButton
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => (window.location.href = '/results')}
            >
              Xem kết quả
            </ActionButton>
          </Space>
        </StyledCard>
      </ContentWrapper>
    </Container>
  )
}

export default FinishExam

import { CopyrightOutlined } from '@ant-design/icons'
import { Layout, Space, theme, Typography } from 'antd'

export const Footer: React.FC = () => {
  const { Footer: AntFooter } = Layout
  const { Text } = Typography
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <AntFooter
      style={{
        textAlign: 'center',
        background: colorBgContainer,
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px',
      }}
    >
      <Space>
        <CopyrightOutlined />
        <Text type="secondary">2024 Exam System. All rights reserved.</Text>
      </Space>
    </AntFooter>
  )
}

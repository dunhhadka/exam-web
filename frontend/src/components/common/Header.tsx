import {
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Space,
  theme,
  Typography,
} from 'antd'

interface HeaderProps {
  collapsed: boolean
  onToggleCollapse: () => void
  userMenuItems: any[]
  user?: {
    fullName?: string
    email: string
    role: string
    avatar?: string
  }
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
  userMenuItems,
  user = {
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'Administrator',
  },
}) => {
  const { Header: AntHeader } = Layout
  const { Text } = Typography
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: colorBgContainer,
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Left side - Collapse button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          style={{
            fontSize: '16px',
            width: 40,
            height: 40,
          }}
        />

        {/* Search */}
        <Button
          type="text"
          icon={<SearchOutlined />}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: collapsed ? 40 : 120,
          }}
          onClick={() => console.log('Search clicked')}
        >
          {!collapsed && 'Tìm kiếm...'}
        </Button>
      </div>

      {/* Right side - User info */}
      <Space size="middle">
        {/* Notifications */}
        <Badge count={5} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => console.log('Notifications clicked')}
            style={{
              fontSize: '16px',
              width: 40,
              height: 40,
            }}
          />
        </Badge>

        {/* User dropdown */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow={{ pointAtCenter: true }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text style={{ fontSize: 14, lineHeight: 1.2 }}>
                {user.fullName || user.email}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.2 }}>
                {user.role}
              </Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

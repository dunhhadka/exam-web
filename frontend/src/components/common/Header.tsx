import { UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Layout, Space, theme, Typography } from 'antd'
import { Profile } from '../../types/auth'

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
  profile?: Profile
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
  userMenuItems,
  profile,
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
      {/* Left side - reserved (toggle moved to Sidebar) */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 40 }}
      />

      {/* Right side - User info */}
      <Space size="middle">
        {/* Notifications */}
        {/* <Badge count={5} size="small">
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
        </Badge> */}

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
            <Avatar
              size="small"
              icon={<UserOutlined />}
              src={profile?.avatarUrl}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text style={{ fontSize: 14, lineHeight: 1.2 }}>
                {profile?.firstName + ' ' + profile?.lastName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.2 }}>
                {'Teacher'}
              </Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

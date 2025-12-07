import { Menu, theme, Typography } from 'antd'
import { MenuItem } from '../../types/common'
import Sider from 'antd/es/layout/Sider'

interface SidebarProps {
  collapsed: boolean
  menuItems: MenuItem[]
  selectedKey: string
  openKeys: string[]
  onMenuClick: (key: string) => void
  onOpenChange: (keys: string[]) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  menuItems,
  selectedKey,
  openKeys,
  onMenuClick,
  onOpenChange,
}) => {
  const { Text } = Typography

  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const getMenuItems = (items: MenuItem[]): any => {
    return items.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children ? getMenuItems(item.children) : undefined,
    }))
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      style={{
        background: colorBgContainer,
        borderRight: '1px solid #f0f0f0',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 200,
      }}
    >
      {/* Logo/Brand */}
      <div
        style={{
          height: 64,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {collapsed ? (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M8 12L20 4L32 12V28L20 36L8 28V12Z"
              fill="#1890ff"
            />
            <path
              d="M20 16L26 20V28L20 32L14 28V20L20 16Z"
              fill="#fff"
            />
          </svg>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M8 12L20 4L32 12V28L20 36L8 28V12Z"
                fill="#1890ff"
              />
              <path
                d="M20 16L26 20V28L20 32L14 28V20L20 16Z"
                fill="#fff"
              />
            </svg>
            <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
              exam.vn
            </Text>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={getMenuItems(menuItems)}
        onClick={({ key }) => onMenuClick(key)}
        style={{
          borderRight: 0,
          height: 'calc(100vh - 65px)',
          overflowY: 'auto',
        }}
      />
    </Sider>
  )
}

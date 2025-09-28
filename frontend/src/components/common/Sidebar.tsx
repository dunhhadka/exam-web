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
          <div
            style={{
              width: 32,
              height: 32,
              background: '#1677ff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            E
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: '#1677ff',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              E
            </div>
            <Text strong style={{ fontSize: 16 }}>
              Exam System
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

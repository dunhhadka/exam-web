import { Menu, Typography, Button, Tooltip } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { MenuItem } from '../../types/common'
import Sider from 'antd/es/layout/Sider'

interface SidebarProps {
  collapsed: boolean
  menuItems: MenuItem[]
  selectedKey: string
  openKeys: string[]
  onMenuClick: (key: string) => void
  onOpenChange: (keys: string[]) => void
  onToggleCollapse?: () => void
}

const StyledSider = styled(Sider)`
  background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%) !important;
  border-right: 1px solid #e8eef7 !important;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);

  .ant-menu {
    background: transparent !important;
    border-right: none !important;

    .ant-menu-item {
      margin: 6px 12px;
      border-radius: 8px;
      color: #333 !important;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

      &:hover {
        color: #1890ff !important;
        background-color: #f0f7ff !important;
      }

      &.ant-menu-item-selected {
        background: linear-gradient(
          135deg,
          #1890ff 0%,
          #40a9ff 100%
        ) !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

        &::after {
          border-right-color: transparent !important;
        }
      }
    }

    .ant-menu-submenu {
      > .ant-menu-submenu-title {
        margin: 6px 12px;
        border-radius: 8px;
        color: #333 !important;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

        &:hover {
          color: #1890ff !important;
          background-color: #f0f7ff !important;
        }
      }

      &.ant-menu-submenu-open > .ant-menu-submenu-title {
        color: #1890ff !important;
        background-color: #f0f7ff !important;
      }
    }

    .ant-menu-submenu-popup {
      background: linear-gradient(135deg, #f5f9ff 0%, #eef5ff 100%) !important;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(24, 144, 255, 0.12);

      .ant-menu-item {
        &.ant-menu-item-selected {
          background: linear-gradient(
            135deg,
            #1890ff 0%,
            #40a9ff 100%
          ) !important;
          color: white !important;
        }
      }
    }
  }

  /* Custom Scrollbar */
  .ant-menu::-webkit-scrollbar {
    width: 6px;
  }

  .ant-menu::-webkit-scrollbar-track {
    background: transparent;
  }

  .ant-menu::-webkit-scrollbar-thumb {
    background: #d9e6f6;
    border-radius: 3px;
    transition: all 0.2s ease;

    &:hover {
      background: #b3d8ff;
    }
  }
`

const LogoContainer = styled.div`
  height: 64px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8eef7;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f8fb 100%);
  gap: 12px;
`

const LogoBadge = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
  }
`

const LogoText = styled(Typography.Text)`
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
`

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  menuItems,
  selectedKey,
  openKeys,
  onMenuClick,
  onOpenChange,
  onToggleCollapse,
}) => {
  const getMenuItems = (items: MenuItem[]): any => {
    return items.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children ? getMenuItems(item.children) : undefined,
    }))
  }

  return (
    <StyledSider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 200,
      }}
    >
      {/* Logo/Brand */}
      <LogoContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {collapsed ? (
            <LogoBadge>E</LogoBadge>
          ) : (
            <>
              <LogoBadge>E</LogoBadge>
              <LogoText strong>Exam System</LogoText>
            </>
          )}
        </div>
        <ToggleContainer>
          <Tooltip title={collapsed ? 'Mở menu' : 'Thu gọn menu'}>
            <Button
              type="text"
              onClick={() => onToggleCollapse && onToggleCollapse()}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              style={{
                borderRadius: 6,
                height: 32,
                width: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
        </ToggleContainer>
      </LogoContainer>

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={getMenuItems(menuItems)}
        onClick={({ key }) => onMenuClick(key)}
        style={{
          height: 'calc(100vh - 65px)',
          overflowY: 'auto',
          padding: '12px 0',
        }}
      />
    </StyledSider>
  )
}

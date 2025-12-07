import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MenuItem } from '../../types/common'
import {
  BarChartOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Layout } from 'antd'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { Footer } from '../common/Footer'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { setProfile } from '../../store/slices/authSlice'

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('home')
  const [openKeys, setOpenKeys] = useState<string[]>(['exams'])
  const dispatch = useDispatch()

  const navigate = useNavigate()

  const menuItems: MenuItem[] = [
    {
      key: 'Home',
      icon: <HomeOutlined />,
      label: 'Trang chủ',
      path: '/home',
    },
    {
      key: 'exams',
      icon: <FileTextOutlined />,
      label: 'Quản lý đề thi',
      path: '/exams',
      children: [
        {
          key: 'exams-list',
          icon: <BookOutlined />,
          label: 'Danh sách đề thi',
          path: '/exams',
        },
        {
          key: 'exams-create',
          icon: <FileTextOutlined />,
          label: 'Tạo đề thi mới',
          path: '/exams/create',
        },
      ],
    },
    {
      key: 'questions',
      icon: <BookOutlined />,
      label: 'Ngân hàng câu hỏi',
      path: '/questions',
    },
    {
      key: 'examsessions',
      icon: <FileTextOutlined />,
      label: 'Giao bài kiểm tra',
      path: '/examsessions',
    },
    {
      key: 'results',
      icon: <BarChartOutlined />,
      label: 'Kết quả thi',
      path: '/results',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'Quản lý người dùng',
      path: '/users',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Thông tin cá nhân',
      path: '/settings',
    },
  ]

  const handleLogout = () => {
    console.log('Logout clicked')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userProfile')

    window.location.href = '/login'
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => console.log('Profile clicked'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => console.log('Settings clicked'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ]

  const handleMenuClick = (key: string) => {
    setSelectedKey(key)
    navigate(findPathByKey(key, menuItems))
  }

  const findPathByKey = (key: string, menuItems: MenuItem[]): string => {
    for (const item of menuItems) {
      if (item.key === key) {
        return item.path
      }

      if (item.children && !!item.children.length) {
        const childPath = findPathByKey(key, item.children)
        if (childPath !== '/home') {
          return childPath
        }
      }
    }

    return '/home'
  }

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  const { profile } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile && !profile) {
      try {
        const parsedProfile = JSON.parse(savedProfile)
        dispatch(setProfile(parsedProfile))
      } catch (error) {
        console.error('Failed to parse saved profile:', error)
        localStorage.removeItem('userProfile')
      }
    }
  }, [dispatch, profile])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        menuItems={menuItems}
        selectedKey={selectedKey}
        openKeys={openKeys}
        onMenuClick={handleMenuClick}
        onOpenChange={handleOpenChange}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          userMenuItems={userMenuItems}
          profile={profile}
        />
        <div style={{ minHeight: '100vh' }}>
          <Outlet />
        </div>
        <Footer />
      </Layout>
    </Layout>
  )
}

export default MainLayout

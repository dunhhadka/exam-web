// components/common/NotificationDropdown.tsx
import {
  BellOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Badge, Button, Empty, List, Tabs, Typography, Popconfirm } from 'antd'
import { useState } from 'react'
import styled from '@emotion/styled'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import {
  NotificationResponse,
  NotificationType,
  Notification,
} from '../../types/notification'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Text } = Typography

const mockNotifications: NotificationResponse = {
  data: [
    {
      id: 1,
      content:
        'Bạn có bài kiểm tra Toán học mới cần hoàn thành trước ngày 25/12/2024',
      type: NotificationType.ADD_EXAM,
      receiveId: 1,
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 phút trước
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      content: 'Điểm bài kiểm tra Vật lý của bạn đã được công bố. Điểm: 8.5/10',
      type: NotificationType.EXAM_RESULT,
      receiveId: 1,
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 giờ trước
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      content:
        'Bài kiểm tra Hóa học sẽ hết hạn trong 2 giờ nữa. Vui lòng hoàn thành!',
      type: NotificationType.DEADLINE_REMINDER,
      receiveId: 1,
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      content: 'Bạn đã hoàn thành bài kiểm tra Tiếng Anh với điểm số 9.0/10',
      type: NotificationType.EXAM_RESULT,
      receiveId: 1,
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      content: 'Hệ thống sẽ bảo trì vào 2h sáng ngày 15/12/2024',
      type: NotificationType.SYSTEM,
      receiveId: 1,
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ngày trước
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 6,
      content: 'Bạn có bài kiểm tra Địa lý mới được giao',
      type: NotificationType.ADD_EXAM,
      receiveId: 1,
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 ngày trước
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  total: 6,
  unreadCount: 3,
}

// Styled components
const DropdownContainer = styled.div`
  width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 6px 16px 0 rgba(0, 0, 0, 0.08);
`

const HeaderContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
`

const FooterContainer = styled.div`
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
`

interface NotificationItemProps {
  isRead: boolean
}

const NotificationItem = styled(List.Item)<NotificationItemProps>`
  padding: 12px 16px !important;
  background-color: ${(props) => (props.isRead ? 'transparent' : '#f0f5ff')};
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;

  &:hover {
    background-color: ${(props) =>
      props.isRead ? '#fafafa' : '#e6f0ff'} !important;
  }
`

const NotificationMeta = styled.div`
  display: flex;
  align-items: start;
  gap: 12px;
`

const NotificationIcon = styled.div`
  font-size: 20px;
  margin-top: 2px;
`

const NotificationContent = styled.div`
  flex: 1;
`

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 4px;
`

const NotificationBody = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
`

const NotificationTime = styled.div`
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
`

const ScrollableList = styled.div`
  max-height: 450px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`

const NotificationDropdown = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState(mockNotifications.data)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const unreadNotifications = notifications.filter((n) => !n.isRead)

  // Hàm lấy icon và màu sắc theo loại thông báo
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ADD_EXAM:
        return {
          icon: <FileTextOutlined />,
          color: '#1890ff',
        }
      case NotificationType.EXAM_RESULT:
        return {
          icon: <TrophyOutlined />,
          color: '#52c41a',
        }
      case NotificationType.DEADLINE_REMINDER:
        return {
          icon: <WarningOutlined />,
          color: '#faad14',
        }
      case NotificationType.SYSTEM:
        return {
          icon: <InfoCircleOutlined />,
          color: '#722ed1',
        }
      default:
        return {
          icon: <BellOutlined />,
          color: '#666',
        }
    }
  }

  // Hàm format nội dung thông báo
  const getNotificationTitle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ADD_EXAM:
        return 'Bài kiểm tra mới'
      case NotificationType.EXAM_RESULT:
        return 'Kết quả bài kiểm tra'
      case NotificationType.DEADLINE_REMINDER:
        return 'Nhắc nhở hạn nộp'
      case NotificationType.SYSTEM:
        return 'Thông báo hệ thống'
      default:
        return 'Thông báo'
    }
  }

  // Xử lý đánh dấu đã đọc
  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  // Xử lý đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  // Xử lý xóa thông báo
  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Render một item thông báo
  const renderNotificationItem = (item: Notification) => {
    const style = getNotificationStyle(item.type)
    const timeAgo = dayjs(item.createdAt).fromNow()

    return (
      <NotificationItem
        key={item.id}
        isRead={item.isRead}
        onClick={() => !item.isRead && handleMarkAsRead(item.id)}
        actions={[
          <Popconfirm
            title="Xóa thông báo"
            description="Bạn có chắc muốn xóa thông báo này?"
            onConfirm={(e) => {
              e?.stopPropagation()
              handleDelete(item.id)
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
              danger
            />
          </Popconfirm>,
        ]}
      >
        <NotificationMeta>
          <NotificationIcon style={{ color: style.color }}>
            {style.icon}
          </NotificationIcon>
          <NotificationContent>
            <NotificationHeader>
              <Text strong={!item.isRead} style={{ fontSize: 14 }}>
                {getNotificationTitle(item.type)}
              </Text>
              {!item.isRead && <Badge status="processing" />}
            </NotificationHeader>
            <NotificationBody>{item.content}</NotificationBody>
            <NotificationTime>
              <ClockCircleOutlined />
              {timeAgo}
            </NotificationTime>
          </NotificationContent>
        </NotificationMeta>
      </NotificationItem>
    )
  }

  return (
    <DropdownContainer>
      {/* Header */}
      <HeaderContainer>
        <Text strong style={{ fontSize: 16 }}>
          Thông báo
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              style={{ marginLeft: 8, backgroundColor: '#1890ff' }}
            />
          )}
        </Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </HeaderContainer>

      {/* Content */}
      <ContentContainer>
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có thông báo"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            tabBarGutter={0}
            items={[
              {
                key: 'all',
                label: `Tất cả (${notifications.length})`,
                children: (
                  <ScrollableList>
                    <List
                      dataSource={notifications}
                      renderItem={renderNotificationItem}
                    />
                  </ScrollableList>
                ),
              },
              {
                key: 'unread',
                label: `Chưa đọc (${unreadCount})`,
                children: (
                  <ScrollableList>
                    <List
                      dataSource={unreadNotifications}
                      renderItem={renderNotificationItem}
                      locale={{ emptyText: 'Không có thông báo chưa đọc' }}
                    />
                  </ScrollableList>
                ),
              },
            ]}
            style={{
              margin: 0,
            }}
            tabBarStyle={{
              margin: 0,
              display: 'flex',
            }}
            tabBarExtraContent={{
              left: <div style={{ flex: 1 }} />,
              right: <div style={{ flex: 1 }} />,
            }}
          />
        )}
      </ContentContainer>

      {/* Footer */}
      {notifications.length > 0 && (
        <FooterContainer>
          <Button
            type="link"
            onClick={() => {
              console.log('View all notifications')
            }}
          >
            Xem tất cả thông báo
          </Button>
        </FooterContainer>
      )}
    </DropdownContainer>
  )
}

export default NotificationDropdown

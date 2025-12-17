// components/common/NotificationDropdown.tsx
import {
  BellOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Badge, Button, Empty, List, Tabs, Typography, Popconfirm } from "antd";
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import {
  NotificationResponse,
  NotificationType,
  Notification,
  NotificationRequest,
} from "../../types/notification";
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from "../../services/api/notificationApi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text } = Typography;

const NotificationDropdown = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { data: notificationData, isLoading } = useGetNotificationsQuery({});
  const [markAllRead] = useMarkAllReadMutation();
  const [markRead] = useMarkReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const unreadCount = notificationData?.statistic?.unreadCount || 0;
  const unreadNotifications = notifications.filter((n) => !n.read);

  // Lấy icon và màu sắc theo loại thông báo
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ADD_EXAM:
        return {
          icon: <FileTextOutlined />,
          color: "#1890ff",
        };
      case NotificationType.EXAM_RESULT:
        return {
          icon: <TrophyOutlined />,
          color: "#52c41a",
        };
      case NotificationType.DEADLINE_REMINDER:
        return {
          icon: <WarningOutlined />,
          color: "#faad14",
        };
      case NotificationType.SYSTEM:
        return {
          icon: <InfoCircleOutlined />,
          color: "#722ed1",
        };
      default:
        return {
          icon: <BellOutlined />,
          color: "#666",
        };
    }
  };

  // Format nội dung thông báo
  const getNotificationTitle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ADD_EXAM:
        return "Bài kiểm tra mới";
      case NotificationType.EXAM_RESULT:
        return "Kết quả bài kiểm tra";
      case NotificationType.DEADLINE_REMINDER:
        return "Nhắc nhở hạn nộp";
      case NotificationType.SYSTEM:
        return "Thông báo hệ thống";
      default:
        return "Thông báo";
    }
  };

  // Xử lý đánh dấu đã đọc
  const handleMarkAsRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await markRead({ id }).unwrap();
    } catch (error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  };

  // Xử lý đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllRead().unwrap();
    } catch (error) {
      // Reload nếu lỗi
      if (notificationData?.data?.data) {
        setNotifications(notificationData.data.data);
      }
    }
  };

  // Xử lý xóa thông báo
  const handleDelete = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification({ id }).unwrap();
    } catch (error) {
      // Reload nếu lỗi
      if (notificationData?.data?.data) {
        setNotifications(notificationData.data.data);
      }
    }
  };

  // Sync dữ liệu từ API
  useEffect(() => {
    if (notificationData?.data?.data) {
      setNotifications(notificationData.data.data);
    }
  }, [notificationData?.data?.data]);

  // Render một item thông báo
  const renderNotificationItem = (item: Notification) => {
    const style = getNotificationStyle(item.type);
    const timeAgo = dayjs(item.createdAt).fromNow();

    return (
      <NotificationItem
        key={item.id}
        isRead={item.read}
        onClick={() => !item.read && handleMarkAsRead(item.id)}
      >
        <NotificationMeta>
          <NotificationIcon style={{ color: style.color }}>
            {style.icon}
          </NotificationIcon>
          <NotificationContent>
            <NotificationHeader>
              <Text strong={!item.read} style={{ fontSize: 14, flex: 1 }}>
                {getNotificationTitle(item.type)}
              </Text>
              {!item.read && <Badge status="processing" />}
            </NotificationHeader>
            <NotificationBody>{item.content}</NotificationBody>
            <NotificationTime>
              <ClockCircleOutlined />
              {timeAgo}
            </NotificationTime>
          </NotificationContent>
        </NotificationMeta>

        <Popconfirm
          title="Xóa thông báo"
          description="Bạn có chắc muốn xóa?"
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDelete(item.id);
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
        </Popconfirm>
      </NotificationItem>
    );
  };

  return (
    <DropdownContainer>
      {/* Header */}
      <HeaderContainer>
        <Text strong style={{ fontSize: 16 }}>
          Thông báo
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              style={{ marginLeft: 8, backgroundColor: "#1890ff" }}
            />
          )}
        </Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            Đánh dấu tất cả
          </Button>
        )}
      </HeaderContainer>

      {/* Content */}
      <ContentContainer>
        {isLoading ? (
          <LoadingContainer>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ marginBottom: "12px" }}>
                <svg
                  className="spinner"
                  viewBox="0 0 50 50"
                  width="30"
                  height="30"
                  style={{ margin: "0 auto" }}
                >
                  <circle cx="25" cy="25" r="20" />
                </svg>
              </div>
              <Text type="secondary">Đang tải thông báo...</Text>
            </div>
          </LoadingContainer>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có thông báo"
            style={{ padding: "40px 0" }}
          />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            items={[
              {
                key: "all",
                label: `Tất cả (${notifications.length})`,
                children: (
                  <ScrollableList>
                    <List
                      dataSource={notifications}
                      renderItem={renderNotificationItem}
                      split={false}
                    />
                  </ScrollableList>
                ),
              },
              {
                key: "unread",
                label: `Chưa đọc (${unreadCount})`,
                children: (
                  <ScrollableList>
                    <List
                      dataSource={unreadNotifications}
                      renderItem={renderNotificationItem}
                      split={false}
                      locale={{ emptyText: "Không có thông báo chưa đọc" }}
                    />
                  </ScrollableList>
                ),
              },
            ]}
            style={{ margin: 0 }}
            tabBarStyle={{ margin: 0 }}
          />
        )}
      </ContentContainer>
    </DropdownContainer>
  );
};

export default NotificationDropdown;

// ============== Styled Components ==============

const DropdownContainer = styled.div`
  width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 6px 16px 0 rgba(0, 0, 0, 0.08);
`;

const HeaderContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  
  .spinner {
    animation: spin 1s linear infinite;
    fill: none;
    stroke: #1890ff;
    stroke-width: 2;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

interface NotificationItemProps {
  isRead: boolean;
}

const NotificationItem = styled(List.Item)<NotificationItemProps>`
  padding: 12px 16px !important;
  background-color: ${(props) => (props.isRead ? "transparent" : "#f0f5ff")};
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: ${(props) =>
      props.isRead ? "#fafafa" : "#e6f0ff"} !important;
  }
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: start;
  gap: 12px;
  flex: 1;
`;

const NotificationIcon = styled.div`
  font-size: 20px;
  margin-top: 2px;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 4px;
`;

const NotificationBody = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
`;

const NotificationTime = styled.div`
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
`;

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
`;
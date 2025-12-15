import { BellOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Space,
  theme,
  Typography,
} from "antd";
import { Profile } from "../../types/auth";
import { useState } from "react";
import NotificationDropDown from "./NotificationDropDown";
import NotificationDropdown from "./NotificationDropDown";
import { useStatisticQuery } from "../../services/api/notificationApi";

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  userMenuItems: any[];
  user?: {
    fullName?: string;
    email: string;
    role: string;
    avatar?: string;
  };
  profile?: Profile;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
  userMenuItems,
  profile,
}) => {
  const { Header: AntHeader } = Layout;
  const { Text } = Typography;
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { data: notificationData } = useStatisticQuery();

  const [notificationOpen, setNotificationOpen] = useState(false);

  const unreadCount = notificationData?.unreadCount ?? 0;

  return (
    <AntHeader
      style={{
        padding: "0 24px",
        background: colorBgContainer,
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 40 }}
      />

      <Space size="middle">
        <Dropdown
          dropdownRender={() => <NotificationDropdown />}
          placement="bottomRight"
          trigger={["click"]}
          open={notificationOpen}
          onOpenChange={setNotificationOpen}
        >
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{
                fontSize: "16px",
                width: 40,
                height: 40,
                background: "#f5f5f5",
              }}
            />
          </Badge>
        </Dropdown>
        {/* User dropdown */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow={{ pointAtCenter: true }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Avatar
              size="small"
              icon={<UserOutlined />}
              src={profile?.avatarUrl}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text style={{ fontSize: 14, lineHeight: 1.2 }}>
                {profile?.firstName + " " + profile?.lastName}
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 12, lineHeight: 1.2, marginTop: 10 }}
              >
                {profile?.roles?.[0] ?? "STUDENT"}
              </Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

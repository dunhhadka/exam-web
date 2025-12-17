import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { MenuItem } from "../../types/common";
import {
  BarChartOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Layout } from "antd";
import { Sidebar } from "../common/Sidebar";
import { Header } from "../common/Header";
import { Footer } from "../common/Footer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setProfile } from "../../store/slices/authSlice";
import { logout } from "../../store/slices/authSlice";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("home");
  const [openKeys, setOpenKeys] = useState<string[]>(["exams"]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { profile } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile && !profile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        dispatch(setProfile(parsedProfile));
      } catch (error) {
        console.error("Failed to parse saved profile:", error);
        localStorage.removeItem("userProfile");
      }
    }
  }, [dispatch, profile]);

  // Menu items cho TEACHER
  const teacherMenuItems: MenuItem[] = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "Trang chủ",
      path: "/home",
    },
    {
      key: "exams",
      icon: <FileTextOutlined />,
      label: "Quản lý đề thi",
      path: "/exams",
      children: [
        {
          key: "exams-list",
          icon: <BookOutlined />,
          label: "Danh sách đề thi",
          path: "/exams",
        },
        {
          key: "exams-create",
          icon: <FileTextOutlined />,
          label: "Tạo đề thi mới",
          path: "/exams/create",
        },
      ],
    },
    {
      key: "questions",
      icon: <BookOutlined />,
      label: "Ngân hàng câu hỏi",
      path: "/questions",
    },
    {
      key: "examsessions",
      icon: <FileTextOutlined />,
      label: "Giao bài kiểm tra",
      path: "/examsessions",
    },
    {
      key: "store",
      icon: <BarChartOutlined />,
      label: "Lưu trữ",
      path: "/store",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Thông tin cá nhân",
      path: "/settings",
    },
  ];

  // Menu items cho STUDENT
  const studentMenuItems: MenuItem[] = [
    {
      key: "overview",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
      path: "/overview",
    },
    {
      key: "student-exam-sessions",
      icon: <CalendarOutlined />,
      label: "Bài kiểm tra của tôi",
      path: "/student-exam-sessions",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Thông tin cá nhân",
      path: "/settings",
    },
  ];

  // Lấy menu items dựa trên role
  const menuItems = useMemo(() => {
    const userRole = profile?.roles[0];
    return userRole === "STUDENT" ? studentMenuItems : teacherMenuItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.roles]);

  const handleLogout = () => {
    console.log("Logout clicked");
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/settings"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  const handleMenuClick = (key: string) => {
    setSelectedKey(key);
    console.log("Navigating to key:", key);
    navigate(findPathByKey(key, menuItems));
  };

  const findPathByKey = (key: string, items: MenuItem[]): string => {
    for (const item of items) {
      if (item.key === key || item.path === key) {
        return item.path;
      }

      if (item.children && !!item.children.length) {
        const childPath = findPathByKey(key, item.children);
        if (childPath !== "/home") {
          return childPath;
        }
      }
    }

    return "/home";
  };

  const findKeyByPath = (path: string, menuItems: MenuItem[]): string => {
    console.log("Finding key for path:", path, menuItems);
    for (const item of menuItems) {
      if (item.path === path) {
        return item.key;
      }

      if (item.children && item.children.length > 0) {
        const childKey = findKeyByPath(path, item.children);
        if (childKey.length > 0) {
          return childKey;
        }
      }
    }

    return "";
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  useEffect(() => {
    const key = findKeyByPath(location.pathname, menuItems);
    console.log("Current path:", location.pathname, "Mapped key:", key);
    if (key) {
      setSelectedKey(key);
    }
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          userMenuItems={userMenuItems}
          profile={profile}
        />
        <div style={{ minHeight: "100vh" }}>
          <Outlet />
        </div>
        <Footer />
      </Layout>
    </Layout>
  );
};

export default MainLayout;

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { Navigate, Outlet } from "react-router-dom";
import {
  useGetProfileQuery,
  useLazyGetProfileQuery,
} from "../services/api/profile";
import { useEffect } from "react";
import { setProfile } from "../store/slices/authSlice";
import { Spin } from "antd";

interface Props {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  const [getProfile, { isLoading }] = useLazyGetProfileQuery();
  const { isAuthenticated, profile } = useSelector(
    (state: RootState) => state.auth
  );

  const dispath = useDispatch();

  const fetchProfile = async () => {
    if (!profile) {
      const userProfile = await getProfile().unwrap();
      dispath(setProfile(userProfile));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Đang tải thông tin..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!profile || !profile.roles || profile.roles.length === 0) {
    return <Navigate to="/login" replace />;
  }

  const userRole = profile.roles[0];

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return (
        <Navigate to={userRole === "STUDENT" ? "/overview" : "/home"} replace />
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

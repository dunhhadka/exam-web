import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { Navigate, Outlet } from "react-router-dom";
import { useGetProfileQuery } from "../services/api/profile";
import { useEffect } from "react";
import { setProfile } from "../store/slices/authSlice";
import { Spin } from "antd";

interface Props {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  const dispatch = useDispatch();

  const { isAuthenticated, profile } = useSelector(
    (state: RootState) => state.auth
  );

  const {
    data: fetchedProfile,
    isLoading,
    isError,
  } = useGetProfileQuery(undefined, {
    skip: !!profile,
  });

  useEffect(() => {
    if (!profile && fetchedProfile) {
      dispatch(setProfile(fetchedProfile));
    }
  }, [fetchedProfile, profile, dispatch]);

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

  if (isError) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" replace />;
  }

  const userRole = profile.roles?.[0];

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <Navigate to={userRole === "STUDENT" ? "/overview" : "/home"} replace />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

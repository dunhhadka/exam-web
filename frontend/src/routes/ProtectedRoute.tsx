import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { Navigate, Outlet } from "react-router-dom";
import { useGetProfileQuery } from "../services/api/profile";
import { useEffect, useState } from "react";
import { setProfile } from "../store/slices/authSlice";
import { Spin } from "antd";
import { Profile } from "../types/auth";

interface Props {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  const { profile } = useSelector((state: RootState) => state.auth);

  const storedProfile = localStorage.getItem("profile");
  const localProfile = storedProfile
    ? (JSON.parse(storedProfile) as Profile)
    : null;

  const shouldSkipQuery = !!profile || !!localProfile;

  const {
    data: fetchedProfile,
    isLoading,
    isError,
  } = useGetProfileQuery(undefined, {
    skip: shouldSkipQuery,
  });

  useEffect(() => {
    if (profile) {
      setIsInitialized(true);
      return;
    }

    if (localProfile) {
      dispatch(setProfile(localProfile));
      setIsInitialized(true);
      return;
    }

    if (fetchedProfile && !isLoading) {
      dispatch(setProfile(fetchedProfile));
      localStorage.setItem("profile", JSON.stringify(fetchedProfile));
      setIsInitialized(true);
      return;
    }

    if (isError && !isLoading) {
      localStorage.removeItem("profile");
      setIsInitialized(true);
      return;
    }
  }, [fetchedProfile, isLoading, isError, profile, localProfile, dispatch]);

  if (isLoading || !isInitialized) {
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

  if (isError && !localProfile) {
    return <Navigate to="/login" replace />;
  }

  const currentProfile = profile || localProfile;

  if (!currentProfile) {
    return <Navigate to="/login" replace />;
  }

  const userRole = currentProfile.roles?.[0];

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <Navigate to={userRole === "STUDENT" ? "/overview" : "/home"} replace />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

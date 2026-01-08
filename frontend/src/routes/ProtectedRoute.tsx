import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { Navigate, Outlet } from "react-router-dom";
import { useGetProfileQuery } from "../services/api/profile";
<<<<<<< HEAD
import { useEffect } from "react";
import { setProfile } from "../store/slices/authSlice";
import { Spin } from "antd";
=======
import { useEffect, useState } from "react";
import { setProfile } from "../store/slices/authSlice";
import { Spin } from "antd";
import { Profile } from "../types/auth";
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67

interface Props {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  const dispatch = useDispatch();
<<<<<<< HEAD

  const { isAuthenticated, profile } = useSelector(
    (state: RootState) => state.auth
  );

=======
  const [isInitialized, setIsInitialized] = useState(false);

  const { profile, accessToken, authEpoch } = useSelector(
    (state: RootState) => state.auth
  );

  const storedProfile = localStorage.getItem("userProfile");
  const localProfile = storedProfile
    ? (JSON.parse(storedProfile) as Profile)
    : null;

  const shouldSkipQuery = !accessToken || !!profile || !!localProfile;

>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
  const {
    data: fetchedProfile,
    isLoading,
    isError,
<<<<<<< HEAD
  } = useGetProfileQuery(undefined, {
    skip: !!profile,
  });

  useEffect(() => {
    if (!profile && fetchedProfile) {
      dispatch(setProfile(fetchedProfile));
    }
  }, [fetchedProfile, profile, dispatch]);

  if (isLoading) {
=======
  } = useGetProfileQuery(authEpoch, {
    skip: shouldSkipQuery,
  });

  useEffect(() => {
    if (!accessToken) {
      setIsInitialized(true);
      return;
    }

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
      localStorage.setItem("userProfile", JSON.stringify(fetchedProfile));
      setIsInitialized(true);
      return;
    }

    if (isError && !isLoading) {
      localStorage.removeItem("userProfile");
      setIsInitialized(true);
      return;
    }
  }, [accessToken, fetchedProfile, isLoading, isError, profile, localProfile, dispatch]);

  if (isLoading || !isInitialized) {
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
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

<<<<<<< HEAD
  if (isError) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" replace />;
  }

  const userRole = profile.roles?.[0];
=======
  if (isError && !localProfile) {
    return <Navigate to="/login" replace />;
  }

  const currentProfile = profile || localProfile;

  if (!currentProfile) {
    return <Navigate to="/login" replace />;
  }

  const userRole = currentProfile.roles?.[0];
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <Navigate to={userRole === "STUDENT" ? "/overview" : "/home"} replace />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

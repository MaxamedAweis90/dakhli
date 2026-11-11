import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { SplashScreen } from "@/components/shared/SplashScreen";

export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <SplashScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Intercept unverified sessions and redirect to /verify-email
  if (user && user.isVerified === false) {
    if (location.pathname !== "/verify-email") {
      return <Navigate to="/verify-email" state={{ from: location }} replace />;
    }
  }

  return <Outlet />;
};

export const PublicRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <SplashScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    // If authenticated but not verified, intercept and send to /verify-email
    if (user && user.isVerified === false) {
      return <Navigate to="/verify-email" replace />;
    }
    const destination =
      (location.state as { from?: Location })?.from?.pathname || "/";
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

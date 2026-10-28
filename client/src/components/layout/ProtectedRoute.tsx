import React, { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { SplashScreen } from '@/components/shared/SplashScreen'

export const ProtectedRoute: React.FC = () => {
  const location = useLocation()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return <SplashScreen message="Loading workspace..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export const PublicRoute: React.FC = () => {
  const location = useLocation()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return <SplashScreen message="Loading..." />
  }

  if (isAuthenticated) {
    const destination = (location.state as { from?: Location })?.from?.pathname || '/'
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}

export default ProtectedRoute

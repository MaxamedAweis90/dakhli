import React, { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { SplashScreen } from '@/components/shared/SplashScreen'
import { useAuthStore } from '@/stores/authStore'

// Lazy loaded page components
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const OverheadsPage = lazy(() => import('@/features/overheads/OverheadsPage'))
const DailyPage = lazy(() => import('@/features/daily/DailyPage'))
const SavePlansPage = lazy(() => import('@/features/save-plans/SavePlansPage'))
const ItemsPage = lazy(() => import('@/features/items/ItemsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const LandingPage = lazy(() => import('@/features/landing/LandingPage'))

/**
 * RootEntry smart dispatcher:
 * - If user is unauthenticated -> renders high-converting, privacy-first LandingPage
 * - If user is authenticated -> renders AppShell with DashboardPage
 */
const RootEntry: React.FC = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return <SplashScreen message="Loading..." />
  }

  if (isAuthenticated) {
    return (
      <AppShell>
        <DashboardPage />
      </AppShell>
    )
  }

  return <LandingPage />
}

export const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<SplashScreen message="Loading..." />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: <RootEntry />,
      },
      {
        path: '/landing',
        element: <LandingPage />,
      },
      {
        path: '/welcome',
        element: <LandingPage />,
      },
      {
        path: '/dashboard',
        element: <Navigate to="/" replace />,
      },
      {
        element: <PublicRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/overheads', element: <OverheadsPage /> },
              { path: '/daily', element: <DailyPage /> },
              { path: '/save-plans', element: <SavePlansPage /> },
              { path: '/items', element: <ItemsPage /> },
              { path: '/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export const AppRoutes: React.FC = () => {
  return null
}

export default router

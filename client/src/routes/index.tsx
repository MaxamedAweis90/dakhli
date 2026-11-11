import React, { lazy, Suspense } from 'react'
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
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'))
const LandingPage = lazy(() => import('@/features/landing/LandingPage'))
const MobileUploadPage = lazy(() => import('@/features/items/pages/MobileUploadPage'))

/**
 * RootEntry smart dispatcher:
 * - When loading initial auth state (on refresh/boot) -> show full SplashScreen
 * - If user is authenticated and verified -> render DashboardPage inside AppShell
 * - If user is authenticated but unverified -> redirect to /verify-email
 * - If user is unauthenticated -> render LandingPage
 */
const RootEntry: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return <SplashScreen message="Loading Dakhli..." />
  }

  if (isAuthenticated) {
    if (user && user.isVerified === false) {
      return <Navigate to="/verify-email" replace />
    }
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
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: <RootEntry />,
      },
      {
        path: '/verify-email',
        element: <VerifyEmailPage />,
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
        path: '/mobile-upload',
        element: <MobileUploadPage />,
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
              { path: '/overhead', element: <Navigate to="/overheads" replace /> },
              { path: '/daily', element: <DailyPage /> },
              { path: '/save-plans', element: <SavePlansPage /> },
              { path: '/items', element: <ItemsPage /> },
              { path: '/item-registry', element: <Navigate to="/items" replace /> },
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

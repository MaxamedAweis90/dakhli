import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

// Lazy loaded page components
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const OverheadsPage = lazy(() => import('@/features/overheads/OverheadsPage'))
const DailyPage = lazy(() => import('@/features/daily/DailyPage'))
const SavePlansPage = lazy(() => import('@/features/save-plans/SavePlansPage'))
const ItemsPage = lazy(() => import('@/features/items/ItemsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const AuthPage = lazy(() => import('@/features/auth/AuthPage'))

const ViewFallback: React.FC = () => (
  <div className="flex items-center justify-center p-12 text-slate-500 text-xs font-mono">
    Loading view...
  </div>
)

export const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<ViewFallback />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        element: <PublicRoute />,
        children: [
          { path: '/login', element: <AuthPage initialMode="signin" /> },
          { path: '/register', element: <AuthPage initialMode="signup" /> },
        ],
      },

      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <DashboardPage /> },
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


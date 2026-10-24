import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

// Lazy loaded page components
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const OverheadsPage = lazy(() => import('@/features/overheads/OverheadsPage'))
const DailyPage = lazy(() => import('@/features/daily/DailyPage'))
const SavePlansPage = lazy(() => import('@/features/save-plans/SavePlansPage'))
const ItemsPage = lazy(() => import('@/features/items/ItemsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'))

const ViewFallback: React.FC = () => (
  <div className="flex items-center justify-center p-12 text-slate-500 text-xs font-mono">
    Loading view...
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<ViewFallback />}>
      <Routes>
        {/* Public / Unauthenticated Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Application Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/overheads" element={<OverheadsPage />} />
            <Route path="/daily" element={<DailyPage />} />
            <Route path="/save-plans" element={<SavePlansPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Wildcard redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes

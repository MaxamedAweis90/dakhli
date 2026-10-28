import React, { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/**
 * Minimalist dark skeleton matching #0D0E12 without bright spinners or generic loaders
 */
const SkeletonScreen: React.FC = () => (
  <div className="h-screen w-screen bg-[#0D0E12] flex overflow-hidden select-none animate-pulse">
    {/* Sidebar Rail Skeleton */}
    <div className="hidden lg:flex w-[14rem] h-full border-r border-white/[0.04] p-5 flex-col justify-between">
      <div className="space-y-6">
        <div className="h-6 w-24 rounded bg-white/[0.05]" />
        <div className="h-9 w-full rounded-xl bg-white/[0.03]" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded-lg bg-white/[0.02]" />
          ))}
        </div>
      </div>
      <div className="h-10 w-full rounded-xl bg-white/[0.03]" />
    </div>

    {/* Main Viewport Skeleton */}
    <div className="flex-1 flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 rounded bg-white/[0.04]" />
        <div className="h-8 w-28 rounded-full bg-white/[0.03]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-[#13151B] border border-white/[0.03] p-5" />
        ))}
      </div>
    </div>
  </div>
)

export const ProtectedRoute: React.FC = () => {
  const location = useLocation()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return <SkeletonScreen />
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
    return <div className="h-screen w-screen bg-[#0D0E12]" />
  }

  if (isAuthenticated) {
    const destination = (location.state as { from?: Location })?.from?.pathname || '/'
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}

export default ProtectedRoute

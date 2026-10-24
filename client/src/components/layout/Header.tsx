import React from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, Sparkles } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/overheads': 'Overhead Bills',
  '/daily': 'Daily Check-Off',
  '/save-plans': 'Save Plans',
  '/items': 'Item Registry',
  '/settings': 'Settings & Baseline',
}

export const Header: React.FC = () => {
  const location = useLocation()
  const { user } = useAuthStore()

  const displayName = user?.email ? user.email.split('@')[0] : 'Member'
  const isDashboard = location.pathname === '/'
  const currentTitle = ROUTE_TITLES[location.pathname] || 'Overview'

  const today = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="h-16 px-8 border-b border-surface-subtle/70 bg-canvas/60 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-10">
      {/* Left Greeting / Breadcrumb Slot */}
      <div className="flex items-center space-x-3">
        {isDashboard ? (
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white capitalize">
              Hello, {displayName}!
            </h1>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              {currentTitle}
            </h1>
          </div>
        )}
      </div>

      {/* Right Persistent Utility Slots */}
      <div className="flex items-center space-x-3">
        {/* Contextual Action / Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-card border border-surface-subtle/80 text-xs text-slate-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span className="font-medium text-[11px] tracking-wide">Dakhli Engine</span>
        </div>

        {/* Date Indicator Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-surface-card border border-surface-subtle/80 text-xs text-slate-300 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-[11px] tracking-wide">{today}</span>
        </div>
      </div>
    </header>
  )
}

export default Header

import React from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Hello, Anna!',
  '/overheads': 'Overhead Bills',
  '/daily': 'Daily Check-Off',
  '/save-plans': 'Save Plans',
  '/items': 'Item Registry',
  '/settings': 'Settings & Baseline',
}

export const Header: React.FC = () => {
  const location = useLocation()
  const { user } = useAuthStore()

  const displayName = user?.email ? user.email.split('@')[0] : 'Anna'
  const isDashboard = location.pathname === '/'
  const currentTitle = ROUTE_TITLES[location.pathname] || 'Overview'

  return (
    <header className="h-16 px-8 flex items-center justify-between flex-shrink-0 bg-transparent">
      {/* Left Welcome Breadcrumb */}
      <div>
        {isDashboard ? (
          <h1 className="text-xl font-medium text-white capitalize">
            Hello, {displayName}!
          </h1>
        ) : (
          <h1 className="text-xl font-medium text-white">
            {currentTitle}
          </h1>
        )}
      </div>

      {/* Right Persistent Utility Pills */}
      <div className="flex items-center gap-3">
        {/* Action Pill: Clean pill with subtle border */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171922] text-xs font-medium text-slate-200 border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-sm"
        >
          <span className="text-amber-400 font-serif text-xs">✦</span>
          <span>Ask AI</span>
        </button>

        {/* Date Display Pill matching reference */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171922] text-slate-300 text-xs border border-white/5 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-xs tracking-wide">December 2025</span>
        </div>
      </div>
    </header>
  )
}

export default Header

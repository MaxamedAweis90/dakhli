import React from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'
import { useOverheadsStore } from '@/stores/overheadsStore'
import { MonthNavigator } from '@/components/shared/ui/MonthNavigator'

const ROUTE_TITLES: Record<string, string> = {
  '/overheads': 'Overhead Bills',
  '/daily': 'Daily Spending & Cap',
  '/save-plans': 'Save Plans',
  '/items': 'Registered Items',
  '/settings': 'Settings',
}

export const Header: React.FC = () => {
  const location = useLocation()
  const { user } = useAuthStore()
  const { currentMonth, prevMonth, nextMonth } = useOverheadsStore()

  const rawName = user?.email ? user.email.split('@')[0] : 'Anna'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const isOverheads = location.pathname === '/overheads'
  const title =
    location.pathname === '/' ? `Hello, ${displayName}!` : (ROUTE_TITLES[location.pathname] ?? 'Overview')

  return (
    <>
      {/* Floating Action Controls: Ask AI + Date, sticky at top-0, background opacity 0 */}
      <div className="sticky top-0 z-30 pointer-events-none flex items-center justify-end h-14 lg:h-[4.75rem] px-4 lg:px-0 bg-transparent -mb-14 lg:-mb-[4.75rem]">
        <div className="pointer-events-auto flex items-center gap-[0.75rem]">
          {/* Ask AI: glowing gradient outline pill (no sparkle glyph) */}
          <button
            type="button"
            className="border-gradient-highlight rounded-full h-[2.2rem] px-[1.1rem] text-[0.78rem] font-medium text-white cursor-pointer hover:brightness-110 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
          >
            Ask AI
          </button>

          {/* Date pill */}
          <div className="flex items-center gap-[0.5rem] h-[2.2rem] px-[1rem] rounded-full bg-[#212121] text-[0.78rem] font-medium text-white shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            <Calendar className="w-[0.9rem] h-[0.9rem] text-[#cfcfcf]" />
            <span>December 2025</span>
          </div>
        </div>
      </div>

      {/* Screen Title: in natural document flow, scrolls with screen to top */}
      <div className="flex items-center h-14 lg:h-[4.75rem] px-4 lg:px-0 pr-[14rem] lg:pr-[16rem]">
        {isOverheads ? (
          <MonthNavigator
            currentMonth={currentMonth}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        ) : (
          <h1 className="text-[1.35rem] lg:text-[1.5rem] font-semibold leading-none tracking-[-0.015em] text-white">
            {title}
          </h1>
        )}
      </div>
    </>
  )
}

export default Header

import React from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, Plus } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'
import {
  useOverheadsStore,
  getRealCurrentMonth,
  getMaxFutureMonth,
} from '@/stores/overheadsStore'
import { MonthNavigator } from '@/components/shared/ui/MonthNavigator'
import { cn } from '@/lib/utils'

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
  const {
    currentMonth,
    prevMonth,
    nextMonth,
    jumpToCurrentMonth,
    isAtCreationMonth,
    isAtFutureLimit,
  } = useOverheadsStore()

  const realCurrentMonth = getRealCurrentMonth()
  const userCreatedAtMonth = user?.createdAt ? user.createdAt.slice(0, 7) : realCurrentMonth
  const maxFutureMonth = getMaxFutureMonth(realCurrentMonth, 3)

  const isPrevDisabled = isAtCreationMonth(userCreatedAtMonth)
  const isNextDisabled = isAtFutureLimit(maxFutureMonth)

  const [yStr, mStr] = currentMonth.split('-')
  const dateObj = new Date(Number(yStr), Number(mStr) - 1, 1)
  const cycleLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isDifferentFromNow = currentMonth !== realCurrentMonth

  const rawName = user?.name || (user?.email ? user.email.split('@')[0] : 'Anna')
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const isOverheads = location.pathname === '/overheads'
  const isSettings = location.pathname === '/settings'
  const title =
    location.pathname === '/' ? `Hello, ${displayName}!` : (ROUTE_TITLES[location.pathname] ?? 'Overview')

  return (
    <>
      {/* Floating Action Controls: Ask AI + Date (+ Save Baseline on settings), sticky at top-0 */}
      <div className="sticky top-0 z-30 pointer-events-none flex items-center justify-end h-14 lg:h-[4.75rem] px-4 lg:px-0 bg-transparent -mb-14 lg:-mb-[4.75rem]">
        <div className="pointer-events-auto flex items-center gap-[0.75rem]">
          {/* Top-Right Fast-Switch Date pill button */}
          <button
            type="button"
            onClick={jumpToCurrentMonth}
            title={isDifferentFromNow ? 'Click to jump to current month' : 'Active Cycle'}
            className={cn(
              'flex items-center gap-[0.5rem] h-[2.2rem] px-[1rem] rounded-full text-[0.78rem] font-medium shadow-[0_2px_12px_rgba(0,0,0,0.5)] transition-all',
              isDifferentFromNow
                ? 'bg-[#252833] hover:bg-[#2e3240] text-amber-300 border border-amber-500/30 cursor-pointer active:scale-95'
                : 'bg-[#212121] text-white cursor-default'
            )}
          >
            <Calendar className="w-[0.9rem] h-[0.9rem] text-[#cfcfcf]" />
            <span>{cycleLabel}</span>
          </button>

          {/* + Save Baseline Button on Settings route */}
          {isSettings && (
            <button
              type="submit"
              form="settings-baseline-form"
              className="flex items-center gap-[0.35rem] h-[2.2rem] px-[1.15rem] rounded-full bg-[#E5A855] hover:bg-[#d89740] active:scale-[0.98] text-[#121316] font-semibold text-[0.825rem] transition-all shadow-[0_2px_12px_rgba(229,168,85,0.25)] cursor-pointer"
            >
              <Plus className="w-[0.875rem] h-[0.875rem] stroke-[2.5]" />
              <span>Save Baseline</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Title: in natural document flow, scrolls with screen to top */}
      <div className="flex items-center h-14 lg:h-[4.75rem] px-4 lg:px-0 pr-[14rem] lg:pr-[22rem]">
        {isOverheads ? (
          <MonthNavigator
            currentMonth={currentMonth}
            onPrev={() => prevMonth(userCreatedAtMonth)}
            onNext={() => nextMonth(maxFutureMonth)}
            isPrevDisabled={isPrevDisabled}
            isNextDisabled={isNextDisabled}
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

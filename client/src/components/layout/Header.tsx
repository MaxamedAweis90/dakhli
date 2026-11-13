import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, Plus } from '@/components/shared/icons'
import { Calculator, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usePrivacyStore } from '@/stores/privacyStore'
import {
  useOverheadsStore,
  getRealCurrentMonth,
  getMaxFutureMonth,
} from '@/stores/overheadsStore'
import { MonthNavigator } from '@/components/shared/ui/MonthNavigator'
import { CalculatorModal } from '@/components/calculator/CalculatorModal'
import { cn } from '@/lib/utils'

const ROUTE_TITLES: Record<string, string> = {
  '/overheads': 'Overhead Bills',
  '/daily': 'Daily Spending & Cap',
  '/save-plans': 'Save Plans',
  '/items': 'Registered Items',
  '/settings': 'Settings',
  '/profile': 'Profile Settings',
}

export const Header: React.FC = () => {
  const location = useLocation()
  const { user } = useAuthStore()
  const { isMasked, togglePrivacy } = usePrivacyStore()
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
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
  const isMonthAware = ['/overheads', '/overhead', '/daily', '/save-plans'].includes(location.pathname)
  const isSettings = location.pathname === '/settings'
  const isCurrentDormant = Boolean(user?.dormantCycles?.includes(currentMonth))
  const title =
    location.pathname === '/' ? `Hello, ${displayName}!` : (ROUTE_TITLES[location.pathname] ?? 'Overview')

  return (
    <>
      {/* Floating Action Controls: Ask AI + Date (+ Save Baseline on settings), sticky at top-0 */}
      <div className="sticky top-0 z-30 pointer-events-none flex items-center justify-end h-14 lg:h-[4.75rem] px-4 lg:px-0 bg-transparent -mb-14 lg:-mb-[4.75rem]">
        <div className="pointer-events-auto flex items-center gap-[0.75rem]">
          {/* Top-Right Calculator Icon Button (to left of calendar) */}
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            title="Open Calculator"
            aria-label="Open Calculator"
            className="flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full bg-[#212121] hover:bg-[#2c2f38] text-[#cfcfcf] hover:text-white transition-all shadow-[0_2px_12px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95 border border-white/[0.04]"
          >
            <Calculator className="w-[0.95rem] h-[0.95rem]" />
          </button>

          {/* Top-Right Privacy Shroud Toggle Button (directly to left of calendar) */}
          <button
            type="button"
            onClick={togglePrivacy}
            title={isMasked ? 'Show balances (H)' : 'Hide balances (H)'}
            aria-label={isMasked ? 'Show balances' : 'Hide balances'}
            className={cn(
              'flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full transition-all shadow-[0_2px_12px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95 border',
              isMasked
                ? 'bg-[#252833] hover:bg-[#2c3040] text-amber-400 border-amber-500/30'
                : 'bg-[#212121] hover:bg-[#2c2f38] text-slate-400 hover:text-white border-white/[0.04]'
            )}
          >
            {isMasked ? (
              <EyeOff className="w-[0.95rem] h-[0.95rem]" />
            ) : (
              <Eye className="w-[0.95rem] h-[0.95rem]" />
            )}
          </button>

          {/* Top-Right Fast-Switch Date pill button */}
          <button
            type="button"
            onClick={jumpToCurrentMonth}
            title={isDifferentFromNow ? 'Click to jump to current month' : (isCurrentDormant ? 'Dormant Cycle' : 'Active Cycle')}
            className={cn(
              'flex items-center gap-[0.5rem] h-[2.2rem] px-[1rem] rounded-full text-[0.78rem] font-medium shadow-[0_2px_12px_rgba(0,0,0,0.5)] transition-all',
              isCurrentDormant
                ? 'bg-[#1E2028] text-slate-400 border border-white/5 cursor-pointer active:scale-95'
                : isDifferentFromNow
                ? 'bg-[#252833] hover:bg-[#2e3240] text-amber-300 border border-amber-500/30 cursor-pointer active:scale-95'
                : 'bg-[#212121] text-white cursor-default'
            )}
          >
            <Calendar className="w-[0.9rem] h-[0.9rem] text-[#cfcfcf]" />
            <span>{cycleLabel}</span>
            {isCurrentDormant && (
              <span className="text-slate-400 font-mono text-[9px] bg-white/5 px-1 py-0.2 rounded border border-white/5 uppercase">
                DORMANT
              </span>
            )}
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
        {isMonthAware ? (
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

      {/* Floating Mobile/Desktop Calculator Modal */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </>
  )
}

export default Header

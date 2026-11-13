import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export interface MonthNavigatorProps {
  currentMonth: string // "YYYY-MM"
  onPrev: () => void
  onNext: () => void
  isPrevDisabled?: boolean
  isNextDisabled?: boolean
  isDormant?: boolean
  hideControls?: boolean
  className?: string
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  currentMonth,
  onPrev,
  onNext,
  isPrevDisabled = false,
  isNextDisabled = false,
  isDormant,
  hideControls = false,
  className,
}) => {
  const { user } = useAuthStore()
  const effectiveIsDormant = isDormant !== undefined ? isDormant : Boolean(user?.dormantCycles?.includes(currentMonth))

  const [yearStr, monthStr] = currentMonth.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-[1.15rem] sm:text-[1.35rem] lg:text-[1.5rem] font-semibold leading-none tracking-[-0.015em] text-white whitespace-nowrap">
          {monthName}
        </h1>
        {effectiveIsDormant && (
          <span className="text-slate-400 bg-white/5 border border-white/5 font-mono text-[10px] px-2 py-0.5 rounded tracking-wider uppercase select-none shrink-0">
            DORMANT
          </span>
        )}
      </div>

      <div
        data-testid="month-navigator-controls"
        aria-hidden={hideControls}
        className={cn(
          'flex items-center gap-1.5 transition-all duration-300 ease-out origin-left shrink-0',
          hideControls
            ? 'max-w-0 opacity-0 scale-90 -ml-2 pointer-events-none overflow-hidden'
            : 'max-w-[5rem] opacity-100 scale-100'
        )}
      >
        {/* Previous Month Chevron (clamped to user account registration month) */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isPrevDisabled}
          aria-label="Previous month"
          title={isPrevDisabled ? 'Registration month boundary' : 'Previous month'}
          className={cn(
            'w-7 h-7 rounded-full bg-[#1E2028] text-[#A0A4B2] flex items-center justify-center transition-all border border-white/[0.04]',
            isPrevDisabled
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[#2A2E3B] active:scale-95 hover:text-white cursor-pointer'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Next Month Chevron (clamped to max +3 months ahead of current live month) */}
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          aria-label="Next month"
          title={isNextDisabled ? 'Maximum 3-month projection limit' : 'Next month'}
          className={cn(
            'w-7 h-7 rounded-full bg-[#1E2028] text-[#A0A4B2] flex items-center justify-center transition-all border border-white/[0.04]',
            isNextDisabled
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[#2A2E3B] active:scale-95 hover:text-white cursor-pointer'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MonthNavigator

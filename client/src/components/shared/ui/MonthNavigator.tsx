import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MonthNavigatorProps {
  currentMonth: string // "YYYY-MM"
  onPrev: () => void
  onNext: () => void
  isPrevDisabled?: boolean
  isNextDisabled?: boolean
  className?: string
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  currentMonth,
  onPrev,
  onNext,
  isPrevDisabled = false,
  isNextDisabled = false,
  className,
}) => {
  const [yearStr, monthStr] = currentMonth.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <h1 className="text-[1.35rem] lg:text-[1.5rem] font-semibold leading-none tracking-[-0.015em] text-white">
        {monthName}
      </h1>

      <div className="flex items-center gap-1.5">
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

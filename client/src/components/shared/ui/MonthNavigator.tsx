import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MonthNavigatorProps {
  currentMonth: string // "YYYY-MM"
  onPrev: () => void
  onNext: () => void
  className?: string
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  currentMonth,
  onPrev,
  onNext,
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
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className="w-7 h-7 rounded-full bg-[#1E2028] hover:bg-[#2A2E3B] active:scale-95 text-[#A0A4B2] hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.04]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          className="w-7 h-7 rounded-full bg-[#1E2028] hover:bg-[#2A2E3B] active:scale-95 text-[#A0A4B2] hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.04]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MonthNavigator

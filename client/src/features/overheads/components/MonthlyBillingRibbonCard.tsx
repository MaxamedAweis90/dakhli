import React from 'react'
import { MonthlyBillingRibbon } from './MonthlyBillingRibbon'
import { cn } from '@/lib/utils'

export interface MonthlyBillingRibbonCardProps {
  percentage: number
  onAddBill?: () => void
  isPastCycle?: boolean
  className?: string
}

/**
 * Section 2: Dedicated Monthly Billing Ribbon Card
 * Self-contained middle card housing the Monthly Billing Ribbon and the glowing amber Add Bill button
 * with optimal horizontal balance and alignment.
 */
export const MonthlyBillingRibbonCard: React.FC<MonthlyBillingRibbonCardProps> = ({
  percentage,
  onAddBill,
  isPastCycle = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-6 py-5 lg:px-8 lg:py-5.5 select-none flex items-center justify-between gap-6 lg:gap-8',
        className
      )}
    >
      {/* Left: Monthly Billing Ribbon spanning full available width */}
      <div className="flex-1 min-w-0">
        <MonthlyBillingRibbon percentage={percentage} />
      </div>

      {/* Right: Add Bill Button vertically centered with ribbon */}
      <div className="shrink-0 flex items-center">
        <button
          type="button"
          onClick={isPastCycle ? undefined : onAddBill}
          disabled={isPastCycle}
          title={
            isPastCycle
              ? 'Archived cycle: Cannot add bills to past months'
              : undefined
          }
          className={cn(
            'h-[2.45rem] px-5 sm:px-6 rounded-xl font-semibold text-[0.875rem] transition-all flex items-center justify-center tracking-tight',
            isPastCycle
              ? 'bg-white/5 text-[#70727a] border border-white/[0.04] opacity-40 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#F7B668] to-[#EEA850] text-[#16171B] shadow-[0_0_20px_rgba(247,182,104,0.35)] hover:brightness-105 active:scale-95 cursor-pointer'
          )}
        >
          Add Bill
        </button>
      </div>
    </div>
  )
}

export default MonthlyBillingRibbonCard

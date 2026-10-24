import React from 'react'
import { cn } from '@/lib/utils'

export interface MonthlyBillingRibbonProps {
  percentage: number // 0-100
  className?: string
}

export const MonthlyBillingRibbon: React.FC<MonthlyBillingRibbonProps> = ({
  percentage,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn('flex flex-col w-full', className)}>
      <span className="text-[0.82rem] font-medium text-white/90 mb-2">
        Monthly Billing Ribbon
      </span>

      <div className="relative w-full">
        {/* Full track with segmented dark vertical ticks */}
        <div
          className="relative w-full h-[0.45rem] rounded-full overflow-hidden bg-[#181A22]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #2D3242 0px, #2D3242 2px, transparent 2px, transparent 6px)',
          }}
        >
          {/* Filled progress bar with pastel gradient */}
          <div
            className="h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(110,231,183,0.35)]"
            style={{
              width: `${clamped}%`,
              background: 'linear-gradient(90deg, #818CF8 0%, #6EE7B7 60%, #FDE68A 100%)',
            }}
          />
        </div>

        {/* Percentage label anchored directly under the end of the bar */}
        <div className="relative w-full h-4 mt-1.5">
          <span
            className="absolute -translate-x-1/2 text-[0.75rem] font-medium text-[#8E92A0] select-none"
            style={{
              left: `${Math.min(97, Math.max(3, clamped))}%`,
            }}
          >
            {clamped}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default MonthlyBillingRibbon

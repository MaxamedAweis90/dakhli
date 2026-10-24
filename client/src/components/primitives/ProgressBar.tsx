import React from 'react'
import { cn } from '@/lib/utils'

export type ProgressVariant = 'amber' | 'emerald' | 'gradient'

export interface ProgressBarProps {
  value: number
  max: number
  variant?: ProgressVariant
  showPercentage?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  variant = 'amber',
  showPercentage = false,
  className,
}) => {
  const safeMax = max <= 0 ? 1 : max
  const percentage = Math.min(Math.max((value / safeMax) * 100, 0), 100)

  const variantFills: Record<ProgressVariant, string> = {
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    gradient: 'bg-gradient-to-r from-amber-500 to-emerald-400',
  }

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {showPercentage && (
        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Progress</span>
          <span className="font-semibold text-slate-200">{Math.round(percentage)}%</span>
        </div>
      )}

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantFills[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar

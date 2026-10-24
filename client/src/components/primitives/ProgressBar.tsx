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
    amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
    emerald: 'bg-emerald-500',
    gradient: 'bg-gradient-to-r from-brand to-emerald-400',
  }

  // If percentage reaches 100%, optionally highlight in emerald
  const isComplete = percentage >= 100
  const fillStyle = isComplete && variant === 'amber' ? 'bg-emerald-500' : variantFills[variant]

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {showPercentage && (
        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Progress</span>
          <span className="font-semibold text-slate-200">{Math.round(percentage)}%</span>
        </div>
      )}

      <div className="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden border border-surface-subtle/50">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', fillStyle)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar

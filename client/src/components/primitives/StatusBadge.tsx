import React from 'react'
import { cn } from '@/lib/utils'

export type StatusVariant =
  | 'paid'
  | 'under_budget'
  | 'unpaid'
  | 'over_budget'
  | 'on_budget'
  | 'pending'
  | 'neutral'

export interface StatusBadgeProps {
  variant: StatusVariant
  label: string
  dot?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  dot = true,
  className,
}) => {
  const variantStyles: Record<StatusVariant, { container: string; dot: string }> = {
    paid: {
      container: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    under_budget: {
      container: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    unpaid: {
      container: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-400',
    },
    over_budget: {
      container: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-400',
    },
    on_budget: {
      container: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    pending: {
      container: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    neutral: {
      container: 'bg-slate-800 text-slate-300 border-slate-700',
      dot: 'bg-slate-400',
    },
  }

  const current = variantStyles[variant] || variantStyles.neutral

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border select-none',
        current.container,
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full animate-pulse', current.dot)}
        />
      )}
      <span className="capitalize">{label}</span>
    </span>
  )
}

export default StatusBadge

import React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'under_budget'
  | 'over_budget'
  | 'on_budget'
  | 'planned'
  | 'in_plan'
  | 'bought'
  | 'paid'
  | 'unpaid'

export interface StatusBadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

const VARIANT_CONFIG: Record<
  BadgeVariant,
  { defaultLabel: string; className: string }
> = {
  under_budget: {
    defaultLabel: 'under_budget',
    className: 'bg-[#14291D] text-[#4ADE80] border border-[#4ADE80]/30 shadow-[0_0_8px_rgba(74,222,128,0.15)]',
  },
  over_budget: {
    defaultLabel: 'over_budget',
    className: 'bg-[#2E1818] text-[#F87171] border border-[#F87171]/30 shadow-[0_0_8px_rgba(248,113,113,0.15)]',
  },
  on_budget: {
    defaultLabel: 'on_budget',
    className: 'bg-[#1B241F] text-[#86EFAC] border border-[#86EFAC]/20',
  },
  planned: {
    defaultLabel: 'Planned',
    className: 'bg-[#1E1C2F] text-[#A78BFA] border border-[#A78BFA]/30',
  },
  in_plan: {
    defaultLabel: 'In Save Plan',
    className: 'bg-[#2E2412] text-[#FBBF24] border border-[#FBBF24]/40 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
  },
  bought: {
    defaultLabel: 'bought',
    className: 'bg-[#142A1D] text-[#4ADE80] border border-[#4ADE80]/30',
  },
  paid: {
    defaultLabel: 'Paid',
    className: 'bg-[#142A1D] text-[#4ADE80] border border-[#4ADE80]/30',
  },
  unpaid: {
    defaultLabel: 'Unpaid',
    className: 'bg-[#2D1A16] text-[#FB923C] border border-[#FB923C]/30',
  },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  className,
}) => {
  const config = VARIANT_CONFIG[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[0.72rem] font-medium tracking-tight select-none',
        config.className,
        className
      )}
    >
      {label ?? config.defaultLabel}
    </span>
  )
}

export default StatusBadge

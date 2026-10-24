import React from 'react'
import { TrendingUp, TrendingDown } from '@/components/shared/icons'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  title: string
  amount: number | string
  subtitle?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  badge?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  subtitle,
  trend,
  badge,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-card bg-surface-card border border-surface-subtle shadow-sm flex flex-col justify-between transition-colors hover:border-surface-subtle/80',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between space-x-2 mb-3">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        <div className="flex items-center space-x-2">
          {badge}
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>
      </div>

      {/* Primary Metric */}
      <div>
        <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
          {amount}
        </div>

        {/* Subtitle / Trend */}
        <div className="flex items-center space-x-2 mt-1">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-mono font-medium',
                trend.isPositive ? 'text-status-success' : 'text-status-danger'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              )}
              {trend.value}
            </span>
          )}

          {subtitle && (
            <span className="text-xs text-slate-500 truncate">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MetricCard

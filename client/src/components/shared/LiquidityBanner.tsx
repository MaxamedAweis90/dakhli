import React from 'react'
import { Wallet, ShieldCheck, Sparkles } from '@/components/shared/icons'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { cn } from '@/lib/utils'

export interface LiquidityBannerProps {
  grossBalance?: number
  totalSaved?: number
  netSpendable?: number
  currency?: string
  className?: string
}

export const LiquidityBanner: React.FC<LiquidityBannerProps> = ({
  grossBalance: propGross,
  totalSaved: propSaved,
  netSpendable: propNet,
  currency: propCurrency,
  className,
}) => {
  const store = useLiquidityStore()

  const gross = propGross ?? store.grossBalance
  const saved = propSaved ?? store.totalSaved
  const net = propNet ?? (propGross !== undefined && propSaved !== undefined ? propGross - propSaved : store.netSpendable)
  const currencySymbol = propCurrency ?? store.currency === 'USD' ? '$' : store.currency

  const formatAmount = (val: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  const isDeficit = net < 0

  return (
    <div
      className={cn(
        'w-full rounded-card bg-surface-card border border-surface-subtle p-6 shadow-md transition-all',
        className
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-surface-elevated text-brand border border-surface-subtle">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Liquidity Summary
          </span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-subtle text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
          <span className="font-mono text-[10px]">Synced</span>
        </div>
      </div>

      {/* Main Metric: Gross Balance */}
      <div className="mb-6">
        <div className="flex items-baseline space-x-1">
          <span className="text-xl font-mono text-slate-400">{currencySymbol}</span>
          <span className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-white tabular-nums">
            {formatAmount(gross)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 font-medium">Gross Balance</p>
      </div>

      {/* Triplet Sub-Metrics: Total Saved & Net Spendable */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-subtle/70">
        {/* Total Saved */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-slate-400 text-xs mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Saved</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-200 tabular-nums">
            {currencySymbol}
            {formatAmount(saved)}
          </div>
          <p className="text-[11px] text-slate-500">Locked in Save Plans</p>
        </div>

        {/* Net Spendable */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-slate-400 text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Net Spendable</span>
          </div>
          <div
            className={cn(
              'text-lg font-bold font-mono tabular-nums transition-colors',
              isDeficit
                ? 'text-status-danger'
                : 'text-brand'
            )}
          >
            {currencySymbol}
            {formatAmount(net)}
          </div>
          <p className="text-[11px] text-slate-500">
            {isDeficit ? 'Reserve deficit warning' : 'Available unreserved cash'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LiquidityBanner

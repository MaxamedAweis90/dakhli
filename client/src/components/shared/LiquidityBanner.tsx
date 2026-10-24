import React from 'react'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { MoreHorizontal } from '@/components/shared/icons'
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
  const net =
    propNet ??
    (propGross !== undefined && propSaved !== undefined
      ? propGross - propSaved
      : store.netSpendable)
  const currencySymbol = propCurrency ?? (store.currency === 'USD' ? '$' : store.currency)

  const formatAmount = (val: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  return (
    <div
      className={cn(
        'rounded-[26px] bg-[#17181D] border border-white/[0.02] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-6 flex flex-col justify-between',
        className
      )}
    >
      {/* Title Tracker Label */}
      <div className="mb-4">
        <span className="text-[14px] font-medium text-slate-400">Liquidity Summary</span>
      </div>

      {/* Main Metric: Gross Balance */}
      <div className="mb-6">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-normal text-slate-400 select-none">
            {currencySymbol}
          </span>
          <span className="text-[34px] sm:text-[36px] font-semibold tracking-tight text-white tabular-nums leading-none">
            {formatAmount(gross)}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-normal mt-1.5">Gross Balance</p>
      </div>

      {/* Dual Sub-Metrics: Total Saved & Net Spendable */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-lg font-semibold tracking-tight text-white tabular-nums">
            {currencySymbol}{formatAmount(saved)}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-normal">Total Saved</p>
        </div>

        <div>
          <div className="text-lg font-semibold tracking-tight text-white tabular-nums">
            {currencySymbol}{formatAmount(net)}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-normal">Net Spendable</p>
        </div>
      </div>

      {/* Inset Sub-Card: Active Visual card highlight with glowing emerald/cyan gradient border */}
      <div className="border-gradient-highlight px-4 py-3.5 flex items-center justify-between">
        <div>
          <span className="text-[13px] font-semibold text-emerald-400 tracking-wide">Active</span>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">Visual card highlight</p>
        </div>
        <button
          type="button"
          aria-label="Options"
          className="w-8 h-8 rounded-xl bg-[#1C202C] hover:bg-[#252B3C] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}

export default LiquidityBanner

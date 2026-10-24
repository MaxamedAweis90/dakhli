import React from 'react'
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
  const net =
    propNet ??
    (propGross !== undefined && propSaved !== undefined
      ? propGross - propSaved
      : store.netSpendable)
  const currencySymbol = propCurrency ?? (store.currency === 'USD' ? '$' : store.currency)

  const formatAmount = (val: number): string =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.1rem] pb-[1.25rem] flex flex-col justify-between gap-[1rem] select-none h-auto min-h-fit',
        className
      )}
    >
      {/* Title + gross balance */}
      <div>
        <h3 className="text-[0.78rem] leading-4 font-normal text-white">Liquidity Summary</h3>
        <div className="mt-[0.7rem] flex items-start gap-[0.3rem]">
          <span className="mt-[0.4rem] text-[0.875rem] leading-none text-[#8d8d8d] select-none">
            {currencySymbol}
          </span>
          <span className="text-[2rem] leading-none font-medium tracking-[-0.035em] text-white">
            {formatAmount(gross)}
          </span>
        </div>
        <p className="mt-[0.5rem] text-[0.72rem] leading-4 text-[#979797]">Gross Balance</p>
      </div>

      {/* Saved / spendable */}
      <div className="flex items-start gap-[1.6rem]">
        <div>
          <div className="text-[0.97rem] leading-5 font-medium tracking-[-0.02em] text-white">
            {currencySymbol}
            {formatAmount(saved)}
          </div>
          <p className="mt-[0.1rem] text-[0.72rem] leading-4 text-[#979797]">Total Saved</p>
        </div>
        <div>
          <div className="text-[0.97rem] leading-5 font-medium tracking-[-0.02em] text-white">
            {currencySymbol}
            {formatAmount(net)}
          </div>
          <p className="mt-[0.1rem] text-[0.72rem] leading-4 text-[#979797]">Net Spendable</p>
        </div>
      </div>

      {/* Active highlight */}
      <div className="border-gradient-highlight rounded-[0.9rem] h-[3.5625rem] pl-[0.8rem] pr-[0.6rem] flex items-center justify-between">
        <div>
          <span className="block text-[0.78rem] leading-4 font-normal text-[#aee69a]">Active</span>
          <p className="mt-[0.15rem] text-[0.66rem] leading-4 text-[#9a9a9a]">Visual card highlight</p>
        </div>
        <button
          type="button"
          aria-label="Options"
          className="w-[1.5rem] h-[1.5rem] rounded-[0.5rem] bg-[#2a2a2a] hover:bg-[#333] flex items-center justify-center gap-[0.1rem] cursor-pointer transition-colors"
        >
          <span className="w-[0.14rem] h-[0.14rem] rounded-full bg-white" />
          <span className="w-[0.14rem] h-[0.14rem] rounded-full bg-white" />
          <span className="w-[0.14rem] h-[0.14rem] rounded-full bg-white" />
        </button>
      </div>
    </div>
  )
}

export default LiquidityBanner

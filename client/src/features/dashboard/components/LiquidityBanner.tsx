import React from 'react'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { cn } from '@/lib/utils'

export interface LiquidityBannerProps {
  grossBalance?: number
  totalSaved?: number
  netSpendable?: number
  currency?: string
  className?: string
}

const CURRENCY_ORDER: Array<'USD' | 'SOS' | 'EUR'> = ['USD', 'SOS', 'EUR']

const CURRENCY_INFO = {
  USD: { code: 'USD', symbol: '$', rate: 1 },
  SOS: { code: 'SOS', symbol: 'Sh.So.', rate: 26000 },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92 },
} as const

export const LiquidityBanner: React.FC<LiquidityBannerProps> = ({
  grossBalance: propGross,
  totalSaved: propSaved,
  netSpendable: propNet,
  className,
}) => {
  useBaseline()
  const store = useLiquidityStore()

  const currentCode = (store.currency in CURRENCY_INFO
    ? store.currency
    : 'USD') as 'USD' | 'SOS' | 'EUR'
  const currentConfig = CURRENCY_INFO[currentCode]

  const handleToggleCurrency = () => {
    const currentIndex = CURRENCY_ORDER.indexOf(currentCode)
    const nextIndex = (currentIndex + 1) % CURRENCY_ORDER.length
    const nextCode = CURRENCY_ORDER[nextIndex]
    store.setCurrency(nextCode)
  }

  const baseGross = propGross ?? store.grossBalance
  const baseSaved = propSaved ?? store.totalSaved
  const baseNet =
    propNet ??
    (propGross !== undefined && propSaved !== undefined
      ? propGross - propSaved
      : store.netSpendable)

  // Compute animated converted amounts
  const convertedGross = baseGross * currentConfig.rate
  const convertedSaved = baseSaved * currentConfig.rate
  const convertedNet = baseNet * currentConfig.rate

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.1rem] pb-[1.25rem] flex flex-col justify-between gap-[1rem] select-none h-auto min-h-fit',
        className
      )}
    >
      {/* Title + Currency Switch Button */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-[0.78rem] leading-4 font-normal text-white">Liquidity Summary</h3>
          <button
            type="button"
            onClick={handleToggleCurrency}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22242D] hover:bg-[#2B2E3A] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-white transition-all active:scale-95 cursor-pointer shadow-sm group"
            title="Click to switch currency (USD, SOS, EUR)"
          >
            <span className="text-[#E5A855] font-bold tracking-tight">{currentConfig.code}</span>
            <span className="text-slate-400 font-medium text-[11px] group-hover:text-slate-200">
              {currentConfig.symbol}
            </span>
          </button>
        </div>

        {/* Gross balance with smooth animated counting */}
        <div className="mt-[0.7rem] flex items-start gap-[0.3rem]">
          <span className="mt-[0.4rem] text-[0.875rem] leading-none text-[#8d8d8d] select-none">
            {currentConfig.symbol}
          </span>
          <span className="text-[2rem] leading-none font-medium tracking-[-0.035em] text-white">
            <AnimatedNumber value={convertedGross} />
          </span>
        </div>
        <p className="mt-[0.5rem] text-[0.72rem] leading-4 text-[#979797]">Gross Balance</p>
      </div>

      {/* Saved / spendable with smooth animated counting */}
      <div className="flex items-start gap-[1.6rem]">
        <div>
          <div className="text-[0.97rem] leading-5 font-medium tracking-[-0.02em] text-white flex items-center gap-1">
            <span>{currentConfig.symbol}</span>
            <AnimatedNumber value={convertedSaved} />
          </div>
          <p className="mt-[0.1rem] text-[0.72rem] leading-4 text-[#979797]">Total Saved</p>
        </div>
        <div>
          <div className="text-[0.97rem] leading-5 font-medium tracking-[-0.02em] text-white flex items-center gap-1">
            <span>{currentConfig.symbol}</span>
            <AnimatedNumber value={convertedNet} />
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

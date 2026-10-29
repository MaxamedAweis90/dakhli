import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Wifi, Dumbbell, ChevronRight } from '@/components/shared/icons'
import { Zap, Shield } from 'lucide-react'
import { useOverheads } from '@/features/overheads/hooks/useOverheads'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { cn } from '@/lib/utils'

export interface QuickBillItem {
  id?: string
  name: string
  icon: 'home' | 'wifi' | 'dumbbell' | 'flash' | 'shield'
}

export interface OverheadBillsCardProps {
  unpaid?: number
  paid?: number
  currency?: string
  items?: QuickBillItem[]
  className?: string
}

const DEFAULT_QUICK_ITEMS: QuickBillItem[] = [
  { id: 'rent', name: 'Rent', icon: 'home' },
  { id: 'internet', name: 'Internet', icon: 'wifi' },
  { id: 'gym', name: 'Gym', icon: 'dumbbell' },
]

const ICONS = {
  home: Home,
  wifi: Wifi,
  dumbbell: Dumbbell,
  flash: Zap,
  shield: Shield,
} as const

export const OverheadBillsCard: React.FC<OverheadBillsCardProps> = ({
  unpaid: propUnpaid,
  paid: propPaid,
  currency: propCurrency,
  items: propItems,
  className,
}) => {
  const { bills, summary } = useOverheads()
  const store = useLiquidityStore()

  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  const liveUnpaid = propUnpaid ?? summary.totalUnpaid
  const livePaid = propPaid ?? summary.totalPaid
  const activeCurrencySymbol = propCurrency ?? config.symbol
  const rate = propCurrency ? 1 : (config.rate ?? 1)

  const convertedUnpaid = liveUnpaid * rate
  const convertedPaid = livePaid * rate

  const recurringBills = bills.filter((b) => b.isRecurring !== false)
  const sourceBills = recurringBills.length > 0 ? recurringBills : bills

  const displayItems: QuickBillItem[] = propItems ?? (
    sourceBills.length > 0
      ? sourceBills.slice(0, 3).map((b) => {
          let iconType: 'home' | 'wifi' | 'dumbbell' | 'flash' | 'shield' = 'home'
          if (b.iconKey === 'dumbbell' || b.title.toLowerCase().includes('gym')) iconType = 'dumbbell'
          else if (b.iconKey === 'wifi' || b.title.toLowerCase().includes('internet')) iconType = 'wifi'
          else if (b.iconKey === 'flash' || b.title.toLowerCase().includes('electric')) iconType = 'flash'
          else if (b.iconKey === 'shield' || b.title.toLowerCase().includes('insur')) iconType = 'shield'
          return {
            id: b.id,
            name: b.title,
            icon: iconType,
          }
        })
      : DEFAULT_QUICK_ITEMS
  )

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-overhead-warm px-[1.1rem] pt-[1.1rem] pb-[1.1rem] flex flex-col justify-between gap-[1rem] select-none h-auto min-h-fit',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between">
          <Link
            to="/overheads"
            className="text-[0.78rem] leading-4 font-normal text-white/90 hover:text-white flex items-center gap-1 group transition-colors"
          >
            <span>Overhead Bills</span>
            <ChevronRight className="w-3 h-3 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
        <p className="mt-[0.9rem] text-[0.8125rem] leading-4 text-white/90">This Month</p>

        <div className="mt-[0.5rem] flex items-start gap-[1.5rem]">
          <div>
            <div className="text-[1.25rem] leading-6 font-medium tracking-[-0.025em] text-white">
              <AnimatedNumber value={convertedUnpaid} prefix={activeCurrencySymbol} />
            </div>
            <p className="text-[0.69rem] leading-4 text-white/60">Unpaid</p>
          </div>
          <div>
            <div className="text-[1.25rem] leading-6 font-medium tracking-[-0.025em] text-white">
              <AnimatedNumber value={convertedPaid} prefix={activeCurrencySymbol} />
            </div>
            <p className="text-[0.69rem] leading-4 text-white/60">Paid</p>
          </div>
        </div>
      </div>

      {/* Frosted Quick items panel */}
      <Link
        to="/overheads"
        className="bg-quick-items-frosted rounded-[0.9rem] px-[0.75rem] pt-[0.7rem] pb-[0.7rem] hover:brightness-105 transition-all block cursor-pointer"
      >
        <h4 className="text-[0.8125rem] leading-4 font-normal text-[#1c1c1c]">Quick items</h4>
        <ul className="mt-[0.55rem] flex flex-col gap-[0.55rem]">
          {displayItems.map((item) => {
            const Icon = ICONS[item.icon] ?? Home
            return (
              <li key={item.id ?? item.name} className="flex items-center gap-[0.55rem]">
                <Icon className="w-[0.875rem] h-[0.875rem] text-[#1c1c1c]" strokeWidth={1.7} />
                <span className="text-[0.78rem] leading-4 text-[#1c1c1c] truncate">{item.name}</span>
              </li>
            )
          })}
        </ul>
      </Link>
    </div>
  )
}

export default OverheadBillsCard

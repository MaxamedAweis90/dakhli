import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Dumbbell, Wifi, Check, ChevronRight } from '@/components/shared/icons'
import { useOverheads } from '@/features/overheads/hooks/useOverheads'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { cn } from '@/lib/utils'

export interface UpcomingOverheadItem {
  id: string
  name: string
  date: string
  amount?: number
  icon?: 'home' | 'dumbbell' | 'wifi' | 'check'
  done?: boolean
}

export interface UpcomingOverheadCardProps {
  items?: UpcomingOverheadItem[]
  className?: string
}

const DEFAULT_ITEMS: UpcomingOverheadItem[] = [
  { id: 'gym', name: 'Gym', date: '1 Dec', amount: 20, icon: 'dumbbell' },
  { id: 'rent', name: 'Rent', date: '17 Dec', amount: 200, icon: 'home' },
  { id: 'other', name: 'Other dues', date: '22 Dec', icon: 'check', done: true },
  { id: 'apple', name: 'Apple Music', date: '22 Dec', icon: 'check', done: true },
]

const ICONS = { home: Home, dumbbell: Dumbbell, wifi: Wifi, check: Check } as const

const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export const UpcomingOverheadCard: React.FC<UpcomingOverheadCardProps> = ({
  items: propItems,
  className,
}) => {
  const { bills, updateStatus, isUpdatingStatus } = useOverheads()
  const store = useLiquidityStore()

  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  const todayDay = new Date().getDate()
  const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date())

  // Map live bills if available, sorted by proximity to current day of the month
  const displayItems: UpcomingOverheadItem[] = propItems ?? (
    bills.length > 0
      ? [...bills]
          .sort((a, b) => {
            if (a.status !== b.status) {
              return a.status === 'unpaid' ? -1 : 1
            }
            const distA = (a.dueDay - todayDay + 31) % 31
            const distB = (b.dueDay - todayDay + 31) % 31
            return distA - distB
          })
          .slice(0, 4)
          .map((b) => {
            let iconType: 'home' | 'dumbbell' | 'wifi' | 'check' = 'home'
            if (b.status === 'paid') iconType = 'check'
            else if (b.iconKey === 'dumbbell' || b.title.toLowerCase().includes('gym')) iconType = 'dumbbell'
            else if (b.iconKey === 'wifi' || b.title.toLowerCase().includes('internet')) iconType = 'wifi'

            return {
              id: b.id,
              name: b.title,
              date: `${b.dueDay}${getOrdinal(b.dueDay)} ${monthShort}`,
              amount: b.amount * (config.rate ?? 1),
              icon: iconType,
              done: b.status === 'paid',
            }
          })
      : DEFAULT_ITEMS
  )

  const handleToggle = (id: string, currentlyDone?: boolean) => {
    if (bills.some((b) => b.id === id)) {
      updateStatus({
        id,
        status: currentlyDone ? 'unpaid' : 'paid',
      })
    }
  }

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.1rem] pb-[1.25rem] flex flex-col justify-between gap-[0.85rem] select-none h-auto min-h-fit',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Link
          to="/overheads"
          className="text-[0.85rem] leading-4 font-normal text-white hover:text-white/80 flex items-center gap-1 group transition-colors"
        >
          <span>Upcoming Overhead</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      <ul className="mt-[0.85rem] flex-1 flex flex-col justify-between gap-[0.75rem]">
        {displayItems.map((item) => {
          const Icon = ICONS[item.icon ?? 'check'] ?? Check
          const isRealBill = bills.some((b) => b.id === item.id)

          return (
            <li key={item.id} className="flex items-center gap-[0.85rem] group">
              <span className="w-[2.1rem] h-[2.1rem] shrink-0 rounded-[0.55rem] bg-card-tile flex items-center justify-center text-[#c9c9c9]">
                <Icon className="w-[1rem] h-[1rem]" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.88rem] leading-5 font-medium text-white truncate">{item.name}</p>
                <p className="mt-[0.05rem] text-[0.68rem] leading-3 text-[#8d8d8d]">{item.date}</p>
              </div>
              {item.done ? (
                <button
                  type="button"
                  disabled={isUpdatingStatus || !isRealBill}
                  onClick={() => handleToggle(item.id, true)}
                  title={isRealBill ? 'Click to mark unpaid' : undefined}
                  className="w-[1.2rem] h-[1.2rem] rounded-full bg-[#5c5f66] hover:bg-[#4ADE80] text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default"
                >
                  <Check className="w-[0.7rem] h-[0.7rem]" strokeWidth={3} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUpdatingStatus || !isRealBill}
                  onClick={() => handleToggle(item.id, false)}
                  title={isRealBill ? 'Click to mark paid' : undefined}
                  className="text-[1rem] leading-5 font-medium tracking-[-0.01em] text-white hover:text-[#4ADE80] transition-colors cursor-pointer disabled:cursor-default"
                >
                  <AnimatedNumber value={item.amount ?? 0} prefix={config.symbol} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default UpcomingOverheadCard

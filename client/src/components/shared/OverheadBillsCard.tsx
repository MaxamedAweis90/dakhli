import React from 'react'
import { Home, Wifi, Dumbbell } from '@/components/shared/icons'
import { cn } from '@/lib/utils'

export interface QuickBillItem {
  id?: string
  name: string
  icon: 'home' | 'wifi' | 'dumbbell'
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

const ICONS = { home: Home, wifi: Wifi, dumbbell: Dumbbell } as const

export const OverheadBillsCard: React.FC<OverheadBillsCardProps> = ({
  unpaid = 175.03,
  paid = 200.0,
  currency = '$',
  items = DEFAULT_QUICK_ITEMS,
  className,
}) => {
  const formatAmount = (val: number): string =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-overhead-warm px-[1.1rem] pt-[1.1rem] pb-[1.1rem] flex flex-col justify-between gap-[1rem] select-none h-auto min-h-fit',
        className
      )}
    >
      <div>
        <h3 className="text-[0.78rem] leading-4 font-normal text-white/90">Overhead Bills</h3>
        <p className="mt-[0.9rem] text-[0.8125rem] leading-4 text-white/90">This Month</p>

        <div className="mt-[0.5rem] flex items-start gap-[1.5rem]">
          <div>
            <div className="text-[1.25rem] leading-6 font-medium tracking-[-0.025em] text-white">
              {currency}
              {formatAmount(unpaid)}
            </div>
            <p className="text-[0.69rem] leading-4 text-white/60">Unpaid</p>
          </div>
          <div>
            <div className="text-[1.25rem] leading-6 font-medium tracking-[-0.025em] text-white">
              {currency}
              {formatAmount(paid)}
            </div>
            <p className="text-[0.69rem] leading-4 text-white/60">Paid</p>
          </div>
        </div>
      </div>

      {/* Frosted Quick items panel */}
      <div className="bg-quick-items-frosted rounded-[0.9rem] px-[0.75rem] pt-[0.7rem] pb-[0.7rem]">
        <h4 className="text-[0.8125rem] leading-4 font-normal text-[#1c1c1c]">Quick items</h4>
        <ul className="mt-[0.55rem] flex flex-col gap-[0.55rem]">
          {items.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <li key={item.name} className="flex items-center gap-[0.55rem]">
                <Icon className="w-[0.875rem] h-[0.875rem] text-[#1c1c1c]" strokeWidth={1.7} />
                <span className="text-[0.78rem] leading-4 text-[#1c1c1c]">{item.name}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default OverheadBillsCard

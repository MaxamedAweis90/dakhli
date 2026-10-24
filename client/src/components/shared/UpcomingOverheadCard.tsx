import React from 'react'
import { Home, Dumbbell, Check } from '@/components/shared/icons'
import { cn } from '@/lib/utils'

export interface UpcomingOverheadItem {
  id: string
  name: string
  date: string
  amount?: number
  icon?: 'home' | 'dumbbell' | 'check'
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

const ICONS = { home: Home, dumbbell: Dumbbell, check: Check } as const

export const UpcomingOverheadCard: React.FC<UpcomingOverheadCardProps> = ({
  items = DEFAULT_ITEMS,
  className,
}) => (
  <div
    className={cn(
      'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.1rem] pb-[1.25rem] flex flex-col justify-between gap-[0.85rem] select-none h-auto min-h-fit',
      className
    )}
  >
    <h3 className="text-[0.85rem] leading-4 font-normal text-white">Upcoming Overhead</h3>

    <ul className="mt-[0.85rem] flex-1 flex flex-col justify-between gap-[0.75rem]">
      {items.map((item) => {
        const Icon = ICONS[item.icon ?? 'check']
        return (
          <li key={item.id} className="flex items-center gap-[0.85rem]">
            <span className="w-[2.1rem] h-[2.1rem] shrink-0 rounded-[0.55rem] bg-card-tile flex items-center justify-center text-[#c9c9c9]">
              <Icon className="w-[1rem] h-[1rem]" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.88rem] leading-5 font-medium text-white truncate">{item.name}</p>
              <p className="mt-[0.05rem] text-[0.68rem] leading-3 text-[#8d8d8d]">{item.date}</p>
            </div>
            {item.done ? (
              <span className="w-[1.2rem] h-[1.2rem] rounded-full bg-[#5c5f66] text-[#1a1a1a] flex items-center justify-center">
                <Check className="w-[0.7rem] h-[0.7rem]" strokeWidth={3} />
              </span>
            ) : (
              <span className="text-[1rem] leading-5 font-medium tracking-[-0.01em] text-white">
                ${item.amount}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  </div>
)

export default UpcomingOverheadCard

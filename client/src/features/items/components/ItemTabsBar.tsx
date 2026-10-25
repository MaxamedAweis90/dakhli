import React from 'react'
import { Plus } from 'lucide-react'
import type { ItemTier } from '@/stores/itemsStore'
import { cn } from '@/lib/utils'

export interface ItemTabsBarProps {
  activeTier: 'All' | ItemTier
  onSelectTier: (tier: 'All' | ItemTier) => void
  onAddItem: () => void
  className?: string
}

const TABS: ('All' | ItemTier)[] = ['All', 'Essentials', 'Future Needs', 'Wants']

export const ItemTabsBar: React.FC<ItemTabsBarProps> = ({
  activeTier,
  onSelectTier,
  onAddItem,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full flex items-center justify-between border-b border-white/[0.06] pb-0 select-none',
        className
      )}
    >
      {/* Left Tabs Group */}
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTier === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTier(tab)}
              className={cn(
                'relative py-2.5 text-[0.875rem] transition-colors cursor-pointer whitespace-nowrap',
                isActive
                  ? 'text-[#FDE68A] font-medium'
                  : 'text-[#8E92A0] hover:text-white font-normal'
              )}
            >
              {tab}

              {/* Active Underline Indicator */}
              {isActive && (
                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#FDE68A] rounded-full shadow-[0_0_8px_rgba(253,230,138,0.4)]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Right Action: + Add Item Button */}
      <div className="pb-1.5 pl-4 shrink-0">
        <button
          type="button"
          onClick={onAddItem}
          className="h-[2.2rem] px-4 rounded-xl bg-[#20222B] hover:bg-[#2B2F3D] active:scale-95 text-white text-[0.82rem] font-medium border border-white/[0.06] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Item</span>
        </button>
      </div>
    </div>
  )
}

export default ItemTabsBar

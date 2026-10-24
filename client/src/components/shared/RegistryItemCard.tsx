import React from 'react'
import { Plus } from '@/components/shared/icons'
import { cn } from '@/lib/utils'

export type TierKey = 'essentials' | 'future' | 'wants'

export interface RegistryItem {
  id: string
  name: string
  imageUrl: string
  tier: TierKey
  targetPrice?: number
  /** Amount saved toward this item. If undefined, item is not in a saving plan */
  savedAmount?: number
  savingPlanId?: string
}

export interface RegistryItemCardProps {
  item: RegistryItem
  className?: string
  onClick?: () => void
}

/**
 * Reusable Registry Item Card
 * - Square image with border-radius inside the card
 * - Money saved progress bar OR "No plan" in the same slot
 * - Item name rendered below the card itself
 */
export const RegistryItemCard: React.FC<RegistryItemCardProps> = ({
  item,
  className,
  onClick,
}) => {
  const hasPlan = item.savedAmount !== undefined && item.savedAmount !== null && (item.targetPrice ?? 0) > 0
  const percentage = hasPlan
    ? Math.min(100, Math.max(0, Math.round(((item.savedAmount ?? 0) / (item.targetPrice ?? 1)) * 100)))
    : null

  return (
    <div
      className={cn('flex flex-col items-center group cursor-pointer select-none', className)}
      onClick={onClick}
    >
      {/* The Card */}
      <div className="w-full rounded-[0.95rem] bg-[#1E2028] p-1.5 flex flex-col items-center justify-between border border-white/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.25)] group-hover:border-white/[0.09] group-hover:bg-[#222530] transition-all">
        {/* Square with radius shaped image */}
        <div className="w-full aspect-square rounded-[0.7rem] overflow-hidden bg-[#242732] relative flex items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Progress bar of money saved OR "No plan" in the exact same slot */}
        <div className="w-full h-[0.9rem] flex items-center justify-center mt-1.5 px-0.5">
          {percentage !== null ? (
            <div
              className="w-full h-[0.25rem] rounded-full bg-[#2C2E38] overflow-hidden"
              title={`${percentage}% saved ($${item.savedAmount} / $${item.targetPrice})`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d6f86c] to-[#7ee6f9] transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          ) : (
            <span className="text-[0.62rem] font-medium leading-none text-[#7A7E8F] uppercase tracking-wider select-none">
              No plan
            </span>
          )}
        </div>
      </div>

      {/* Item name below the card itself */}
      <span className="w-full block text-[0.74rem] font-medium leading-snug text-[#E2E4E9] text-center truncate mt-1.5 px-0.5 group-hover:text-white transition-colors">
        {item.name}
      </span>
    </div>
  )
}

export interface AddRegistryItemCardProps {
  onClick?: () => void
  className?: string
  label?: string
}

/**
 * Reusable Add Item Card matching RegistryItemCard geometry
 */
export const AddRegistryItemCard: React.FC<AddRegistryItemCardProps> = ({
  onClick,
  className,
  label = 'Add item',
}) => {
  return (
    <div
      className={cn('flex flex-col items-center group cursor-pointer select-none', className)}
      onClick={onClick}
    >
      {/* The Card */}
      <button
        type="button"
        aria-label={label}
        className="w-full rounded-[0.95rem] border border-dashed border-white/10 bg-[#1E2028]/40 hover:bg-[#1E2028] hover:border-white/20 flex flex-col items-center justify-between p-1.5 cursor-pointer text-[#8E92A0] hover:text-white transition-all shadow-sm"
      >
        <div className="w-full aspect-square rounded-[0.7rem] flex items-center justify-center bg-white/[0.02]">
          <Plus className="w-[1.2rem] h-[1.2rem]" strokeWidth={1.75} />
        </div>
        <div className="w-full h-[0.9rem] flex items-center justify-center mt-1.5">
          <span className="text-[0.62rem] font-medium leading-none text-[#666B7D] uppercase tracking-wider">
            New
          </span>
        </div>
      </button>

      {/* Label below the card itself */}
      <span className="w-full block text-[0.74rem] font-medium leading-snug text-[#8E92A0] text-center truncate mt-1.5 px-0.5 group-hover:text-white transition-colors">
        {label}
      </span>
    </div>
  )
}

export default RegistryItemCard

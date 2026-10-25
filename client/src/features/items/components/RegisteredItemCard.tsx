import React from 'react'
import type { RegisteredItem } from '@/stores/itemsStore'
import { cn } from '@/lib/utils'

export interface RegisteredItemCardProps {
  item: RegisteredItem
  onToggleBought: (id: string) => void
  onRemove: (id: string) => void
  className?: string
}

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US').format(n)

export const RegisteredItemCard: React.FC<RegisteredItemCardProps> = ({
  item,
  onToggleBought,
  onRemove,
  className,
}) => {
  const isBought = item.status === 'bought'
  const hasProgress = typeof item.targetProgress === 'number' && item.targetProgress > 0

  return (
    <div
      className={cn(
        'group relative rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-3.5 sm:p-4 select-none flex flex-col justify-between border border-white/[0.03] hover:border-white/[0.08] transition-all',
        className
      )}
    >
      {/* Top Section: Photo Image Container with Title Overlay */}
      <div>
        <div className="w-full aspect-[16/10] rounded-[1rem] overflow-hidden relative bg-[#22242D] border border-white/[0.04]">
          {/* Subtle top scrim to guarantee title contrast */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />

          {/* Title Overlay on top-left of image */}
          <h3 className="absolute top-3 left-3 text-[1.02rem] sm:text-[1.05rem] font-medium text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] z-20">
            {item.name}
          </h3>

          {/* Photo */}
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Fallback to stylized abstract gradient if network fails
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        {/* Price & Tag Row */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[1.38rem] sm:text-[1.45rem] font-semibold text-white tracking-tight leading-none">
              ${fmt(item.price)}
            </span>

            {/* Tag Pill */}
            {item.tag && (
              <span
                className={cn(
                  'text-[0.72rem] font-medium px-2.5 py-0.5 rounded-full border tracking-tight shrink-0',
                  item.tag === 'In Save Plan'
                    ? 'bg-[#2E2419] text-[#FCD34D] border-amber-500/30'
                    : item.tag === 'Wants' || item.tag === 'Want'
                    ? 'bg-[#24211D] text-[#D4A359] border-amber-500/20'
                    : 'bg-[#20222B] text-[#D1D5DB] border-white/[0.06]'
                )}
              >
                {item.tag}
              </span>
            )}
          </div>

          {/* Target Progress Bar (if target is set, e.g. Mother House 15% target) */}
          {hasProgress && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[0.72rem] text-[#8E92A0] mb-1.5">
                <span className="opacity-0">placeholder</span>
                <span className="font-normal">{item.targetProgress}% target</span>
              </div>
              <div className="w-full h-[0.32rem] rounded-full bg-[#2A2D3A] overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, item.targetProgress ?? 0))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Row: Remove & Bought Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mt-4 pt-1">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="h-[2.25rem] rounded-xl bg-[#22242D] hover:bg-[#2C2F3C] active:scale-95 text-[#C5C8D4] hover:text-white text-[0.82rem] font-medium flex items-center justify-center transition-all cursor-pointer border border-white/[0.04]"
        >
          Remove
        </button>

        <button
          type="button"
          onClick={() => onToggleBought(item.id)}
          className={cn(
            'h-[2.25rem] rounded-xl font-semibold text-[0.82rem] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95',
            isBought
              ? 'border border-[#4ADE80]/50 text-[#86EFAC] bg-[#16271E] hover:bg-[#1D3528]'
              : 'bg-[#D4A359] hover:bg-[#DEB066] text-[#18191E]'
          )}
        >
          Bought
        </button>
      </div>
    </div>
  )
}

export default RegisteredItemCard

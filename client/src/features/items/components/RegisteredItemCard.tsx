import React, { useState } from 'react'
import { Pencil, Check, GripVertical } from 'lucide-react'
import type { RegisteredItem } from '@/stores/itemsStore'
import type { RegistryItem } from '../types/item.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { useSavingsStore } from '@/stores/savingsStore'
import { usePrivacyStore, getDynamicBullets } from '@/stores/privacyStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

export interface RegisteredItemCardProps {
  item: RegistryItem | RegisteredItem
  onToggleBought: (id: string) => void
  onRemove: (id: string) => void
  onEdit?: (item: RegistryItem | RegisteredItem) => void
  isMutating?: boolean
  isHighlighted?: boolean
  badgeLabel?: string
  className?: string
  // Drag & drop reordering
  index?: number
  isDraggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent, index: number) => void
  onDragOver?: (e: React.DragEvent, index: number) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, index: number) => void
}

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)

export const RegisteredItemCard: React.FC<RegisteredItemCardProps> = ({
  item,
  onToggleBought,
  onRemove,
  onEdit,
  isMutating = false,
  isHighlighted = false,
  badgeLabel = 'Just Added',
  className,
  index,
  isDraggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}) => {
  const [isExiting, setIsExiting] = useState(false)
  const [isDipping, setIsDipping] = useState(false)

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isExiting || isDipping || isMutating) return
    setIsExiting(true)
    setTimeout(() => {
      onRemove(item.id)
    }, 280)
  }

  const handleBuy = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isExiting || isDipping || isMutating) return
    setIsDipping(true)
    setTimeout(() => {
      onToggleBought(item.id)
    }, 260)
  }

  const liquidityStore = useLiquidityStore()
  const savingsStore = useSavingsStore()
  const currentCode = (liquidityStore.currency in CURRENCY_CONFIGS
    ? liquidityStore.currency
    : 'USD') as CurrencyCode
  const currencyConfig = CURRENCY_CONFIGS[currentCode]
  const rate = currencyConfig.rate ?? 1
  const isMasked = usePrivacyStore((state) => state.isMasked)

  const displayName = ('title' in item && item.title) ? item.title : item.name
  const rawPrice =
    ('targetPrice' in item && item.targetPrice !== undefined)
      ? item.targetPrice
      : item.price
  const convertedPrice = rawPrice * rate

  // Affordability Engine calculation
  const netSpendable = liquidityStore.netSpendable ?? 0
  let availableFunds = netSpendable
  const linkedPlanId = ('savePlanId' in item && item.savePlanId) ? item.savePlanId : undefined

  if (linkedPlanId) {
    const linkedPlan = savingsStore.plans.find((p) => p.id === linkedPlanId || p.linkedItemId === item.id)
    if (linkedPlan) {
      availableFunds = linkedPlan.currentAmount ?? linkedPlan.currentSaved ?? 0
    }
  } else if ('savedAmount' in item && typeof item.savedAmount === 'number' && item.savedAmount > 0) {
    availableFunds = item.savedAmount
  }

  const isAffordable = availableFunds >= rawPrice
  const shortfall = Math.max(0, rawPrice - availableFunds)
  const convertedShortfall = shortfall * rate

  const isBought = item.status === 'bought'
  const isInSavePlan =
    ('inSavePlan' in item && item.inSavePlan) ||
    item.tag === 'In Save Plan' ||
    (typeof item.targetProgress === 'number' && item.targetProgress > 0)
  const progressPercent =
    typeof item.targetProgress === 'number'
      ? item.targetProgress
      : isInSavePlan
        ? 35
        : 0

  return (
    <div
      id={`item-card-${item.id}`}
      onDragOver={(e) => isDraggable && onDragOver?.(e, index ?? 0)}
      onDrop={(e) => isDraggable && onDrop?.(e, index ?? 0)}
      className={cn(
        'group relative rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-3.5 sm:p-4 select-none flex flex-col justify-between border transition-all duration-300 ease-out',
        isHighlighted
          ? 'border-[#D4A359] ring-2 ring-[#D4A359]/70 shadow-[0_4px_24px_rgba(212,163,89,0.22)] bg-[#1B1B22]'
          : 'border-white/[0.03] hover:border-white/[0.08]',
        isDragging && 'opacity-40 scale-[0.98] border-amber-500/30',
        isDragOver && !isDragging && 'ring-2 ring-[#D4A359]/60 scale-[1.01]',
        isExiting &&
          'translate-y-10 opacity-0 scale-[0.96] pointer-events-none blur-[0.5px] transition-all duration-280 ease-in',
        isDipping &&
          'translate-y-8 scale-[0.86] opacity-0 blur-[0.5px] pointer-events-none transition-all duration-260 ease-[cubic-bezier(0.2,0,0,1)]',
        className
      )}
    >
      {/* Creation / Restored showcase badge */}
      {isHighlighted && (
        <div className="absolute -top-2.5 right-4 z-30 px-2.5 py-0.5 rounded-full bg-[#D4A359] text-[#121316] font-semibold text-[0.68rem] tracking-tight shadow-[0_2px_12px_rgba(212,163,89,0.5)] animate-in fade-in zoom-in-95 duration-200">
          {badgeLabel}
        </div>
      )}

      {/* Top Section: Photo Image Container with Title Overlay */}
      <div>
        <div className="w-full aspect-[16/10] rounded-[1rem] overflow-hidden relative bg-[#22242D] border border-white/[0.04]">
          {/* Subtle top scrim to guarantee title contrast */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />

          {/* Top-right Actions: Grab Handle + Quick Edit (Both appear smoothly on card hover) */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            {/* Grab Handle - visible only on hover, matching Quick Edit button */}
            {isDraggable && (
              <div
                draggable
                onDragStart={(e) => onDragStart?.(e, index ?? 0)}
                onDragEnd={onDragEnd}
                title="Drag to reorder"
                className={cn(
                  'w-7 h-7 rounded-lg bg-black/70 hover:bg-black/95 backdrop-blur-md text-[#C5C8D4] hover:text-white flex items-center justify-center border border-white/15 cursor-grab active:cursor-grabbing shadow-md active:scale-95 select-none transition-all duration-200',
                  isDragging
                    ? 'opacity-100 scale-95 ring-1 ring-[#D4A359]/50'
                    : 'opacity-0 group-hover:opacity-100'
                )}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Quick Edit shortcut on top-right of image - visible only on hover */}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(item)
                }}
                title="Edit Item"
                className="w-7 h-7 rounded-lg bg-black/70 hover:bg-black/95 backdrop-blur-md text-[#C5C8D4] hover:text-white flex items-center justify-center border border-white/15 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-md active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Title Overlay on top-left of image */}
          <h3 className="absolute top-3 left-3 text-[1.02rem] sm:text-[1.05rem] font-medium text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] z-20 pr-16 truncate max-w-[85%]">
            {displayName}
          </h3>

          {/* Photo */}
          <img
            src={item.imageUrl}
            alt={displayName}
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
            <span className="text-[1.38rem] sm:text-[1.45rem] font-semibold text-white tracking-tight leading-none font-mono tabular-nums">
              {currencyConfig.symbol}{isMasked ? getDynamicBullets(convertedPrice) : fmt(convertedPrice)}
            </span>

            {/* Tag Pill & Affordability Badge Row */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Affordability Badge */}
              {isAffordable ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums tracking-wide">
                  READY
                </span>
              ) : (
                <span className="bg-white/5 text-slate-400 border border-white/5 font-mono text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums tracking-wide">
                  SHORT {currencyConfig.symbol}{isMasked ? getDynamicBullets(convertedShortfall) : fmt(convertedShortfall)}
                </span>
              )}

              {/* Tier Tag */}
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
          </div>

          {/* Universal Progress Bar Present on Every Card */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[0.72rem] text-[#8E92A0] mb-1.5 select-none">
              <span className="font-normal text-[#8E92A0]">Save plan</span>
              <span
                className={cn(
                  'font-medium tracking-tight',
                  isInSavePlan ? 'text-white' : 'text-[#6C707F]'
                )}
              >
                {isInSavePlan ? `${progressPercent}% target` : 'No planned'}
              </span>
            </div>
            <div className="w-full h-[0.32rem] rounded-full bg-[#242733] overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isInSavePlan ? 'bg-white' : 'w-0'
                )}
                style={{ width: `${isInSavePlan ? Math.min(100, Math.max(0, progressPercent)) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Row: Remove & Bought Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mt-4 pt-1">
        <button
          type="button"
          disabled={isMutating || isExiting || isDipping}
          onClick={handleRemove}
          className="h-[2.25rem] rounded-xl bg-[#22242D] hover:bg-[#2C2F3C] active:scale-95 text-[#C5C8D4] hover:text-white text-[0.82rem] font-medium flex items-center justify-center transition-all cursor-pointer border border-white/[0.04] disabled:opacity-50"
        >
          Remove
        </button>

        <button
          type="button"
          disabled={isMutating || isExiting || isDipping}
          onClick={handleBuy}
          className={cn(
            'h-[2.25rem] rounded-xl font-semibold text-[0.82rem] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50',
            isBought || isDipping
              ? 'border border-[#4ADE80]/50 text-[#86EFAC] bg-[#16271E]'
              : 'bg-[#D4A359] hover:bg-[#DEB066] text-[#18191E]'
          )}
        >
          {isDipping ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>Bought!</span>
            </>
          ) : isBought ? (
            'Bought'
          ) : (
            'Buy'
          )}
        </button>
      </div>
    </div>
  )
}

export default RegisteredItemCard

import React from 'react'
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react'
import type { RegisteredItem } from '@/stores/itemsStore'
import type { RegistryItem } from '../types/item.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

export interface BoughtItemsListProps {
  items: (RegistryItem | RegisteredItem)[]
  onUndoBought: (id: string) => void
  onRemove: (id: string) => void
  isMutating?: boolean
  className?: string
}

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)

export const BoughtItemsList: React.FC<BoughtItemsListProps> = ({
  items,
  onUndoBought,
  onRemove,
  isMutating = false,
  className,
}) => {
  const liquidityStore = useLiquidityStore()
  const currentCode = (liquidityStore.currency in CURRENCY_CONFIGS
    ? liquidityStore.currency
    : 'USD') as CurrencyCode
  const currencyConfig = CURRENCY_CONFIGS[currentCode]
  const rate = currencyConfig.rate ?? 1

  const getItemPrice = (item: RegistryItem | RegisteredItem): number =>
    ('targetPrice' in item && item.targetPrice !== undefined)
      ? item.targetPrice
      : item.price

  const getItemName = (item: RegistryItem | RegisteredItem): string =>
    ('title' in item && item.title) ? item.title : item.name

  const getItemTierLabel = (item: RegistryItem | RegisteredItem): string =>
    ('displayTier' in item && item.displayTier) ? item.displayTier : item.tier

  const totalBought = items.reduce((acc, item) => acc + getItemPrice(item), 0) * rate

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] border border-white/[0.04] p-5 sm:p-6 select-none',
        className
      )}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
          <h3 className="text-[1.12rem] font-semibold text-white tracking-tight">
            Bought Items
          </h3>
          <span className="text-[0.75rem] font-medium text-[#8E92A0] bg-[#22242D] px-2.5 py-0.5 rounded-full border border-white/[0.04]">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[0.88rem]">
          <span className="text-[#8E92A0]">Total Completed:</span>
          <span className="font-semibold text-[#4ADE80] font-mono text-[1.05rem]">
            {currencyConfig.symbol}{fmt(totalBought)}
          </span>
        </div>
      </div>

      {/* List / Table Content */}
      {items.length === 0 ? (
        <div className="py-8 text-center text-[#8E92A0] text-[0.85rem]">
          No items marked as bought yet. When an item is bought, it will appear here in this list.
        </div>
      ) : (
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse mt-1">
            <thead>
              <tr className="border-b border-white/[0.04] text-[0.78rem] font-normal text-[#8E92A0]">
                <th className="py-3 pl-1 font-normal">Item</th>
                <th className="py-3 font-normal">Tier</th>
                <th className="py-3 font-normal">Price</th>
                <th className="py-3 font-normal">Status</th>
                <th className="py-3 pr-1 font-normal text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.03]">
              {items.map((item) => {
                const name = getItemName(item)
                const tierLabel = getItemTierLabel(item)
                const price = getItemPrice(item) * rate

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-white/[0.015] transition-colors"
                  >
                    {/* Item: Thumbnail + Title */}
                    <td className="py-3.5 pl-1">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#22242D] border border-white/[0.05] shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                        <span className="text-[0.92rem] font-medium text-white tracking-tight">
                          {name}
                        </span>
                      </div>
                    </td>

                    {/* Tier Tag */}
                    <td className="py-3.5">
                      <span
                        className={cn(
                          'text-[0.72rem] font-medium px-2.5 py-0.5 rounded-full border tracking-tight',
                          tierLabel === 'Wants'
                            ? 'bg-[#24211D] text-[#D4A359] border-amber-500/20'
                            : tierLabel === 'Essentials'
                              ? 'bg-[#20222B] text-[#D1D5DB] border-white/[0.06]'
                              : 'bg-[#1E232B] text-[#93C5FD] border-blue-500/20'
                        )}
                      >
                        {tierLabel}
                      </span>
                    </td>

                    {/* Purchase Price */}
                    <td className="py-3.5 text-[0.92rem] font-semibold text-white font-mono">
                      {currencyConfig.symbol}{fmt(price)}
                    </td>

                    {/* Status & Bought Date */}
                    <td className="py-3.5 text-[0.82rem] text-[#8E92A0]">
                      <span className="inline-flex items-center gap-1.5 text-[#4ADE80]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                        <span>Bought {item.boughtDate ? item.boughtDate : 'completed'}</span>
                      </span>
                    </td>

                    {/* Actions: Undo & Remove */}
                    <td className="py-3.5 pr-1 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => onUndoBought(item.id)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#20222B] hover:bg-[#282B37] text-slate-300 hover:text-white border border-white/[0.04] text-[0.78rem] font-medium transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3 text-[#8E92A0]" />
                          <span>Undo</span>
                        </button>

                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => onRemove(item.id)}
                          aria-label={`Delete ${name}`}
                          className="p-1.5 rounded-lg text-[#8E92A0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default BoughtItemsList

import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ItemsBottomTotalsProps {
  unboughtTotal: number
  boughtTotal: number
  boughtCount: number
  className?: string
}

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US').format(n)

export const ItemsBottomTotals: React.FC<ItemsBottomTotalsProps> = ({
  unboughtTotal,
  boughtTotal,
  boughtCount,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 pb-8 border-t border-white/[0.04] select-none text-[0.92rem]',
        className
      )}
    >
      {/* Left: Unbought Totals */}
      <div className="flex items-center text-[#8E92A0]">
        <span>Unbought totals:</span>
        <span className="text-white font-semibold text-[1.05rem] ml-2 tracking-tight">
          ${fmt(unboughtTotal)}
        </span>
      </div>

      {/* Far Right: Bought Items Section & Total */}
      <div className="flex items-center gap-2.5 text-[#8E92A0] sm:ml-auto">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
          <span>Bought items:</span>
        </div>
        <span className="text-[#4ADE80] font-semibold text-[1.05rem] tracking-tight">
          ${fmt(boughtTotal)}
        </span>
        {boughtCount > 0 && (
          <span className="text-[0.75rem] font-medium text-[#8E92A0] bg-[#22242D] px-2 py-0.5 rounded-full border border-white/[0.04]">
            {boughtCount} {boughtCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
    </div>
  )
}

export default ItemsBottomTotals

import React from 'react'
import { Link2, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OverheadBillsLedgerBannerProps {
  totalOverhead: number
  totalPaid: number
  totalUnpaid: number
  className?: string
}

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)

/**
 * Section 1: Overhead Bills Ledger Summary Card
 * Dedicated top card featuring Overhead Bills Ledger header with [🔗 | •••] capsule
 * and enlarged, prominent 3-column financial metrics with exact reference alignment.
 */
export const OverheadBillsLedgerBanner: React.FC<OverheadBillsLedgerBannerProps> = ({
  totalOverhead,
  totalPaid,
  totalUnpaid,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-6 py-6 lg:px-8 lg:py-6.5 select-none',
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-[1.28rem] lg:text-[1.38rem] font-semibold text-white tracking-tight">
          Overhead Bills Ledger
        </h2>

        {/* Right Capsule Options [🔗 | •••] */}
        <div className="flex items-center h-[1.95rem] px-3 rounded-full bg-[#22242D] text-[#8E92A0] text-[0.75rem] font-medium gap-2.5 border border-white/[0.04]">
          <Link2 className="w-3.5 h-3.5 text-[#B5B9C9]" />
          <span className="w-px h-3.5 bg-white/10" />
          <button
            type="button"
            aria-label="More options"
            className="hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Row (3 Columns with prominent enlarged money size & exact reference positioning) */}
      <div className="mt-7 grid grid-cols-[1.3fr_1.1fr_auto] items-start w-full">
        {/* Total Overhead */}
        <div>
          <span className="block text-[0.84rem] font-normal text-[#8E92A0] mb-2 tracking-normal">
            Total Overhead
          </span>
          <p className="text-[2.75rem] sm:text-[3.15rem] lg:text-[3.45rem] font-semibold text-white tracking-tight leading-none">
            ${fmt(totalOverhead)}
          </p>
        </div>

        {/* Paid */}
        <div>
          <span className="block text-[0.84rem] font-normal text-[#8E92A0] mb-2 tracking-normal">
            Paid
          </span>
          <p className="text-[2.75rem] sm:text-[3.15rem] lg:text-[3.45rem] font-semibold text-[#4ADE80] tracking-tight leading-none">
            ${fmt(totalPaid)}
          </p>
        </div>

        {/* Unpaid */}
        <div className="pr-1 sm:pr-3">
          <span className="block text-[0.84rem] font-normal text-[#8E92A0] mb-2 tracking-normal">
            Unpaid
          </span>
          <p className="text-[2.75rem] sm:text-[3.15rem] lg:text-[3.45rem] font-semibold text-[#FA8C68] tracking-tight leading-none">
            ${fmt(totalUnpaid)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default OverheadBillsLedgerBanner

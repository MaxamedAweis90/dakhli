import React from 'react'
import { KeyRound, Home, Wifi, Dumbbell, Zap, Shield, Check } from 'lucide-react'
import type { OverheadBill } from '@/stores/overheadsStore'
import { cn } from '@/lib/utils'

export interface OverheadLedgerTableProps {
  bills: OverheadBill[]
  onTogglePaid: (id: string) => void
  className?: string
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  key: KeyRound,
  home: Home,
  wifi: Wifi,
  dumbbell: Dumbbell,
  flash: Zap,
  shield: Shield,
  other: Home,
}

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)

export const OverheadLedgerTable: React.FC<OverheadLedgerTableProps> = ({
  bills,
  onTogglePaid,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-6 lg:p-7 select-none',
        className
      )}
    >
      <div className="w-full overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] text-[0.8rem] font-normal text-[#8E92A0]">
              <th className="pb-3.5 pl-1 font-normal">Bill</th>
              <th className="pb-3.5 font-normal">Due Date</th>
              <th className="pb-3.5 font-normal">Billed Amount</th>
              <th className="pb-3.5 font-normal">Status</th>
              <th className="pb-3.5 pr-2 font-normal text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.04]">
            {bills.map((bill) => {
              const Icon = CATEGORY_ICONS[bill.category] ?? Home
              const isPaid = bill.status === 'paid'

              return (
                <tr
                  key={bill.id}
                  className="group hover:bg-white/[0.015] transition-colors"
                >
                  {/* Bill Name + Icon Tile */}
                  <td className="py-4 pl-1">
                    <div className="flex items-center gap-3.5">
                      <div className="w-[2.2rem] h-[2.2rem] rounded-[0.65rem] bg-[#22242D] border border-white/[0.03] flex items-center justify-center text-[#d1d5db] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[0.92rem] font-medium text-white tracking-tight">
                        {bill.name}
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-4 text-[0.88rem] text-white/90 font-normal">
                    {bill.dueDate}
                  </td>

                  {/* Billed Amount */}
                  <td className="py-4 text-[0.95rem] text-white font-medium">
                    ${fmt(bill.amount)}
                  </td>

                  {/* Status */}
                  <td className="py-4 text-[0.88rem] font-medium">
                    {isPaid ? (
                      <span className="text-[#4ADE80]">
                        {bill.paidDate ?? 'Paid'}
                      </span>
                    ) : (
                      <span className="text-[#FA8C68]">Unpaid</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 pr-2 text-right">
                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => onTogglePaid(bill.id)}
                        title="Mark as unpaid"
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4ADE80] text-[#15161A] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTogglePaid(bill.id)}
                        className="h-[2rem] px-4 rounded-xl bg-[#252833] hover:bg-[#303544] active:scale-95 text-white text-[0.8rem] font-medium border border-white/[0.06] transition-all cursor-pointer shadow-sm tracking-tight"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OverheadLedgerTable

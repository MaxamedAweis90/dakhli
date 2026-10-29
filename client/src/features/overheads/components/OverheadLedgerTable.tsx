import React from 'react'
import { KeyRound, Home, Wifi, Dumbbell, Zap, Shield, Music, Check, Trash2 } from 'lucide-react'
import type { OverheadBill, OverheadStatus } from '../types/overhead.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

export interface OverheadLedgerTableProps {
  bills: OverheadBill[]
  onTogglePaid: (id: string, currentStatus: OverheadStatus) => void
  onDeleteBill?: (id: string) => void
  isUpdating?: boolean
  className?: string
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  key: KeyRound,
  home: Home,
  wifi: Wifi,
  dumbbell: Dumbbell,
  flash: Zap,
  shield: Shield,
  music: Music,
  other: Home,
}

const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

const getCategoryIcon = (bill: OverheadBill) => {
  if (bill.iconKey && CATEGORY_ICONS[bill.iconKey]) {
    return CATEGORY_ICONS[bill.iconKey]
  }
  const lower = bill.title.toLowerCase()
  if (lower.includes('rent') || lower.includes('key')) return KeyRound
  if (lower.includes('gym') || lower.includes('fit')) return Dumbbell
  if (lower.includes('wifi') || lower.includes('internet')) return Wifi
  if (lower.includes('music') || lower.includes('apple') || lower.includes('spotify')) return Music
  if (lower.includes('electric') || lower.includes('power')) return Zap
  if (lower.includes('insur') || lower.includes('shield')) return Shield
  return Home
}

export const OverheadLedgerTable: React.FC<OverheadLedgerTableProps> = ({
  bills,
  onTogglePaid,
  onDeleteBill,
  isUpdating = false,
  className,
}) => {
  const store = useLiquidityStore()
  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  const formatAmount = (val: number): string =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val * (config.rate ?? 1))

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
            {bills.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[0.88rem] text-[#8E92A0]">
                  No overhead bills recorded for this cycle. Click{' '}
                  <span className="text-[#F7B668] font-medium">"Add Bill"</span> to create your first obligation.
                </td>
              </tr>
            ) : (
              bills.map((bill) => {
                const Icon = getCategoryIcon(bill)
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
                        <div>
                          <span className="text-[0.92rem] font-medium text-white tracking-tight block">
                            {bill.title}
                          </span>
                          {bill.notes && (
                            <span className="text-[0.72rem] text-[#70727a] block truncate max-w-[200px]">
                              {bill.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-4 text-[0.88rem] text-white/90 font-normal">
                      Due {bill.dueDay}{getOrdinal(bill.dueDay)}
                    </td>

                    {/* Billed Amount */}
                    <td className="py-4 text-[0.95rem] text-white font-medium">
                      {config.symbol}{formatAmount(bill.amount)}
                    </td>

                    {/* Status */}
                    <td className="py-4 text-[0.88rem] font-medium">
                      {isPaid ? (
                        <span className="text-[#4ADE80]">
                          Paid
                        </span>
                      ) : (
                        <span className="text-[#FA8C68]">Unpaid</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isPaid ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onTogglePaid(bill.id, 'paid')}
                            title="Mark as unpaid (refund to gross balance)"
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4ADE80] text-[#15161A] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onTogglePaid(bill.id, 'unpaid')}
                            className="h-[2rem] px-4 rounded-xl bg-[#252833] hover:bg-[#303544] active:scale-95 text-white text-[0.8rem] font-medium border border-white/[0.06] transition-all cursor-pointer shadow-sm tracking-tight disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}

                        {onDeleteBill && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onDeleteBill(bill.id)}
                            title="Delete / Archive bill"
                            className="p-1.5 rounded-lg text-[#70727a] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OverheadLedgerTable

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  KeyRound,
  Home,
  Wifi,
  Dumbbell,
  Zap,
  Shield,
  Music,
  Check,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
} from 'lucide-react'
import type { OverheadBill, OverheadStatus } from '../types/overhead.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { usePrivacyStore, getDynamicBullets } from '@/stores/privacyStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

export interface OverheadLedgerTableProps {
  bills: OverheadBill[]
  onTogglePaid: (id: string, currentStatus: OverheadStatus) => void
  onEditBill?: (bill: OverheadBill) => void
  onToggleActive?: (id: string, currentActive: boolean) => void
  onDeleteBill?: (id: string) => void
  isCurrentCycle?: boolean
  isFutureCycle?: boolean
  isPastCycle?: boolean
  isDormant?: boolean
  isUpdating?: boolean
  className?: string
}

type StatusFilter = 'all' | 'paid' | 'unpaid' | 'overdue'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'paid', label: 'PAID' },
  { key: 'unpaid', label: 'UNPAID' },
  { key: 'overdue', label: 'OVERDUE' },
]

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
  onEditBill,
  onToggleActive,
  onDeleteBill,
  isCurrentCycle = true,
  isFutureCycle = false,
  isPastCycle = false,
  isDormant = false,
  isUpdating = false,
  className,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [menuCoords, setMenuCoords] = useState<{
    top: number
    left: number
    openUpward: boolean
  } | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const store = useLiquidityStore()
  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  // Close dropdown on click outside, Escape, or scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && menuRef.current.contains(target)) {
        return
      }
      if (openMenuId && triggerRefs.current[openMenuId]?.contains(target)) {
        return
      }
      setOpenMenuId(null)
      setConfirmDeleteId(null)
      setMenuCoords(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
        setConfirmDeleteId(null)
        setMenuCoords(null)
      }
    }

    const handleScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null)
        setConfirmDeleteId(null)
        setMenuCoords(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [openMenuId])

  // Filter bills by status
  const filteredBills = useMemo(() => {
    if (statusFilter === 'all') return bills

    const currentDay = new Date().getDate()

    if (statusFilter === 'paid') {
      return bills.filter((b) => b.status === 'paid')
    }

    if (statusFilter === 'unpaid') {
      return bills.filter((b) => b.status === 'unpaid')
    }

    if (statusFilter === 'overdue') {
      if (isFutureCycle) return []
      if (isPastCycle) {
        return bills.filter((b) => b.status === 'unpaid')
      }
      return bills.filter((b) => b.status === 'unpaid' && currentDay > b.dueDay)
    }

    return bills
  }, [bills, statusFilter, isPastCycle, isFutureCycle])

  const isMasked = usePrivacyStore((state) => state.isMasked)

  const formatAmount = (val: number): string => {
    if (isMasked) {
      return getDynamicBullets(val * (config.rate ?? 1))
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val * (config.rate ?? 1))
  }

  // Temporal Status Rendering without button badges or borders
  const renderStatus = (bill: OverheadBill) => {
    if (isDormant || bill.status === 'dormant' || bill.isDormant) {
      return (
        <span className="text-slate-400 bg-white/5 border border-white/5 font-mono text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
          CYCLE SKIPPED (DORMANT)
        </span>
      )
    }

    if (bill.isActive === false) {
      return <span className="text-[#8E92A0]">Inactive</span>
    }

    // B. Past Closed Months (selectedCycle < currentCycle)
    if (isPastCycle) {
      if (bill.status === 'paid') {
        return <span className="text-amber-300">Paid</span>
      }
      return <span className="text-[#FA8C68]">Unpaid</span>
    }

    // C. Future Months (selectedCycle > currentCycle)
    if (isFutureCycle) {
      return <span className="text-[#8E92A0]">Scheduled</span>
    }

    // A. Live Active Month (selectedCycle === currentCycle)
    if (bill.status === 'paid') {
      return <span className="text-[#4ADE80]">Paid</span>
    }

    // Live active month - Unpaid urgency classification
    const currentDay = new Date().getDate()
    const dueDay = bill.dueDay

    // Due Today
    if (dueDay === currentDay) {
      return <span className="text-amber-400 font-medium">Payday</span>
    }

    // Past Due
    if (currentDay > dueDay) {
      const daysOverdue = currentDay - dueDay
      return <span className="text-[#FA8C68]">Overdue {daysOverdue}d</span>
    }

    // Upcoming (<= 3 Days)
    const daysUntilDue = dueDay - currentDay
    if (daysUntilDue <= 3) {
      return <span className="text-slate-300">Due in {daysUntilDue}d</span>
    }

    // Distant (> 3 Days)
    return <span className="text-[#8E92A0]">Due day {dueDay}</span>
  }

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, billId: string) => {
    e.stopPropagation()
    if (openMenuId === billId) {
      setOpenMenuId(null)
      setConfirmDeleteId(null)
      setMenuCoords(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const menuEstimatedHeight = 155
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight

    setMenuCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(12, rect.right - 192), // 192px = w-48
      openUpward,
    })
    setConfirmDeleteId(null)
    setOpenMenuId(billId)
  }

  const activeBill = bills.find((b) => b.id === openMenuId)

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-4 sm:p-6 lg:p-7 select-none',
        isDormant && 'opacity-60',
        className
      )}
    >
      {/* 1. Status Filter Strip (ALL, PAID, UNPAID, OVERDUE) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-4 mb-4 border-b border-white/[0.04]">
        {STATUS_FILTERS.map((tab) => {
          const isActive = statusFilter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer shrink-0',
                isActive
                  ? 'text-white bg-[#1A1D26] border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 2. Bills Table */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <table className={cn('w-full text-left border-collapse', filteredBills.length > 0 && 'min-w-[580px] sm:min-w-0')}>
          <thead>
            <tr className="border-b border-white/[0.05] text-[0.8rem] font-normal text-[#8E92A0] whitespace-nowrap">
              <th className="pb-3.5 pl-1 pr-3 font-normal">Bill</th>
              <th className="pb-3.5 pr-3 font-normal">Due Date</th>
              <th className="pb-3.5 pr-3 font-normal">Billed Amount</th>
              <th className="pb-3.5 pr-3 font-normal">Status</th>
              <th className="pb-3.5 pr-2 font-normal text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.04]">
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[0.88rem] text-[#8E92A0]">
                  {bills.length === 0 ? (
                    <>
                      No overhead bills recorded for this cycle.{' '}
                      {!isPastCycle && (
                        <span>
                          Click <span className="text-[#F7B668] font-medium">"Add Bill"</span> to create your first obligation.
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      No {statusFilter !== 'all' ? statusFilter : ''} bills recorded for this cycle.{' '}
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className="text-[#F7B668] hover:underline cursor-pointer ml-1"
                      >
                        Show all
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => {
                const Icon = getCategoryIcon(bill)
                const isPaid = bill.status === 'paid'
                const isInactive = bill.isActive === false
                const isPaidActive = isCurrentCycle && isPaid
                const isMenuOpen = openMenuId === bill.id

                return (
                  <tr
                    key={bill.id}
                    className={cn(
                      'group hover:bg-white/[0.015] transition-colors',
                      isInactive && 'opacity-50',
                      isPaidActive && 'opacity-45'
                    )}
                  >
                    {/* Bill Name + Icon Tile */}
                    <td className="py-4 pl-1">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            'w-[2.2rem] h-[2.2rem] rounded-[0.65rem] bg-[#22242D] border border-white/[0.03] flex items-center justify-center shrink-0',
                            isInactive ? 'text-[#60636d]' : 'text-[#d1d5db]'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span
                            className={cn(
                              'text-[0.92rem] font-medium tracking-tight block',
                              isInactive || isPaidActive
                                ? 'text-slate-400 line-through'
                                : 'text-white'
                            )}
                          >
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
                    <td
                      className={cn(
                        'py-4 pr-3 text-[0.88rem] font-normal whitespace-nowrap',
                        isInactive ? 'text-[#70727a] line-through' : 'text-white/90'
                      )}
                    >
                      Due {bill.dueDay}
                      {getOrdinal(bill.dueDay)}
                    </td>

                    {/* Billed Amount */}
                    <td
                      className={cn(
                        'py-4 pr-3 text-[0.95rem] font-mono tabular-nums font-medium whitespace-nowrap',
                        isInactive ? 'text-[#70727a] line-through' : 'text-white'
                      )}
                    >
                      {config.symbol}
                      {formatAmount(bill.amount)}
                    </td>

                    {/* Status (Clean Text, No Button Borders or Backgrounds) */}
                    <td className="py-4 text-[0.88rem] font-medium font-mono">
                      {renderStatus(bill)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-2 text-right relative">
                      <div className="inline-flex items-center gap-2">
                        {/* Mark Paid / Status Button */}
                        {isDormant ? (
                          <div
                            title="Cycle skipped due to account deactivation"
                            className="inline-flex items-center"
                          >
                            <span className="h-[1.95rem] px-3 rounded-xl bg-white/[0.03] text-[#70727a] text-[0.78rem] font-medium border border-white/[0.04] inline-flex items-center cursor-not-allowed">
                              Skipped
                            </span>
                          </div>
                        ) : isPastCycle ? (
                          // Past cycle: locked/read-only
                          <div
                            title="Archived cycle: Past months are read-only"
                            className="inline-flex items-center"
                          >
                            {isPaid ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4ADE80]/30 text-[#4ADE80] cursor-not-allowed">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <span className="h-[1.95rem] px-3 rounded-xl bg-white/[0.03] text-[#70727a] text-[0.78rem] font-medium border border-white/[0.04] inline-flex items-center cursor-not-allowed">
                                Locked
                              </span>
                            )}
                          </div>
                        ) : isFutureCycle ? (
                          // Future cycle: scheduled / cannot pre-mark
                          <button
                            type="button"
                            disabled
                            title="Future cycle: Scheduled (interactive when cycle begins)"
                            className="h-[2rem] px-3.5 rounded-xl bg-[#20222a] text-[#8E92A0] text-[0.78rem] font-medium border border-white/[0.04] opacity-50 cursor-not-allowed"
                          >
                            Scheduled
                          </button>
                        ) : isInactive ? (
                          // Inactive bill: disabled
                          <span className="text-[0.75rem] text-[#70727a] italic pr-2">
                            Deactivated
                          </span>
                        ) : isPaid ? (
                          // Active Paid: can toggle back to unpaid
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onTogglePaid(bill.id, 'paid')}
                            title="Mark as unpaid"
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4ADE80] text-[#15161A] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        ) : (
                          // Active Unpaid: Mark Paid button
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onTogglePaid(bill.id, 'unpaid')}
                            className="h-[2rem] px-4 rounded-xl bg-[#252833] hover:bg-[#303544] active:scale-95 text-white text-[0.8rem] font-medium border border-white/[0.06] transition-all cursor-pointer shadow-sm tracking-tight disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}

                        {/* 3-Dot Vertical Context Menu Trigger */}
                        {!isPastCycle && !isDormant && (
                          <button
                            ref={(el) => {
                              triggerRefs.current[bill.id] = el
                            }}
                            type="button"
                            aria-label="Bill actions"
                            disabled={isUpdating}
                            onClick={(e) => handleToggleMenu(e, bill.id)}
                            className={cn(
                              'p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer',
                              isMenuOpen && 'bg-white/10 text-white'
                            )}
                          >
                            <MoreVertical className="w-4 h-4" />
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

      {/* 3. Floating Dropdown Menu (Fixed Positioning, Highest Z-Index, Never Clipped by Table Overflow) */}
      {openMenuId && activeBill && menuCoords && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuCoords.openUpward ? undefined : `${menuCoords.top}px`,
            bottom: menuCoords.openUpward
              ? `${window.innerHeight - menuCoords.top}px`
              : undefined,
            left: `${menuCoords.left}px`,
            zIndex: 9999,
          }}
          className="w-48 rounded-xl bg-[#1A1D26] border border-white/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.85)] py-1.5 text-left animate-fade-in pointer-events-auto"
        >
          {confirmDeleteId === activeBill.id ? (
            // Inline Delete Confirmation
            <div className="p-2.5 space-y-2">
              <p className="text-[0.76rem] text-slate-300 font-medium leading-tight">
                Delete this bill from current and future cycles?
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteBill) onDeleteBill(activeBill.id)
                    setOpenMenuId(null)
                    setConfirmDeleteId(null)
                    setMenuCoords(null)
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[0.74rem] font-semibold transition-colors cursor-pointer text-center"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[0.74rem] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Standard Context Options
            <>
              {/* 1. Edit Bill */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null)
                  setMenuCoords(null)
                  if (onEditBill) onEditBill(activeBill)
                }}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-[0.8rem] text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Bill</span>
              </button>

              {/* 2. Deactivate / Activate */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null)
                  setMenuCoords(null)
                  if (onToggleActive) {
                    onToggleActive(activeBill.id, activeBill.isActive !== false)
                  }
                }}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-[0.8rem] text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Power
                  className={cn(
                    'w-3.5 h-3.5',
                    activeBill.isActive === false
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  )}
                />
                <span>
                  {activeBill.isActive === false ? 'Activate' : 'Deactivate'}
                </span>
              </button>

              <div className="my-1 border-t border-white/[0.06]" />

              {/* 3. Delete */}
              <button
                type="button"
                onClick={() => setConfirmDeleteId(activeBill.id)}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-[0.8rem] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default OverheadLedgerTable

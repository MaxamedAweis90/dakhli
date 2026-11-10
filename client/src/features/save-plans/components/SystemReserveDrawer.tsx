import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'
import type { ReserveSourceBalance, SavePlan } from '../types/savePlan.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import {
  CURRENCY_CONFIGS,
  type CurrencyCode,
} from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

interface SystemReserveDrawerProps {
  isOpen: boolean
  onClose: () => void
  plan: SavePlan
  onSave: (updates: Partial<SavePlan>) => Promise<any> | void
  isMutating?: boolean
}

const getDayWithSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

export const SystemReserveDrawer: React.FC<SystemReserveDrawerProps> = ({
  isOpen,
  onClose,
  plan,
  onSave,
  isMutating = false,
}) => {
  const navigate = useNavigate()
  const liquidityStore = useLiquidityStore()
  const { baseline } = useBaseline()
  const salaryDay = baseline?.paydayAnchorDay ?? 25

  const currentCode = (
    liquidityStore.currency in CURRENCY_CONFIGS
      ? liquidityStore.currency
      : 'USD'
  ) as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  const initialDeduction = Number(
    plan.monthlyDeduction ?? plan.monthlyContribution ?? 50
  )
  const [deductionAmount, setDeductionAmount] = useState<string>(
    initialDeduction.toString()
  )
  const [sourceBalance, setSourceBalance] = useState<ReserveSourceBalance>(
    plan.sourceBalance || 'BASELINE_INCOME'
  )
  const isInitiallyFixed =
    typeof plan.targetCycleWindow === 'number' ||
    (typeof plan.targetCycleWindow === 'string' &&
      plan.targetCycleWindow !== 'PERPETUAL' &&
      !isNaN(Number(plan.targetCycleWindow)))

  const [scheduleType, setScheduleType] = useState<'PERPETUAL' | 'FIXED_MONTHS'>(
    isInitiallyFixed ? 'FIXED_MONTHS' : 'PERPETUAL'
  )
  const [fixedMonths, setFixedMonths] = useState<number>(
    isInitiallyFixed ? Number(plan.targetCycleWindow) : 6
  )
  const [status, setStatus] = useState<'ACTIVE' | 'PAUSED'>(
    plan.status === 'PAUSED' || plan.status === 'paused' ? 'PAUSED' : 'ACTIVE'
  )

  useEffect(() => {
    if (isOpen) {
      const amt = Number(plan.monthlyDeduction ?? plan.monthlyContribution ?? 50)
      setDeductionAmount(amt.toString())
      setSourceBalance(plan.sourceBalance || 'BASELINE_INCOME')
      const isFixed =
        typeof plan.targetCycleWindow === 'number' ||
        (typeof plan.targetCycleWindow === 'string' &&
          plan.targetCycleWindow !== 'PERPETUAL' &&
          !isNaN(Number(plan.targetCycleWindow)))
      setScheduleType(isFixed ? 'FIXED_MONTHS' : 'PERPETUAL')
      setFixedMonths(isFixed ? Number(plan.targetCycleWindow) : 6)
      setStatus(
        plan.status === 'PAUSED' || plan.status === 'paused' ? 'PAUSED' : 'ACTIVE'
      )
    }
  }, [isOpen, plan])

  if (!isOpen) return null

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericCut = Math.max(0, parseFloat(deductionAmount) || 0)
    const cycleWindow =
      scheduleType === 'PERPETUAL' ? 'PERPETUAL' : fixedMonths

    const now = new Date()
    const currentMonthKey = now.toISOString().slice(0, 7)

    await onSave({
      monthlyDeduction: numericCut,
      monthlyContribution: numericCut,
      sourceBalance,
      targetCycleWindow: cycleWindow,
      status,
      cutDay: salaryDay,
      pausedMonth: status === 'PAUSED' ? currentMonthKey : null,
      pausedAt: status === 'PAUSED' ? now.toISOString() : null,
    })
    onClose()
  }

  // Monthly cut options requested by user: $5, 10, 30, 50, 100, 200
  const presets = [5, 10, 30, 50, 100, 200]

  // Date info for the pause message
  const today = new Date()
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'long' })
  const currentDayAndYear = today.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })
  const fullMonthAndDate = `${currentMonthName} ${currentDayAndYear}`

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#17181D] border-l border-white/[0.06] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-white/[0.04] flex items-center justify-between">
            <div>
              <h2 className="text-[1.1rem] font-semibold text-white tracking-tight">
                Save for Life Settings
              </h2>
              <p className="text-xs text-[#8E92A0] mt-0.5">
                Configure your automated perpetual buffer cut
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleApply} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Monthly Deduction Cut Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Monthly Cut ({config.symbol}/month)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  {config.symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  placeholder="50"
                  className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-[#121316] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8E92A0]">
                  / month
                </span>
              </div>

              {/* Quick Presets: $5, 10, 30, 50, 100, 200 */}
              <div className="grid grid-cols-6 gap-1.5 mt-2.5">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDeductionAmount(preset.toString())}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center',
                      deductionAmount === preset.toString()
                        ? 'bg-[#F7B668]/15 border-[#F7B668]/30 text-[#F7B668]'
                        : 'bg-[#121316] border-white/[0.05] text-[#8E92A0] hover:text-white'
                    )}
                  >
                    {config.symbol}{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Selector: Baseline vs Balance */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Deduct Funds From
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setSourceBalance('BASELINE_INCOME')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3',
                    sourceBalance === 'BASELINE_INCOME'
                      ? 'bg-[#1E2028] border-amber-500/40'
                      : 'bg-[#121316] border-white/[0.04] text-[#8E92A0] hover:border-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                      sourceBalance === 'BASELINE_INCOME'
                        ? 'border-[#F7B668] bg-[#F7B668]'
                        : 'border-slate-500'
                    )}
                  >
                    {sourceBalance === 'BASELINE_INCOME' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#121316]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">
                      Monthly Baseline Income
                    </span>
                    <span className="text-[11px] text-[#8E92A0] block mt-0.5">
                      Set aside from your baseline salary before daily spending limits.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceBalance('LIQUID_BALANCE')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3',
                    sourceBalance === 'LIQUID_BALANCE'
                      ? 'bg-[#1E2028] border-amber-500/40'
                      : 'bg-[#121316] border-white/[0.04] text-[#8E92A0] hover:border-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                      sourceBalance === 'LIQUID_BALANCE'
                        ? 'border-[#F7B668] bg-[#F7B668]'
                        : 'border-slate-500'
                    )}
                  >
                    {sourceBalance === 'LIQUID_BALANCE' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#121316]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">
                      Liquid Surplus
                    </span>
                    <span className="text-[11px] text-[#8E92A0] block mt-0.5">
                      Drawn directly from unallocated cash reserves across cycles.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Cycle Schedule Duration */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Schedule Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('PERPETUAL')}
                  className={cn(
                    'py-2.5 px-3 rounded-xl border text-xs text-left transition-all cursor-pointer',
                    scheduleType === 'PERPETUAL'
                      ? 'bg-[#1E2028] border-amber-500/40 text-white font-medium'
                      : 'bg-[#121316] border-white/[0.04] text-[#8E92A0] hover:text-white'
                  )}
                >
                  <span className="block">Perpetual</span>
                  <span className="text-[10px] text-[#8E92A0] block mt-0.5">
                    Ongoing until paused
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('FIXED_MONTHS')}
                  className={cn(
                    'py-2.5 px-3 rounded-xl border text-xs text-left transition-all cursor-pointer',
                    scheduleType === 'FIXED_MONTHS'
                      ? 'bg-[#1E2028] border-amber-500/40 text-white font-medium'
                      : 'bg-[#121316] border-white/[0.04] text-[#8E92A0] hover:text-white'
                  )}
                >
                  <span className="block">Fixed Window</span>
                  <span className="text-[10px] text-[#8E92A0] block mt-0.5">
                    Active for N months
                  </span>
                </button>
              </div>

              {scheduleType === 'FIXED_MONTHS' && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-[#121316] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-[#8E92A0]">Duration:</span>
                  <div className="flex items-center gap-1.5">
                    {[3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFixedMonths(m)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                          fixedMonths === m
                            ? 'bg-[#F7B668]/20 border-[#F7B668]/40 text-[#F7B668]'
                            : 'bg-[#17181D] border-white/[0.05] text-[#8E92A0] hover:text-white'
                        )}
                      >
                        {m} mo
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cut from Balance Day (from Settings state) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Cut from Balance Day
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate('/settings')
                  }}
                  className="text-[11px] text-[#F7B668] hover:underline cursor-pointer font-medium"
                >
                  Change from settings
                </button>
              </div>
              <div className="py-2.5 px-3.5 rounded-xl bg-[#121316] border border-white/[0.08] text-white text-xs flex items-center justify-between">
                <span className="font-medium text-white">
                  {getDayWithSuffix(salaryDay)} of each month
                </span>
                <span className="text-[11px] text-[#8E92A0]">
                  Payday / Salary Day
                </span>
              </div>
            </div>

            {/* Lifecycle State (Pause / Active) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Lifecycle State
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('ACTIVE')}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                    status === 'ACTIVE'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#121316] border-white/[0.04] text-[#8E92A0] hover:text-white'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('PAUSED')}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                    status === 'PAUSED'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-[#121316] border-white/[0.04] text-[#8E92A0] hover:text-white'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Paused</span>
                </button>
              </div>

              {/* Pause Notification Message: simple, unobtrusive text */}
              {status === 'PAUSED' && (
                <p className="text-[11px] text-[#FBBF24] mt-2 leading-relaxed">
                  Paused for this {fullMonthAndDate}. Can be unpaused anytime; auto-unpauses next month.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/[0.04] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isMutating}
                className="px-5 py-2 rounded-xl bg-[#F7B668] hover:bg-[#ffc47d] text-[#111215] font-semibold text-xs tracking-tight shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SystemReserveDrawer

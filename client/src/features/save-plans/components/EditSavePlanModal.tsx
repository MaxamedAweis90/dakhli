import React, { useState, useEffect } from 'react'
import { X, Pencil, Calendar, Check } from 'lucide-react'
import type { SavePlan } from '../types/savePlan.types'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import { useLiquidityStore } from '@/stores/liquidityStore'
import {
  CURRENCY_CONFIGS,
  type CurrencyCode,
} from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

interface EditSavePlanModalProps {
  isOpen: boolean
  onClose: () => void
  plan: SavePlan | null
  onSave: (id: string, updates: Partial<SavePlan>) => Promise<any> | void
  isSubmitting?: boolean
}

export const EditSavePlanModal: React.FC<EditSavePlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSave,
  isSubmitting = false,
}) => {
  const { baseline } = useBaseline()
  const salaryDay = baseline?.paydayAnchorDay ?? 25

  const liquidityStore = useLiquidityStore()
  const currentCode = (
    liquidityStore.currency in CURRENCY_CONFIGS
      ? liquidityStore.currency
      : 'USD'
  ) as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  const [targetAmount, setTargetAmount] = useState('')
  const [alreadySaved, setAlreadySaved] = useState('')
  const [isSavedUnlocked, setIsSavedUnlocked] = useState(false)
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false)
  const [monthlyCut, setMonthlyCut] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [isManualDate, setIsManualDate] = useState(false)

  // Initialize form when opened or plan changes
  useEffect(() => {
    if (isOpen && plan) {
      setTargetAmount(plan.targetAmount?.toString() || '')
      const current =
        plan.currentAmount !== undefined
          ? plan.currentAmount
          : plan.currentSaved !== undefined
          ? plan.currentSaved
          : 0
      setAlreadySaved(current.toString())
      const cut = plan.monthlyDeduction ?? plan.monthlyContribution ?? ''
      setMonthlyCut(cut ? cut.toString() : '')
      setTargetDate(plan.targetDate ? plan.targetDate.slice(0, 10) : '')
      setIsManualDate(Boolean(plan.targetDate))
      setIsSavedUnlocked(false)
      setShowUnlockConfirm(false)
    }
  }, [isOpen, plan])

  // Auto-calculate completion date when targetAmount, alreadySaved, or monthlyCut changes
  useEffect(() => {
    if (isManualDate) return

    const target = parseFloat(targetAmount) || 0
    const saved = parseFloat(alreadySaved) || 0
    const cut = parseFloat(monthlyCut) || 0
    const remaining = Math.max(0, target - saved)

    if (target > 0 && cut > 0 && remaining > 0) {
      const fullMonths = Math.floor(remaining / cut)
      const remainder = Number((remaining - fullMonths * cut).toFixed(2))
      const totalMonths = remainder > 0.001 ? fullMonths + 1 : fullMonths

      const today = new Date()
      const todayDay = today.getDate()
      const startOffset = todayDay > salaryDay ? 1 : 0
      const finishMonthIdx = today.getMonth() + startOffset + (totalMonths - 1)
      const finishDate = new Date(today.getFullYear(), finishMonthIdx, salaryDay)

      const yyyy = finishDate.getFullYear()
      const mm = String(finishDate.getMonth() + 1).padStart(2, '0')
      const dd = String(finishDate.getDate()).padStart(2, '0')
      setTargetDate(`${yyyy}-${mm}-${dd}`)
    } else if (!monthlyCut) {
      setTargetDate('')
    }
  }, [targetAmount, alreadySaved, monthlyCut, salaryDay, isManualDate])

  const getCalculationSummary = (): string | null => {
    const target = parseFloat(targetAmount) || 0
    const saved = parseFloat(alreadySaved) || 0
    const cut = parseFloat(monthlyCut) || 0
    const remaining = Math.max(0, target - saved)

    if (target > 0 && saved >= target) {
      return `Target goal already fulfilled (${config.symbol}${saved} saved of ${config.symbol}${target}).`
    }

    if (target > 0 && cut > 0 && remaining > 0) {
      const fullMonths = Math.floor(remaining / cut)
      const remainder = Number((remaining - fullMonths * cut).toFixed(2))
      const totalMonths = remainder > 0.001 ? fullMonths + 1 : fullMonths
      const finalCut = remainder > 0.001 ? remainder : cut

      if (remainder > 0.001) {
        return `Completion in ${totalMonths} months (${fullMonths} × ${config.symbol}${cut} + final month of ${config.symbol}${finalCut})`
      }
      return `Completion in ${totalMonths} months (${totalMonths} × ${config.symbol}${cut}/mo)`
    }
    return null
  }

  if (!isOpen || !plan) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(targetAmount) || plan.targetAmount
    const saved = isSavedUnlocked
      ? Math.max(0, parseFloat(alreadySaved) || 0)
      : (plan.currentAmount ?? plan.currentSaved ?? 0)
    const cut = parseFloat(monthlyCut) || 0

    await onSave(plan.id, {
      targetAmount: target,
      currentSaved: saved,
      currentAmount: saved,
      monthlyContribution: cut > 0 ? cut : undefined,
      monthlyDeduction: cut > 0 ? cut : undefined,
      targetDate: targetDate || undefined,
    })

    onClose()
  }

  const calculationSummary = getCalculationSummary()
  const displayTitle = plan.title || plan.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-[1.25rem] bg-[#13151B] border border-white/[0.08] p-6 sm:p-7 shadow-2xl z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1D26] border border-white/[0.06] flex items-center justify-center text-[#F7B668]">
              <Pencil className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-[1.1rem] font-semibold text-white tracking-tight">
                Edit Goal
              </h2>
              <p className="text-xs text-[#8E92A0]">
                {displayTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Target Goal */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Target Goal ({config.symbol})
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={targetAmount}
              onChange={(e) => {
                setTargetAmount(e.target.value)
                setIsManualDate(false)
              }}
              placeholder="e.g. 6000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border border-white/[0.08] text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#F7B668]/50"
            />
          </div>

          {/* Already Saved (Locked by default, unlocked via pen icon after confirmation) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Already Saved ({config.symbol})
              </label>
              {isSavedUnlocked ? (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Editable
                </span>
              ) : (
                <span className="text-[10px] text-[#8E92A0]">
                  Locked (Click pen to edit)
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="number"
                min="0"
                step="any"
                disabled={!isSavedUnlocked}
                value={alreadySaved}
                onChange={(e) => {
                  setAlreadySaved(e.target.value)
                  setIsManualDate(false)
                }}
                placeholder="0"
                className={cn(
                  'w-full pl-3.5 pr-10 py-2.5 rounded-xl border font-mono text-xs transition-colors focus:outline-none',
                  isSavedUnlocked
                    ? 'bg-[#1A1D26] border-[#F7B668]/50 text-white focus:border-[#F7B668]'
                    : 'bg-[#14161F] border-white/[0.05] text-slate-300 cursor-not-allowed opacity-90'
                )}
              />
              <button
                type="button"
                title={isSavedUnlocked ? 'Unlocked' : 'Edit already saved balance'}
                onClick={() => {
                  if (!isSavedUnlocked) {
                    setShowUnlockConfirm(true)
                  }
                }}
                className={cn(
                  'absolute right-2 p-1.5 rounded-lg transition-colors cursor-pointer',
                  isSavedUnlocked
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-[#8E92A0] hover:text-white hover:bg-white/[0.08]'
                )}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Confirmation Box when pen icon is clicked */}
            {showUnlockConfirm && !isSavedUnlocked && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <p className="text-xs text-amber-300 font-medium leading-relaxed">
                  You will be changing the already saved balance. Are you sure?
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSavedUnlocked(true)
                      setShowUnlockConfirm(false)
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#111215] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Yes, Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUnlockConfirm(false)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Cut and Target Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Monthly Cut ({config.symbol}/mo)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={monthlyCut}
                onChange={(e) => {
                  setMonthlyCut(e.target.value)
                  setIsManualDate(false)
                }}
                placeholder="e.g. 300"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border border-white/[0.08] text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#F7B668]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Completion Date</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value)
                  setIsManualDate(true)
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#F7B668]/50 [color-scheme:dark]"
              />
            </div>
          </div>

          {calculationSummary && (
            <p className="text-[11px] text-[#8E92A0]">
              {calculationSummary}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#F7B668] hover:bg-[#ffc47d] text-[#111215] font-semibold text-xs tracking-tight shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditSavePlanModal

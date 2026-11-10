import React, { useState, useEffect } from 'react'
import { X, Target, Link2, Calendar } from 'lucide-react'
import {
  type SavePlanCategory,
  useSavingsStore,
} from '@/stores/savingsStore'
import type { CreateSavePlanPayload } from '../types/savePlan.types'
import { useItemsStore } from '@/stores/itemsStore'
import { useItems } from '@/features/items/hooks/useItems'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import { useLiquidityStore } from '@/stores/liquidityStore'
import {
  CURRENCY_CONFIGS,
  type CurrencyCode,
} from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

interface AddSavePlanModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd?: (payload: CreateSavePlanPayload) => Promise<any> | void
  isSubmitting?: boolean
}

export const AddSavePlanModal: React.FC<AddSavePlanModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isSubmitting = false,
}) => {
  useItems()
  const { addPlan } = useSavingsStore()
  const { items } = useItemsStore()
  const { baseline } = useBaseline()
  const salaryDay = baseline?.paydayAnchorDay ?? 25

  const liquidityStore = useLiquidityStore()
  const currentCode = (
    liquidityStore.currency in CURRENCY_CONFIGS
      ? liquidityStore.currency
      : 'USD'
  ) as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  const [name, setName] = useState('')
  const [category, setCategory] = useState<SavePlanCategory>('emergency')
  const [targetAmount, setTargetAmount] = useState('')
  const [initialSaved, setInitialSaved] = useState('')
  const [monthlyCut, setMonthlyCut] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [isManualDate, setIsManualDate] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')

  // Auto-calculate completion date when targetAmount, initialSaved, or monthlyCut changes
  useEffect(() => {
    if (isManualDate) return

    const target = parseFloat(targetAmount) || 0
    const saved = parseFloat(initialSaved) || 0
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
  }, [targetAmount, initialSaved, monthlyCut, salaryDay, isManualDate])

  const getCalculationSummary = (): string | null => {
    const target = parseFloat(targetAmount) || 0
    const saved = parseFloat(initialSaved) || 0
    const cut = parseFloat(monthlyCut) || 0
    const remaining = Math.max(0, target - saved)

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

  if (!isOpen) return null

  const unboughtItems = items.filter((i) => i.status === 'unbought')

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId)
    const item = items.find((i) => i.id === itemId)
    if (item) {
      setName(item.name)
      setTargetAmount(item.price.toString())
      setCategory('item_funding')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const saved = parseFloat(initialSaved) || 0
    const target = parseFloat(targetAmount) || 1000
    const cut = parseFloat(monthlyCut) || 0

    const linkedItem = selectedItemId
      ? items.find((i) => i.id === selectedItemId)
      : undefined

    if (onAdd) {
      await onAdd({
        title: name.trim(),
        name: name.trim(),
        type: 'targeted',
        category,
        targetAmount: target,
        initialDeposit: saved,
        currentAmount: saved,
        monthlyContribution: cut > 0 ? cut : undefined,
        monthlyDeduction: cut > 0 ? cut : undefined,
        targetDate: targetDate || undefined,
        cutDay: salaryDay,
        linkedItemId: selectedItemId || undefined,
        linkedItemName: linkedItem?.name,
        isPinned: true,
      })
    } else {
      addPlan({
        name: name.trim(),
        type: 'targeted',
        category,
        status: 'active',
        currentSaved: saved,
        targetAmount: target,
        monthlyContribution: cut > 0 ? cut : undefined,
        monthlyDeduction: cut > 0 ? cut : undefined,
        targetDate: targetDate || undefined,
        linkedItemId: selectedItemId || undefined,
        linkedItemName: linkedItem?.name,
        isPinned: true,
      })
    }

    // Reset and close
    setName('')
    setTargetAmount('')
    setInitialSaved('')
    setMonthlyCut('')
    setTargetDate('')
    setIsManualDate(false)
    setSelectedItemId('')
    onClose()
  }

  const calculationSummary = getCalculationSummary()

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
              <Target className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-[1.1rem] font-semibold text-white tracking-tight">
                New Targeted Goal
              </h2>
              <p className="text-xs text-[#8E92A0]">
                Configure a concrete target-based savings bucket
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
          {/* Plan Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 6-Month Rent Runway, New Laptop, Car Downpayment"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#F7B668]/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Goal Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['emergency', 'general', 'item_funding'] as SavePlanCategory[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'py-2 px-2.5 rounded-xl text-xs font-medium capitalize border transition-all cursor-pointer text-center',
                      category === cat
                        ? 'bg-[#F7B668]/15 border-[#F7B668]/40 text-[#F7B668]'
                        : 'bg-[#1A1D26] border-white/[0.05] text-slate-400 hover:text-white hover:border-white/10'
                    )}
                  >
                    {cat === 'item_funding'
                      ? 'Item Funding'
                      : cat === 'emergency'
                        ? 'Emergency'
                        : 'Target Reserve'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* If Item Funding: Link to Registry Item */}
          {category === 'item_funding' && (
            <div className="p-3.5 rounded-xl bg-[#1A1D26] border border-white/[0.06]">
              <label className="block text-xs font-medium text-indigo-300 mb-1.5 flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Link from Registry Items</span>
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#13151B] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                <option value="">-- Choose an item to fund --</option>
                {unboughtItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (${item.price.toLocaleString()}) - {item.tier}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Amount and Initial Saved */}
          <div className="grid grid-cols-2 gap-3">
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
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="e.g. 6000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border border-white/[0.08] text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#F7B668]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Initial Saved ({config.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={initialSaved}
                onChange={(e) => setInitialSaved(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border border-white/[0.08] text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#F7B668]/50"
              />
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSavePlanModal

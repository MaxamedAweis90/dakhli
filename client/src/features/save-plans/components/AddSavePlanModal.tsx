import React, { useState, useEffect } from 'react'
import { X, Target, Calendar, Link2 } from 'lucide-react'
import type { CreateSavePlanPayload, SavePlanCategory } from '../types/savePlan.types'
import type { RegistryItem } from '@/features/items/types/item.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { useSavingsStore } from '@/stores/savingsStore'
import { cn } from '@/lib/utils'
import { useFormValidation } from '@/hooks/useFormValidation'
import { savePlanFormSchema } from '../schemas/savePlanSchemas'
import type { ApiError } from '@/types/api'

export interface AddSavePlanModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd?: (payload: CreateSavePlanPayload) => Promise<any> | void
  salaryDay?: number
  items?: RegistryItem[]
  isSubmitting?: boolean
}

export const AddSavePlanModal: React.FC<AddSavePlanModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  salaryDay = 1,
  items = [],
  isSubmitting = false,
}) => {
  const store = useLiquidityStore()
  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]
  const { addPlan } = useSavingsStore()

  const [isManualDate, setIsManualDate] = useState(false)

  const {
    values,
    errors,
    touched,
    generalError,
    handleChange,
    handleBlur,
    setFieldValue,
    validate,
    setServerErrors,
    setGeneralError,
    reset,
  } = useFormValidation(
    savePlanFormSchema,
    {
      name: '',
      category: 'emergency' as SavePlanCategory,
      targetAmount: '',
      initialSaved: '',
      monthlyCut: '',
      targetDate: '',
      selectedItemId: '',
    },
    { validateOnChange: true, validateOnBlur: true }
  )

  // Auto-calculate completion date when targetAmount, initialSaved, or monthlyCut changes
  useEffect(() => {
    if (isManualDate) return

    const target = parseFloat(values.targetAmount) || 0
    const saved = parseFloat(values.initialSaved) || 0
    const cut = parseFloat(values.monthlyCut) || 0
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
      setFieldValue('targetDate', `${yyyy}-${mm}-${dd}`)
    } else if (!values.monthlyCut) {
      setFieldValue('targetDate', '')
    }
  }, [values.targetAmount, values.initialSaved, values.monthlyCut, salaryDay, isManualDate, setFieldValue])

  const getCalculationSummary = (): string | null => {
    const target = parseFloat(values.targetAmount) || 0
    const saved = parseFloat(values.initialSaved) || 0
    const cut = parseFloat(values.monthlyCut) || 0
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
    setFieldValue('selectedItemId', itemId)
    const item = items.find((i) => i.id === itemId)
    if (item) {
      setFieldValue('name', item.name)
      setFieldValue('targetAmount', item.price.toString())
      setFieldValue('category', 'item_funding')
    }
  }

  const handleClose = () => {
    reset()
    setIsManualDate(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = validate()
    if (!isValid) return

    const saved = parseFloat(values.initialSaved) || 0
    const target = parseFloat(values.targetAmount)
    const cut = parseFloat(values.monthlyCut) || 0

    const linkedItem = values.selectedItemId
      ? items.find((i) => i.id === values.selectedItemId)
      : undefined

    try {
      if (onAdd) {
        await onAdd({
          title: values.name.trim(),
          name: values.name.trim(),
          type: 'targeted',
          category: values.category,
          targetAmount: target,
          initialDeposit: saved,
          currentAmount: saved,
          monthlyContribution: cut > 0 ? cut : undefined,
          monthlyDeduction: cut > 0 ? cut : undefined,
          targetDate: values.targetDate || undefined,
          cutDay: salaryDay,
          linkedItemId: values.selectedItemId || undefined,
          linkedItemName: linkedItem?.name,
          isPinned: true,
        })
      } else {
        addPlan({
          name: values.name.trim(),
          type: 'targeted',
          category: values.category,
          status: 'active',
          currentSaved: saved,
          targetAmount: target,
          monthlyContribution: cut > 0 ? cut : undefined,
          monthlyDeduction: cut > 0 ? cut : undefined,
          targetDate: values.targetDate || undefined,
          linkedItemId: values.selectedItemId || undefined,
          linkedItemName: linkedItem?.name,
          isPinned: true,
        })
      }

      handleClose()
    } catch (err: any) {
      const apiErr = err as ApiError
      if (apiErr?.fieldErrors && Object.keys(apiErr.fieldErrors).length > 0) {
        setServerErrors(apiErr.fieldErrors, apiErr.message)
      } else {
        setGeneralError(apiErr?.message || 'Failed to create goal.')
      }
    }
  }

  const calculationSummary = getCalculationSummary()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#13151B] border border-white/[0.08] shadow-2xl p-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7B668]/15 border border-[#F7B668]/30 flex items-center justify-center text-[#F7B668]">
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
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {generalError && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-5">
          {/* Plan Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. 6-Month Rent Runway, New Laptop, Car Downpayment"
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border text-white text-xs placeholder:text-slate-500 focus:outline-none transition-colors',
                errors.name && (touched.name || errors.name)
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/[0.08] focus:border-[#F7B668]/50'
              )}
            />
            {errors.name && (touched.name || errors.name) && (
              <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.name}</p>
            )}
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
                    onClick={() => handleChange('category', cat)}
                    className={cn(
                      'py-2 px-2.5 rounded-xl text-xs font-medium capitalize border transition-all cursor-pointer text-center',
                      values.category === cat
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
          {values.category === 'item_funding' && (
            <div className="p-3.5 rounded-xl bg-[#1A1D26] border border-white/[0.06]">
              <label className="block text-xs font-medium text-indigo-300 mb-1.5 flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Link from Registry Items</span>
              </label>
              <select
                value={values.selectedItemId}
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
                min="0.01"
                step="any"
                value={values.targetAmount}
                onChange={(e) => handleChange('targetAmount', e.target.value)}
                onBlur={() => handleBlur('targetAmount')}
                placeholder="e.g. 6000"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none transition-colors',
                  errors.targetAmount && (touched.targetAmount || errors.targetAmount)
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/[0.08] focus:border-[#F7B668]/50'
                )}
              />
              {errors.targetAmount && (touched.targetAmount || errors.targetAmount) && (
                <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.targetAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Initial Saved ({config.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={values.initialSaved}
                onChange={(e) => handleChange('initialSaved', e.target.value)}
                onBlur={() => handleBlur('initialSaved')}
                placeholder="e.g. 1000"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none transition-colors',
                  errors.initialSaved && (touched.initialSaved || errors.initialSaved)
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/[0.08] focus:border-[#F7B668]/50'
                )}
              />
              {errors.initialSaved && (touched.initialSaved || errors.initialSaved) && (
                <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.initialSaved}</p>
              )}
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
                value={values.monthlyCut}
                onChange={(e) => {
                  handleChange('monthlyCut', e.target.value)
                  setIsManualDate(false)
                }}
                onBlur={() => handleBlur('monthlyCut')}
                placeholder="e.g. 300"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none transition-colors',
                  errors.monthlyCut && (touched.monthlyCut || errors.monthlyCut)
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/[0.08] focus:border-[#F7B668]/50'
                )}
              />
              {errors.monthlyCut && (touched.monthlyCut || errors.monthlyCut) && (
                <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.monthlyCut}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Completion Date</span>
              </label>
              <input
                type="date"
                value={values.targetDate}
                onChange={(e) => {
                  handleChange('targetDate', e.target.value)
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
              onClick={handleClose}
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

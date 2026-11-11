import React, { useEffect } from 'react'
import { X, KeyRound, Home, Wifi, Dumbbell, Zap, Shield, Music } from 'lucide-react'
import type { OverheadBill, UpdateOverheadPayload } from '../types/overhead.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'
import { useFormValidation } from '@/hooks/useFormValidation'
import { overheadFormSchema } from '../schemas/overheadSchemas'
import type { ApiError } from '@/types/api'

export interface EditBillModalProps {
  isOpen: boolean
  bill: OverheadBill | null
  onClose: () => void
  onSave: (id: string, payload: UpdateOverheadPayload) => Promise<any> | void
  isSubmitting?: boolean
}

const CATEGORIES: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'home', label: 'Housing', icon: Home },
  { key: 'key', label: 'Rent', icon: KeyRound },
  { key: 'wifi', label: 'Internet', icon: Wifi },
  { key: 'dumbbell', label: 'Fitness', icon: Dumbbell },
  { key: 'flash', label: 'Utilities', icon: Zap },
  { key: 'shield', label: 'Insurance', icon: Shield },
  { key: 'music', label: 'Subscription', icon: Music },
]

export const EditBillModal: React.FC<EditBillModalProps> = ({
  isOpen,
  bill,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  const store = useLiquidityStore()
  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  const {
    values,
    errors,
    touched,
    generalError,
    handleChange,
    handleBlur,
    validate,
    setServerErrors,
    setGeneralError,
    reset,
  } = useFormValidation(
    overheadFormSchema,
    {
      title: '',
      amount: '',
      dueDay: '1',
      category: 'home',
      notes: '',
    },
    { validateOnChange: true, validateOnBlur: true }
  )

  useEffect(() => {
    if (bill && isOpen) {
      reset({
        title: bill.title || '',
        amount: String(bill.amount ?? ''),
        dueDay: String(bill.dueDay ?? '1'),
        category: bill.iconKey || 'home',
        notes: bill.notes || '',
      })
    }
  }, [bill, isOpen, reset])

  if (!isOpen || !bill) return null

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = validate()
    if (!isValid) return

    try {
      await onSave(bill.id, {
        title: values.title.trim(),
        amount: Number(values.amount),
        dueDay: Number(values.dueDay),
        iconKey: values.category,
        notes: values.notes?.trim() || undefined,
      })

      handleClose()
    } catch (err: any) {
      const apiErr = err as ApiError
      if (apiErr?.fieldErrors && Object.keys(apiErr.fieldErrors).length > 0) {
        setServerErrors(apiErr.fieldErrors, apiErr.message)
      } else {
        setGeneralError(apiErr?.message || 'Failed to update overhead bill.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-[1.5rem] bg-[#17181D] border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.6)] p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <h3 className="text-[1.15rem] font-semibold tracking-tight text-white">
            Edit Overhead Bill
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-[#22242D] hover:bg-[#2C2F3B] text-[#9A9EAF] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {generalError && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {generalError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
              Bill Name
            </label>
            <input
              type="text"
              placeholder="e.g. Rent, Gym, Internet, Apple Music"
              value={values.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              className={cn(
                'w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border text-white text-[0.88rem] outline-none transition-colors',
                errors.title && (touched.title || errors.title)
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/[0.06] focus:border-[#F7B668]'
              )}
            />
            {errors.title && (touched.title || errors.title) && (
              <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
                Amount ({config.symbol})
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="0.00"
                value={values.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                onBlur={() => handleBlur('amount')}
                className={cn(
                  'w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border text-white text-[0.88rem] outline-none transition-colors',
                  errors.amount && (touched.amount || errors.amount)
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/[0.06] focus:border-[#F7B668]'
                )}
              />
              {errors.amount && (touched.amount || errors.amount) && (
                <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
                Due Day of Month (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 1, 15, 25"
                value={values.dueDay}
                onChange={(e) => handleChange('dueDay', e.target.value)}
                onBlur={() => handleBlur('dueDay')}
                className={cn(
                  'w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border text-white text-[0.88rem] outline-none transition-colors',
                  errors.dueDay && (touched.dueDay || errors.dueDay)
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/[0.06] focus:border-[#F7B668]'
                )}
              />
              {errors.dueDay && (touched.dueDay || errors.dueDay) && (
                <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.dueDay}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
              Category Icon
            </label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSelected = values.category === cat.key
                return (
                  <button
                    key={cat.key}
                    type="button"
                    title={cat.label}
                    onClick={() => handleChange('category', cat.key)}
                    className={cn(
                      'flex-1 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border',
                      isSelected
                        ? 'bg-[#F7B668]/15 border-[#F7B668] text-[#F7B668]'
                        : 'bg-[#1E2028] border-white/[0.04] text-[#9A9EAF] hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Split with roommate, autopay enabled"
              value={values.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              onBlur={() => handleBlur('notes')}
              className={cn(
                'w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border text-white text-[0.88rem] outline-none transition-colors',
                errors.notes && (touched.notes || errors.notes)
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/[0.06] focus:border-[#F7B668]'
              )}
            />
            {errors.notes && (touched.notes || errors.notes) && (
              <p className="text-[11px] text-red-400 mt-1 pl-1">{errors.notes}</p>
            )}
          </div>

          <div className="pt-3 flex gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="flex-1 h-11 rounded-xl bg-[#1E2028] hover:bg-[#252833] text-[#9A9EAF] hover:text-white text-[0.85rem] font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#F7B668] to-[#EEA850] text-[#1B1C20] font-semibold text-[0.85rem] shadow-[0_0_16px_rgba(247,182,104,0.3)] hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBillModal

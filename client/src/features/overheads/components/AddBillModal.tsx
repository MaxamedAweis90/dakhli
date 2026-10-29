import React, { useState } from 'react'
import { X, KeyRound, Home, Wifi, Dumbbell, Zap, Shield, Music } from 'lucide-react'
import type { CreateOverheadPayload } from '../types/overhead.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

export interface AddBillModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (payload: CreateOverheadPayload) => Promise<any> | void
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

export const AddBillModal: React.FC<AddBillModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isSubmitting = false,
}) => {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('1')
  const [category, setCategory] = useState<string>('home')
  const [notes, setNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const store = useLiquidityStore()
  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const numericAmount = parseFloat(amount)
    const numericDueDay = parseInt(dueDay, 10)

    if (!title.trim()) {
      setErrorMsg('Please enter a bill title.')
      return
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.')
      return
    }
    if (isNaN(numericDueDay) || numericDueDay < 1 || numericDueDay > 31) {
      setErrorMsg('Due day must be between 1 and 31.')
      return
    }

    try {
      await onAdd({
        title: title.trim(),
        amount: numericAmount,
        dueDay: numericDueDay,
        iconKey: category,
        notes: notes.trim() || undefined,
        isRecurring: true,
      })

      setTitle('')
      setAmount('')
      setDueDay('1')
      setCategory('home')
      setNotes('')
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create overhead bill.')
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
            Add Overhead Bill
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-[#22242D] hover:bg-[#2C2F3B] text-[#9A9EAF] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
              Bill Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rent, Gym, Internet, Apple Music"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border border-white/[0.06] text-white text-[0.88rem] outline-none focus:border-[#F7B668] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
                Amount ({config.symbol})
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border border-white/[0.06] text-white text-[0.88rem] outline-none focus:border-[#F7B668] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
                Due Day of Month (1-31)
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                placeholder="e.g. 1, 15, 25"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border border-white/[0.06] text-white text-[0.88rem] outline-none focus:border-[#F7B668] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.78rem] font-medium text-[#9A9EAF] mb-1.5">
              Category Icon
            </label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSelected = category === cat.key
                return (
                  <button
                    key={cat.key}
                    type="button"
                    title={cat.label}
                    onClick={() => setCategory(cat.key)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#1E2028] border border-white/[0.06] text-white text-[0.88rem] outline-none focus:border-[#F7B668] transition-colors"
            />
          </div>

          <div className="pt-3 flex gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-[#1E2028] hover:bg-[#252833] text-[#9A9EAF] hover:text-white text-[0.85rem] font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#F7B668] to-[#EEA850] text-[#1B1C20] font-semibold text-[0.85rem] shadow-[0_0_16px_rgba(247,182,104,0.3)] hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBillModal

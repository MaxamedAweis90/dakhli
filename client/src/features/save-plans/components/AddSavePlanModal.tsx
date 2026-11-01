import React, { useState } from 'react'
import { X, Target, Link2, Calendar } from 'lucide-react'
import {
  type SavePlanCategory,
  useSavingsStore,
} from '@/stores/savingsStore'
import type { CreateSavePlanPayload } from '../types/savePlan.types'
import { useItemsStore } from '@/stores/itemsStore'
import { useItems } from '@/features/items/hooks/useItems'
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

  const [name, setName] = useState('')
  const [category, setCategory] = useState<SavePlanCategory>('emergency')
  const [targetAmount, setTargetAmount] = useState('')
  const [initialSaved, setInitialSaved] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')

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
        targetDate: targetDate || undefined,
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
    setTargetDate('')
    setSelectedItemId('')
    onClose()
  }

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
                Target Goal ($)
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
                Initial Saved ($)
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

          {/* Target Deadline (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Completion Date (Optional)</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D26] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#F7B668]/50 [color-scheme:dark]"
            />
          </div>

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

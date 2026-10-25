import React, { useState } from 'react'
import { X, Target, PiggyBank, Link2 } from 'lucide-react'
import {
  type SavePlanCategory,
  type SavePlanType,
  useSavingsStore,
} from '@/stores/savingsStore'
import { useItemsStore } from '@/stores/itemsStore'
import { cn } from '@/lib/utils'

interface AddSavePlanModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AddSavePlanModal: React.FC<AddSavePlanModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addPlan } = useSavingsStore()
  const { items } = useItemsStore()

  const [planType, setPlanType] = useState<SavePlanType>('targeted')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SavePlanCategory>('emergency')
  const [targetAmount, setTargetAmount] = useState('')
  const [initialSaved, setInitialSaved] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('200')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const saved = parseFloat(initialSaved) || 0
    const target = parseFloat(targetAmount) || 1000
    const monthly = parseFloat(monthlyContribution) || 200

    const linkedItem = selectedItemId
      ? items.find((i) => i.id === selectedItemId)
      : undefined

    addPlan({
      name: name.trim(),
      type: planType,
      category,
      status: 'active',
      currentSaved: saved,
      targetAmount: target,
      monthlyContribution: planType === 'general_life' ? monthly : undefined,
      linkedItemId: selectedItemId || undefined,
      linkedItemName: linkedItem?.name,
      isPinned: false,
    })

    // Reset and close
    setName('')
    setTargetAmount('')
    setInitialSaved('')
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
      <div className="relative w-full max-w-lg rounded-[1.25rem] bg-[#17181D] border border-white/10 p-6 sm:p-7 shadow-2xl z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Add Save Plan
              </h2>
              <p className="text-xs text-[#8E92A0]">
                Create a targeted goal or core reserve
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

        {/* Tab Selection: Targeted vs Save for Life */}
        <div className="grid grid-cols-2 gap-2 mt-5 p-1 rounded-2xl bg-[#121316] border border-white/[0.05]">
          <button
            type="button"
            onClick={() => setPlanType('targeted')}
            className={cn(
              'flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              planType === 'targeted'
                ? 'bg-[#22242C] text-white shadow-sm border border-white/10'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Targeted Goal</span>
          </button>

          <button
            type="button"
            onClick={() => setPlanType('general_life')}
            className={cn(
              'flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              planType === 'general_life'
                ? 'bg-[#22242C] text-white shadow-sm border border-white/10'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Save for Life (Core Reserve)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Plan Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Plan Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                planType === 'targeted'
                  ? 'e.g., 6-Month Rent Runway, New Laptop'
                  : 'e.g., General Emergency Cushion'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D24] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          {/* Category */}
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
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-[#1A1D24] border-white/[0.05] text-slate-400 hover:text-white hover:border-white/10'
                  )}
                >
                  {cat === 'item_funding'
                    ? 'Item Funding'
                    : cat === 'emergency'
                      ? 'Emergency'
                      : 'General'}
                </button>
              )
            )}
          </div>

          {/* If Item Funding: Link to Registry Item */}
          {category === 'item_funding' && (
            <div className="p-3 rounded-xl bg-[#121316] border border-white/[0.06]">
              <label className="block text-xs font-medium text-indigo-300 mb-1.5 flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Link from Registry Items</span>
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-400"
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

          {/* Dynamic Inputs Based on Type */}
          {planType === 'targeted' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Goal ($)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g. 6000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D24] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Initial Saved ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialSaved}
                  onChange={(e) => setInitialSaved(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D24] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Initial Reserve ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialSaved}
                  onChange={(e) => setInitialSaved(e.target.value)}
                  placeholder="e.g. 3200"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D24] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Monthly Inflow ($/mo)
                </label>
                <input
                  type="number"
                  min="0"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1D24] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>
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
              className="px-5 py-2 rounded-xl bg-[#F7B668] hover:bg-[#ffc47d] text-[#111215] font-semibold text-xs tracking-tight shadow-md transition-all cursor-pointer"
            >
              Create Save Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSavePlanModal

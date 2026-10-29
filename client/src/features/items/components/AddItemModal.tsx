import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { ItemTier } from '@/stores/itemsStore'
import type { CreateItemPayload } from '../types/item.types'
import { cn } from '@/lib/utils'

export interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (payload: CreateItemPayload) => Promise<any> | void
  isSubmitting?: boolean
}

const PRESET_IMAGES = [
  { label: 'Gaming (PS5)', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80' },
  { label: 'Vehicle (Motorbike)', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80' },
  { label: 'Workspace (PC)', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80' },
  { label: 'Home / Living', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Hardware', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mobile (Phone)', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80' },
]

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [tier, setTier] = useState<ItemTier>('Wants')
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url)
  const [hasTarget, setHasTarget] = useState(false)
  const [targetProgress, setTargetProgress] = useState('15')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numPrice = parseFloat(price)
    if (!name.trim() || isNaN(numPrice) || numPrice <= 0) return

    await onAdd({
      title: name.trim(),
      name: name.trim(),
      targetPrice: numPrice,
      price: numPrice,
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      tier,
      tag: hasTarget ? 'In Save Plan' : tier,
      targetProgress: hasTarget ? Math.min(100, Math.max(0, parseInt(targetProgress, 10) || 15)) : undefined,
    })

    // Reset form
    setName('')
    setPrice('')
    setTier('Wants')
    setImageUrl(PRESET_IMAGES[0].url)
    setHasTarget(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[1.25rem] bg-[#17181D] border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.6)] p-6 select-none flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
          <div>
            <h3 className="text-[1.18rem] font-semibold text-white tracking-tight">
              Add Wishlist Item
            </h3>
            <p className="text-[0.78rem] text-[#8E92A0] mt-0.5">
              Register a target item to track into your 3-tier wishlist.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#20222B] text-[#8E92A0] hover:text-white flex items-center justify-center border border-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Item Name */}
          <div>
            <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro M3"
              className="w-full h-[2.5rem] px-3.5 rounded-xl bg-[#20222B] border border-white/[0.06] text-white text-[0.875rem] placeholder:text-[#5F6370] outline-none focus:border-[#D4A359]/60 transition-colors"
            />
          </div>

          {/* Price & Tier Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Price */}
            <div>
              <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5">
                Estimated Price ($)
              </label>
              <div className="h-[2.5rem] px-3.5 rounded-xl bg-[#20222B] border border-white/[0.06] flex items-center gap-1 focus-within:border-[#D4A359]/60 transition-colors">
                <span className="text-[0.95rem] font-semibold text-[#8E92A0]">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                  className="w-full bg-transparent text-white text-[0.875rem] outline-none"
                />
              </div>
            </div>

            {/* Tier Selector */}
            <div>
              <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5">
                Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as ItemTier)}
                className="w-full h-[2.5rem] px-3 rounded-xl bg-[#20222B] border border-white/[0.06] text-white text-[0.85rem] outline-none focus:border-[#D4A359]/60 transition-colors cursor-pointer"
              >
                <option value="Essentials">Essentials</option>
                <option value="Future Needs">Future Needs</option>
                <option value="Wants">Wants</option>
              </select>
            </div>
          </div>

          {/* Preset Photo Selector */}
          <div>
            <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5 flex items-center justify-between">
              <span>Photo Preset</span>
              <span className="text-[0.72rem] text-[#8E92A0] font-normal">Select image</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  title={preset.label}
                  className={cn(
                    'aspect-square rounded-xl overflow-hidden border-2 relative transition-all cursor-pointer',
                    imageUrl === preset.url
                      ? 'border-[#D4A359] scale-105 shadow-md'
                      : 'border-white/[0.08] hover:border-white/30 opacity-70 hover:opacity-100'
                  )}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Target Progress Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[0.82rem] text-[#C5C8D4]">
              <input
                type="checkbox"
                checked={hasTarget}
                onChange={(e) => setHasTarget(e.target.checked)}
                className="rounded bg-[#20222B] border-white/20 text-[#D4A359] focus:ring-0 cursor-pointer"
              />
              <span>Set active saving plan target progress %</span>
            </label>

            {hasTarget && (
              <div className="mt-2.5 flex items-center gap-2 pl-6">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetProgress}
                  onChange={(e) => setTargetProgress(e.target.value)}
                  className="w-20 h-[2.1rem] px-2.5 rounded-lg bg-[#20222B] border border-white/[0.08] text-white text-[0.85rem] outline-none"
                />
                <span className="text-[0.8rem] text-[#8E92A0]">% target funded</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={onClose}
              className="h-[2.3rem] px-4 rounded-xl bg-[#20222B] hover:bg-[#282B37] active:scale-95 text-[#A1A1AA] hover:text-white text-[0.825rem] font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[2.3rem] px-5 rounded-xl bg-[#D4A359] hover:bg-[#DEB066] active:scale-95 text-[#18191E] text-[0.825rem] font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddItemModal

import React, { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RecordCheckOffCardProps {
  initialPlannedCap?: number
  initialActualSpend?: number
  initialNotes?: string
  isEditing?: boolean
  title?: string
  onSave: (data: { plannedCap: number; actualSpend: number; notes: string }) => void
  onCancel?: () => void
  className?: string
}

export const RecordCheckOffCard: React.FC<RecordCheckOffCardProps> = ({
  initialPlannedCap = 30,
  initialActualSpend = 20,
  initialNotes = 'Planned cap vs actual spend $20',
  isEditing = false,
  title = 'Record Check-Off',
  onSave,
  onCancel,
  className,
}) => {
  const [plannedCap, setPlannedCap] = useState(initialPlannedCap.toString())
  const [actualSpend, setActualSpend] = useState(initialActualSpend.toString())
  const [notes, setNotes] = useState(initialNotes)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseFloat(plannedCap) || 0
    const a = parseFloat(actualSpend) || 0
    onSave({
      plannedCap: Math.max(0, p),
      actualSpend: Math.max(0, a),
      notes: notes.trim() || `Planned cap vs actual spend $${a}`,
    })
  }

  return (
    <div
      className={cn(
        'relative p-[1.5px] rounded-[1.25rem] bg-gradient-to-br from-[#FCD34D]/60 via-[#6EE7B7]/70 to-[#2DD4BF]/80 shadow-[0_0_28px_rgba(94,234,212,0.18)] transition-all',
        className
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-[calc(1.25rem-1.5px)] bg-[#17181D] px-6 py-5 select-none flex flex-col gap-4"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h3 className="text-[1.12rem] lg:text-[1.18rem] font-semibold text-white tracking-tight">
            {title}
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Options"
              className="w-7 h-7 rounded-full bg-[#20222B] text-[#8E92A0] hover:text-white transition-colors cursor-pointer flex items-center justify-center border border-white/[0.04]"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Form Controls Row */}
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          {/* Planned Cap Field */}
          <div>
            <label className="block text-[0.78rem] font-normal text-[#8E92A0] mb-1.5 tracking-normal">
              Planned cap
            </label>
            <div className="h-[2.5rem] px-3.5 rounded-xl bg-[#20222B] border border-white/[0.06] flex items-center gap-1 focus-within:border-[#5EEAD4]/50 transition-colors">
              <span className="text-[1.05rem] font-semibold text-white/90 select-none">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={plannedCap}
                onChange={(e) => setPlannedCap(e.target.value)}
                className="w-14 bg-transparent text-[1.05rem] font-semibold text-white outline-none"
              />
            </div>
          </div>

          {/* VS Divider Text */}
          <span className="text-[0.82rem] font-medium text-[#8E92A0] pb-2.5 px-1 select-none">
            vs
          </span>

          {/* Actual Spend Field */}
          <div>
            <label className="block text-[0.78rem] font-normal text-[#8E92A0] mb-1.5 tracking-normal">
              Actual spend
            </label>
            <div className="h-[2.5rem] px-3.5 rounded-xl bg-[#20222B] border border-white/[0.06] flex items-center gap-1 focus-within:border-[#5EEAD4]/50 transition-colors">
              <span className="text-[1.05rem] font-semibold text-white/90 select-none">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={actualSpend}
                onChange={(e) => setActualSpend(e.target.value)}
                className="w-14 bg-transparent text-[1.05rem] font-semibold text-white outline-none"
              />
            </div>
          </div>

          {/* Action Button(s) */}
          <div className="flex items-center gap-2 ml-auto pb-0.5">
            {isEditing && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-[2.45rem] px-4 rounded-xl bg-[#20222B] text-[#A1A1AA] hover:text-white font-medium text-[0.825rem] border border-white/[0.06] hover:bg-[#282B37] active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="h-[2.45rem] px-5 sm:px-6 rounded-xl bg-gradient-to-r from-[#7EFAD7] to-[#5EEAD4] text-[#121316] font-semibold text-[0.875rem] shadow-[0_0_18px_rgba(94,234,212,0.35)] hover:brightness-105 active:scale-95 transition-all cursor-pointer tracking-tight"
            >
              {isEditing ? 'Save' : 'Record'}
            </button>
          </div>
        </div>

        {/* Inline Notes Field */}
        <div className="pt-1">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add note..."
            className="w-full bg-transparent text-[0.82rem] text-[#8E92A0] focus:text-white placeholder:text-[#5F6370] outline-none border-b border-white/[0.04] focus:border-[#5EEAD4]/30 pb-1 transition-colors"
          />
        </div>
      </form>
    </div>
  )
}

export default RecordCheckOffCard

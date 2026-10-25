import React from 'react'
import { Pencil } from 'lucide-react'
import type { DailyRecord, BudgetStatus } from '@/stores/dailyStore'
import { RecordCheckOffCard } from './RecordCheckOffCard'
import { cn } from '@/lib/utils'

export interface DailyHistoryCardProps {
  record: DailyRecord
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (updates: { plannedCap: number; actualSpend: number; notes: string }) => void
  className?: string
}

const STATUS_STYLES: Record<BudgetStatus, { bg: string; text: string; border: string }> = {
  under_budget: {
    bg: 'bg-[#132E27]',
    text: 'text-[#4ADE80]',
    border: 'border-[#4ADE80]/20',
  },
  over_budget: {
    bg: 'bg-[#2E1818]',
    text: 'text-[#FA8C68]',
    border: 'border-[#FA8C68]/20',
  },
  on_budget: {
    bg: 'bg-[#182622]',
    text: 'text-[#6EE7B7]',
    border: 'border-[#6EE7B7]/20',
  },
}

export const DailyHistoryCard: React.FC<DailyHistoryCardProps> = ({
  record,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  className,
}) => {
  // If in edit mode, render active inline editor with glowing gradient border
  if (isEditing) {
    return (
      <RecordCheckOffCard
        title={`Edit Check-Off (${record.month} ${record.dayNum}${record.daySuffix ?? ''})`}
        initialPlannedCap={record.plannedCap}
        initialActualSpend={record.actualSpend}
        initialNotes={record.notes}
        isEditing={true}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
        className={className}
      />
    )
  }

  // Calculate variance and status
  const variance = record.plannedCap - record.actualSpend
  const status: BudgetStatus =
    variance > 0 ? 'under_budget' : variance < 0 ? 'over_budget' : 'on_budget'
  const style = STATUS_STYLES[status]

  const varianceFormatted =
    variance > 0
      ? `+$${variance}`
      : variance < 0
      ? `-$${Math.abs(variance)}`
      : `$0`

  const varianceColor =
    variance > 0
      ? 'text-[#4ADE80]'
      : variance < 0
      ? 'text-[#FA8C68]'
      : 'text-white'

  return (
    <div
      onClick={onStartEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onStartEdit()
        }
      }}
      className={cn(
        'group relative rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] border border-white/[0.03] hover:border-white/[0.12] transition-all px-6 py-5 select-none cursor-pointer flex flex-col gap-3',
        className
      )}
    >
      {/* Top Row: Status badge, Planned, Actual, Net Variance */}
      <div className="flex items-center justify-between gap-4">
        {/* Status Pill Badge */}
        <div
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-[0.78rem] font-medium border tracking-tight shrink-0',
            style.bg,
            style.text,
            style.border
          )}
        >
          {status}
        </div>

        {/* Figures Group */}
        <div className="flex items-center gap-6 sm:gap-10">
          {/* Planned Cap */}
          <span className="text-[1.25rem] font-semibold text-white tracking-tight">
            ${record.plannedCap}
          </span>

          {/* Actual Spend */}
          <span className="text-[1.25rem] font-semibold text-white tracking-tight">
            ${record.actualSpend}
          </span>

          {/* Net Variance */}
          <span className={cn('text-[1.25rem] font-semibold tracking-tight', varianceColor)}>
            {varianceFormatted}
          </span>

          {/* Subtle edit icon on hover */}
          <div className="w-6 h-6 rounded-full bg-[#20222B] text-[#8E92A0] group-hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            <Pencil className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Bottom Row: Notes string */}
      <p className="text-[0.82rem] font-normal text-[#8E92A0] tracking-normal line-clamp-1">
        {record.notes.startsWith('Notes:') ? record.notes : `Notes: ${record.notes}`}
      </p>
    </div>
  )
}

export default DailyHistoryCard

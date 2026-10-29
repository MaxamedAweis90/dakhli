import React from 'react'
import { Pencil } from 'lucide-react'
import type { DailyRecord, DailyStatus } from '../types/daily.types'
import { RecordCheckOffCard } from './RecordCheckOffCard'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'

export interface DailyHistoryCardProps {
  record: DailyRecord & {
    month?: string
    dayNum?: string
    daySuffix?: string
    plannedCap?: number
    actualSpend?: number
    variance?: number
    notes?: string
  }
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (updates: { cap: number; spent: number; note: string }) => void
  className?: string
}

const STATUS_STYLES: Record<DailyStatus, { bg: string; text: string; border: string; label: string }> = {
  under_budget: {
    bg: 'bg-[#132E27]',
    text: 'text-[#4ADE80]',
    border: 'border-[#4ADE80]/20',
    label: 'under_budget',
  },
  over_budget: {
    bg: 'bg-[#2E1818]',
    text: 'text-[#FA8C68]',
    border: 'border-[#FA8C68]/20',
    label: 'over_budget',
  },
  on_budget: {
    bg: 'bg-[#182622]',
    text: 'text-[#6EE7B7]',
    border: 'border-[#6EE7B7]/20',
    label: 'on_budget',
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
  const store = useLiquidityStore()
  const currentCode = (store.currency in CURRENCY_CONFIGS ? store.currency : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]
  const rate = config.rate ?? 1

  const cap = record.cap ?? record.plannedCap ?? 0
  const spent = record.spent ?? record.actualSpend ?? 0
  const savedDelta = record.savedDelta ?? record.variance ?? (cap - spent)
  const note = record.note ?? record.notes ?? ''

  // If in edit mode, render active inline editor with glowing gradient border
  if (isEditing) {
    return (
      <RecordCheckOffCard
        title={`Edit Check-Off (${record.month ?? ''} ${record.dayNum ?? ''}${record.daySuffix ?? ''})`}
        initialPlannedCap={cap}
        initialActualSpend={spent}
        initialNotes={note}
        isEditing={true}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
        className={className}
      />
    )
  }

  const status: DailyStatus =
    savedDelta > 0 ? 'under_budget' : savedDelta < 0 ? 'over_budget' : 'on_budget'
  const style = STATUS_STYLES[status]

  const convertedCap = cap * rate
  const convertedSpend = spent * rate
  const convertedDelta = savedDelta * rate

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(n)

  const varianceFormatted =
    convertedDelta > 0
      ? `+${config.symbol}${formatMoney(convertedDelta)}`
      : convertedDelta < 0
      ? `-${config.symbol}${formatMoney(Math.abs(convertedDelta))}`
      : `${config.symbol}0`

  const varianceColor =
    convertedDelta > 0
      ? 'text-[#4ADE80]'
      : convertedDelta < 0
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
          {style.label}
        </div>

        {/* Figures Group */}
        <div className="flex items-center gap-6 sm:gap-10">
          {/* Planned Cap */}
          <span className="text-[1.25rem] font-semibold text-white tracking-tight">
            {config.symbol}{formatMoney(convertedCap)}
          </span>

          {/* Actual Spend */}
          <span className="text-[1.25rem] font-semibold text-white tracking-tight">
            {config.symbol}{formatMoney(convertedSpend)}
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
        {note ? (note.startsWith('Notes:') ? note : `Notes: ${note}`) : 'No notes'}
      </p>
    </div>
  )
}

export default DailyHistoryCard

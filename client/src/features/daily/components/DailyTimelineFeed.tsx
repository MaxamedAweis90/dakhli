import React from 'react'
import type { DailyRecord } from '@/stores/dailyStore'
import { RecordCheckOffCard } from './RecordCheckOffCard'
import { DailyHistoryCard } from './DailyHistoryCard'
import { cn } from '@/lib/utils'

export interface DailyTimelineFeedProps {
  records: DailyRecord[]
  editingRecordId: string | null
  onRecordToday: (data: { plannedCap: number; actualSpend: number; notes: string }) => void
  onUpdateRecord: (id: string, updates: { plannedCap: number; actualSpend: number; notes: string }) => void
  onSetEditingId: (id: string | null) => void
  className?: string
}

export const DailyTimelineFeed: React.FC<DailyTimelineFeedProps> = ({
  records,
  editingRecordId,
  onRecordToday,
  onUpdateRecord,
  onSetEditingId,
  className,
}) => {
  return (
    <div className={cn('flex flex-col', className)}>
      {records.map((record, index) => {
        const isLast = index === records.length - 1
        const isEditing = editingRecordId === record.id
        const isTodayUnrecorded = record.isToday && !record.isRecorded

        return (
          <div key={record.id} className="flex items-stretch gap-4 sm:gap-6">
            {/* Left Column: Spine Date & Connecting Line */}
            <div className="flex flex-col items-center w-12 sm:w-14 shrink-0 pt-3 select-none">
              {/* Optional 'Today' indicator above current date */}
              {record.isToday && (
                <span className="text-[0.85rem] font-semibold text-white tracking-tight leading-none mb-1">
                  Today
                </span>
              )}

              {/* Month label */}
              <span className="text-[0.75rem] font-normal text-[#8E92A0] leading-tight">
                {record.month}
              </span>

              {/* Day number with suffix */}
              <span className="text-[1.2rem] font-bold text-white tracking-tight leading-tight">
                {record.dayNum}
                {record.daySuffix && (
                  <sup className="text-[0.7rem] font-medium text-[#D1D5DB] ml-0.5 -top-1">
                    {record.daySuffix}
                  </sup>
                )}
              </span>

              {/* Connecting line to the next day */}
              {!isLast && (
                <div
                  className={cn(
                    'w-[1.5px] flex-1 my-3 rounded-full min-h-[3.5rem]',
                    record.isToday
                      ? 'bg-gradient-to-b from-[#5EEAD4]/70 to-white/10'
                      : 'bg-white/10'
                  )}
                />
              )}
            </div>

            {/* Right Column: Card (Active Record Check-Off or Historical Card) */}
            <div className="flex-1 min-w-0 pb-4 sm:pb-5">
              {isTodayUnrecorded && !isEditing ? (
                <RecordCheckOffCard
                  initialPlannedCap={record.plannedCap}
                  initialActualSpend={record.actualSpend}
                  initialNotes={record.notes}
                  onSave={onRecordToday}
                />
              ) : (
                <DailyHistoryCard
                  record={record}
                  isEditing={isEditing}
                  onStartEdit={() => onSetEditingId(record.id)}
                  onCancelEdit={() => onSetEditingId(null)}
                  onSaveEdit={(updates) => onUpdateRecord(record.id, updates)}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DailyTimelineFeed

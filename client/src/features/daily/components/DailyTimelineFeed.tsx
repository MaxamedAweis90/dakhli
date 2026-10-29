import React from 'react'
import type { DailyRecord } from '../types/daily.types'
import { RecordCheckOffCard } from './RecordCheckOffCard'
import { DailyHistoryCard } from './DailyHistoryCard'
import { cn } from '@/lib/utils'

export interface DailyTimelineFeedProps {
  records: DailyRecord[]
  editingRecordId: string | null
  defaultDailyCap?: number
  isSubmitting?: boolean
  onRecordToday: (data: { cap: number; spent: number; note: string }) => void
  onUpdateRecord: (id: string, updates: { cap: number; spent: number; note: string }) => void
  onSetEditingId: (id: string | null) => void
  className?: string
}

const getDaySuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

const parseDateParts = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateObj = new Date(y, (m || 1) - 1, d || 1)
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' })
  const dayNum = String(d || 1)
  const daySuffix = getDaySuffix(d || 1)
  return { monthName, dayNum, daySuffix }
}

export const DailyTimelineFeed: React.FC<DailyTimelineFeedProps> = ({
  records,
  editingRecordId,
  defaultDailyCap = 30,
  isSubmitting = false,
  onRecordToday,
  onUpdateRecord,
  onSetEditingId,
  className,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10)

  // Ensure items are ordered latest date first
  const displayRecords = [...records].sort((a, b) => b.date.localeCompare(a.date))

  // If today is not in the list, synthesize a pending entry at the top
  const hasToday = displayRecords.some((r) => r.date === todayStr)
  const timelineItems: (DailyRecord & { isToday: boolean; isRecorded: boolean })[] = [
    ...(!hasToday
      ? [
          {
            id: `pending-${todayStr}`,
            userId: '',
            date: todayStr,
            cap: defaultDailyCap,
            spent: 0,
            savedDelta: defaultDailyCap,
            status: 'on_budget' as const,
            note: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isToday: true,
            isRecorded: false,
          },
        ]
      : []),
    ...displayRecords.map((r) => ({
      ...r,
      isToday: r.date === todayStr,
      isRecorded: true,
    })),
  ]

  return (
    <div className={cn('flex flex-col', className)}>
      {timelineItems.map((item, index) => {
        const isLast = index === timelineItems.length - 1
        const isEditing = editingRecordId === item.id
        const isTodayUnrecorded = item.isToday && !item.isRecorded
        const { monthName, dayNum, daySuffix } = parseDateParts(item.date)

        return (
          <div key={item.id} className="flex items-stretch gap-4 sm:gap-6">
            {/* Left Column: Spine Date & Connecting Line */}
            <div className="flex flex-col items-center w-12 sm:w-14 shrink-0 pt-3 select-none">
              {/* 'Today' indicator above current date */}
              {item.isToday && (
                <span className="text-[0.85rem] font-semibold text-white tracking-tight leading-none mb-1">
                  Today
                </span>
              )}

              {/* Month label */}
              <span className="text-[0.75rem] font-normal text-[#8E92A0] leading-tight">
                {monthName}
              </span>

              {/* Day number with suffix */}
              <span className="text-[1.2rem] font-bold text-white tracking-tight leading-tight">
                {dayNum}
                {daySuffix && (
                  <sup className="text-[0.7rem] font-medium text-[#D1D5DB] ml-0.5 -top-1">
                    {daySuffix}
                  </sup>
                )}
              </span>

              {/* Connecting line to the next day */}
              {!isLast && (
                <div
                  className={cn(
                    'w-[1.5px] flex-1 my-3 rounded-full min-h-[3.5rem]',
                    item.isToday
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
                  initialPlannedCap={item.cap || defaultDailyCap}
                  initialActualSpend={item.spent || 0}
                  initialNotes={item.note || ''}
                  isSubmitting={isSubmitting}
                  onSave={onRecordToday}
                />
              ) : (
                <DailyHistoryCard
                  record={{
                    ...item,
                    month: monthName,
                    dayNum,
                    daySuffix,
                  }}
                  isEditing={isEditing}
                  onStartEdit={() => onSetEditingId(item.id)}
                  onCancelEdit={() => onSetEditingId(null)}
                  onSaveEdit={(updates) => onUpdateRecord(item.id, updates)}
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

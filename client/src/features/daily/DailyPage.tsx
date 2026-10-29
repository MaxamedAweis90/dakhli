import React, { useState } from 'react'
import { CumulativeSavingsCard } from './components/CumulativeSavingsCard'
import { DailyTimelineFeed } from './components/DailyTimelineFeed'
import { useDaily } from './hooks/useDaily'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import { useOverheadsStore } from '@/stores/overheadsStore'

export const DailyPage: React.FC = () => {
  const { currentMonth } = useOverheadsStore()
  const { baseline } = useBaseline()
  const {
    logs,
    summary,
    recordCheckOff,
    isRecording,
  } = useDaily(currentMonth)

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  const defaultDailyCap = baseline?.defaultDailyCap ?? 30
  const todayStr = new Date().toISOString().slice(0, 10)

  // Compute dynamic sparkline points from historical logs
  const computeSparklinePoints = (): number[] => {
    if (logs.length === 0) {
      const base = summary.monthlySavedFromDaily || 0
      return [0, base * 0.3, base * 0.6, base]
    }

    const sortedAsc = [...logs].sort((a, b) => a.date.localeCompare(b.date))
    let running = 0
    const points = sortedAsc.map((log) => {
      running += log.savedDelta
      return running
    })

    if (points.length === 1) {
      return [0, points[0]]
    }
    return points
  }

  const handleRecordToday = async (data: { cap: number; spent: number; note: string }) => {
    await recordCheckOff({
      date: todayStr,
      cap: data.cap,
      spent: data.spent,
      note: data.note,
    })
  }

  const handleUpdateRecord = async (
    id: string,
    updates: { cap: number; spent: number; note: string }
  ) => {
    const existing = logs.find((l) => l.id === id)
    const targetDate = existing ? existing.date : todayStr

    await recordCheckOff({
      date: targetDate,
      cap: updates.cap,
      spent: updates.spent,
      note: updates.note,
    })
    setEditingRecordId(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] xl:grid-cols-[380px_1fr] items-start gap-8 lg:gap-10 pb-16 pt-1">
      {/* Left Column: Preview-only Cumulative Savings Card */}
      <div className="w-full max-w-md lg:max-w-none">
        <CumulativeSavingsCard
          savings={summary.monthlySavedFromDaily}
          points={computeSparklinePoints()}
        />
      </div>

      {/* Right Column: Timeline Spine & Interactive Check-Off Cards */}
      <div className="w-full">
        <DailyTimelineFeed
          records={logs}
          editingRecordId={editingRecordId}
          defaultDailyCap={defaultDailyCap}
          isSubmitting={isRecording}
          onRecordToday={handleRecordToday}
          onUpdateRecord={handleUpdateRecord}
          onSetEditingId={setEditingRecordId}
        />
      </div>
    </div>
  )
}

export default DailyPage

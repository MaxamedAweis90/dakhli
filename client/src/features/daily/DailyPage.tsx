import React, { useState } from 'react'
import { CumulativeSavingsCard } from './components/CumulativeSavingsCard'
import { DailyTimelineFeed } from './components/DailyTimelineFeed'
import { useDaily } from './hooks/useDaily'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import { useOverheadsStore } from '@/stores/overheadsStore'
import { useAuthStore } from '@/stores/authStore'

export const DailyPage: React.FC = () => {
  const { currentMonth } = useOverheadsStore()
  const { user } = useAuthStore()
  const { baseline } = useBaseline()
  const isDormant = Boolean(user?.dormantCycles?.includes(currentMonth))
  const {
    logs,
    summary,
    recordCheckOff,
    isRecording,
  } = useDaily(currentMonth)

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  const defaultDailyCap = baseline?.defaultDailyCap ?? 30
  const todayStr = new Date().toISOString().slice(0, 10)
  const restorationMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

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
    <div className="flex flex-col gap-4 pb-16 pt-1">
      {/* Surface Locking Banner for Dormant Cycles */}
      {isDormant && (
        <div className="p-4 rounded-xl bg-[#1A1D26] border border-white/5 text-slate-300 text-xs font-mono flex items-center gap-3 select-none">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span>
            This cycle was dormant due to account deactivation. Financial tracking resumed on {restorationMonth}.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] xl:grid-cols-[380px_1fr] items-start gap-6 sm:gap-8 lg:gap-10">
        {/* Left Column: Preview-only Cumulative Savings Card */}
        <div className="w-full">
          <CumulativeSavingsCard
            savings={isDormant ? 0 : summary.monthlySavedFromDaily}
            points={isDormant ? [0, 0, 0, 0] : computeSparklinePoints()}
          />
        </div>

        {/* Right Column: Timeline Spine & Interactive Check-Off Cards */}
        <div className="w-full">
          <DailyTimelineFeed
            records={logs}
            editingRecordId={editingRecordId}
            defaultDailyCap={defaultDailyCap}
            isSubmitting={isRecording}
            isDormant={isDormant}
            onRecordToday={handleRecordToday}
            onUpdateRecord={handleUpdateRecord}
            onSetEditingId={setEditingRecordId}
          />
        </div>
      </div>
    </div>
  )
}

export default DailyPage

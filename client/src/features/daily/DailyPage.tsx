import React from 'react'
import { CumulativeSavingsCard } from './components/CumulativeSavingsCard'
import { DailyTimelineFeed } from './components/DailyTimelineFeed'
import { useDailyStore } from '@/stores/dailyStore'

export const DailyPage: React.FC = () => {
  const {
    records,
    editingRecordId,
    recordToday,
    updateRecord,
    setEditingRecordId,
    getCumulativeSavings,
    getSparklinePoints,
  } = useDailyStore()

  const cumulativeSavings = getCumulativeSavings()
  const sparklinePoints = getSparklinePoints()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] xl:grid-cols-[380px_1fr] items-start gap-8 lg:gap-10 pb-16 pt-1">
      {/* Left Column: Preview-only Cumulative Savings Card */}
      <div className="w-full max-w-md lg:max-w-none">
        <CumulativeSavingsCard
          savings={cumulativeSavings}
          points={sparklinePoints}
        />
      </div>

      {/* Right Column: Timeline Spine & Interactive Check-Off Cards */}
      <div className="w-full">
        <DailyTimelineFeed
          records={records}
          editingRecordId={editingRecordId}
          onRecordToday={recordToday}
          onUpdateRecord={(id, updates) => updateRecord(id, updates)}
          onSetEditingId={setEditingRecordId}
        />
      </div>
    </div>
  )
}

export default DailyPage

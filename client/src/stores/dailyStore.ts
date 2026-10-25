import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BudgetStatus = 'under_budget' | 'over_budget' | 'on_budget'

export interface DailyRecord {
  id: string
  dateStr: string // "2026-10-24"
  month: string // "Oct"
  dayNum: string // "24"
  daySuffix?: string // "th"
  isToday: boolean
  isRecorded: boolean
  plannedCap: number
  actualSpend: number
  notes: string
}

interface DailyState {
  records: DailyRecord[]
  editingRecordId: string | null
  baseSavings: number // Baseline prior to recorded history

  // Actions
  recordToday: (data: { plannedCap: number; actualSpend: number; notes: string }) => void
  updateRecord: (id: string, updates: Partial<Pick<DailyRecord, 'plannedCap' | 'actualSpend' | 'notes' | 'isRecorded'>>) => void
  setEditingRecordId: (id: string | null) => void
  resetToDefaults: () => void

  // Computed values
  getVariance: (record: DailyRecord) => number
  getStatus: (record: DailyRecord) => BudgetStatus
  getCumulativeSavings: () => number
  getSparklinePoints: () => number[]
}

const DEFAULT_RECORDS: DailyRecord[] = [
  {
    id: 'day-2026-10-24',
    dateStr: '2026-10-24',
    month: 'Oct',
    dayNum: '24',
    daySuffix: 'th',
    isToday: true,
    isRecorded: false,
    plannedCap: 30,
    actualSpend: 20,
    notes: 'Planned cap vs actual spend $20',
  },
  {
    id: 'day-2026-10-23',
    dateStr: '2026-10-23',
    month: 'Oct',
    dayNum: '23',
    isToday: false,
    isRecorded: true,
    plannedCap: 30,
    actualSpend: 15,
    notes: 'under_budget savings of $15',
  },
  {
    id: 'day-2026-10-22',
    dateStr: '2026-10-22',
    month: 'Oct',
    dayNum: '22',
    isToday: false,
    isRecorded: true,
    plannedCap: 30,
    actualSpend: 45,
    notes: 'Planned new day budget and exceeded...',
  },
  {
    id: 'day-2026-10-21',
    dateStr: '2026-10-21',
    month: 'Oct',
    dayNum: '21',
    isToday: false,
    isRecorded: true,
    plannedCap: 30,
    actualSpend: 30,
    notes: 'Recorded check for the team $0',
  },
]

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      records: DEFAULT_RECORDS,
      editingRecordId: null,
      baseSavings: 35, // Seeds reference UI $35.00

      recordToday: ({ plannedCap, actualSpend, notes }) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.isToday
              ? {
                  ...r,
                  plannedCap,
                  actualSpend,
                  notes,
                  isRecorded: true,
                }
              : r
          ),
          editingRecordId: null,
        }))
      },

      updateRecord: (id, updates) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
          editingRecordId: null,
        }))
      },

      setEditingRecordId: (id) => set({ editingRecordId: id }),

      resetToDefaults: () =>
        set({
          records: DEFAULT_RECORDS,
          editingRecordId: null,
          baseSavings: 35,
        }),

      getVariance: (record: DailyRecord) => {
        return record.plannedCap - record.actualSpend
      },

      getStatus: (record: DailyRecord): BudgetStatus => {
        const variance = record.plannedCap - record.actualSpend
        if (variance > 0) return 'under_budget'
        if (variance < 0) return 'over_budget'
        return 'on_budget'
      },

      getCumulativeSavings: () => {
        const { records, baseSavings } = get()
        // Default reference baseline is $35.00 before today is recorded.
        // History cards: Oct 21 ($0), Oct 22 (-$15), Oct 23 (+$15) net to $0 change from base $35.
        // When today or any day changes, delta from defaults updates cumulative savings.
        let savings = baseSavings

        // If today is recorded, add its variance
        const todayRecord = records.find((r) => r.isToday)
        if (todayRecord && todayRecord.isRecorded) {
          savings += todayRecord.plannedCap - todayRecord.actualSpend
        }

        // Apply deltas from historical edits
        const oct23 = records.find((r) => r.id === 'day-2026-10-23')
        if (oct23) {
          const delta23 = (oct23.plannedCap - oct23.actualSpend) - (30 - 15)
          savings += delta23
        }

        const oct22 = records.find((r) => r.id === 'day-2026-10-22')
        if (oct22) {
          const delta22 = (oct22.plannedCap - oct22.actualSpend) - (30 - 45)
          savings += delta22
        }

        const oct21 = records.find((r) => r.id === 'day-2026-10-21')
        if (oct21) {
          const delta21 = (oct21.plannedCap - oct21.actualSpend) - (30 - 30)
          savings += delta21
        }

        return savings
      },

      getSparklinePoints: () => {
        const currentCumulative = get().getCumulativeSavings()
        // Baseline curve shape matching the reference UI chart
        // Curve starts low, climbs with peaks, reaches current cumulative at end
        const scale = currentCumulative / 35
        return [
          10 * scale,
          13 * scale,
          12 * scale,
          19 * scale,
          16 * scale,
          23 * scale,
          21 * scale,
          34 * scale,
          28 * scale,
          32 * scale,
          currentCumulative,
        ]
      },
    }),
    {
      name: 'dakhli_daily_store',
    }
  )
)

export default useDailyStore

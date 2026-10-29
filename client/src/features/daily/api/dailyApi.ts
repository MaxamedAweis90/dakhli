import { api } from '@/lib/api'
import type {
  DailyRecord,
  CheckOffPayload,
  DailySummary,
  DailyStatus,
} from '../types/daily.types'

export interface DailyApiResponse<T> {
  success: boolean
  data: T
}

export const normalizeDailyRecord = (raw: any): DailyRecord => {
  const cap = Number(raw.cap ?? raw.plannedCap ?? 0)
  const spent = Number(raw.spent ?? raw.actualSpend ?? 0)
  const savedDelta = Number(raw.savedDelta ?? raw.variance ?? (cap - spent))

  let status: DailyStatus = 'on_budget'
  if (savedDelta > 0) status = 'under_budget'
  else if (savedDelta < 0) status = 'over_budget'
  if (raw.status && ['under_budget', 'on_budget', 'over_budget'].includes(raw.status)) {
    status = raw.status as DailyStatus
  }

  return {
    id: raw.id || raw._id?.toString?.() || String(raw._id || Date.now()),
    userId: raw.userId?.toString?.() || raw.userId || '',
    date: raw.date || new Date().toISOString().slice(0, 10),
    cap,
    spent,
    savedDelta,
    status,
    note: raw.note ?? raw.notes ?? '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

export const dailyApi = {
  getLogs: async (monthKey?: string): Promise<DailyRecord[]> => {
    const res = (await api.get('/daily/logs', {
      params: monthKey ? { monthKey } : undefined,
    })) as DailyApiResponse<any[]>

    const rawList = Array.isArray(res?.data) ? res.data : []
    return rawList.map(normalizeDailyRecord)
  },

  getSummary: async (monthKey?: string): Promise<DailySummary> => {
    const res = (await api.get('/daily/savings-preview', {
      params: monthKey ? { monthKey } : undefined,
    })) as DailyApiResponse<any>

    const data = res?.data || {}
    const rawLogs = Array.isArray(data.recentLogs)
      ? data.recentLogs
      : Array.isArray(data.logs)
      ? data.logs
      : []

    const recentLogs = rawLogs.map(normalizeDailyRecord)
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayRecord = data.todayRecord
      ? normalizeDailyRecord(data.todayRecord)
      : recentLogs.find((l: DailyRecord) => l.date === todayStr) || null

    return {
      todayRecord,
      currentStreak: Number(data.currentStreak ?? 0),
      monthlySavedFromDaily: Number(data.monthlySavedFromDaily ?? data.totalVariance ?? 0),
      recentLogs,
    }
  },

  recordCheckOff: async (payload: CheckOffPayload): Promise<DailyRecord> => {
    const res = (await api.post('/daily/checkoff', {
      date: payload.date || new Date().toISOString().slice(0, 10),
      plannedCap: payload.cap,
      cap: payload.cap,
      actualSpend: payload.spent,
      spent: payload.spent,
      notes: payload.note || '',
      note: payload.note || '',
    })) as DailyApiResponse<any>

    return normalizeDailyRecord(res?.data || {})
  },
}

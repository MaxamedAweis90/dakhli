import { api } from '@/lib/api'
import type {
  OverheadBill,
  CreateOverheadPayload,
  OverheadSummary,
  OverheadStatus,
} from '../types/overhead.types'

export interface OverheadsApiResponse {
  success: boolean
  data: any[]
}

const inferIconKey = (title: string, explicitKey?: string): string => {
  if (explicitKey) return explicitKey
  const lower = title.toLowerCase()
  if (lower.includes('rent') || lower.includes('key')) return 'home'
  if (lower.includes('gym') || lower.includes('fit') || lower.includes('health')) return 'dumbbell'
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('broadband')) return 'wifi'
  if (lower.includes('music') || lower.includes('apple') || lower.includes('spotify')) return 'music'
  if (lower.includes('electric') || lower.includes('power') || lower.includes('util')) return 'flash'
  if (lower.includes('insur') || lower.includes('shield')) return 'shield'
  return 'home'
}

export const normalizeBill = (raw: any): OverheadBill => {
  const item = raw.item || raw
  const record = raw.record || {}

  const id = raw.id || item._id?.toString?.() || item._id || String(raw.id || '')
  const userId = raw.userId || item.userId?.toString?.() || item.userId || ''
  const title = raw.title || item.title || 'Untitled Bill'
  const amount = Number(raw.amount ?? record.billedAmount ?? item.defaultAmount ?? 0)
  const dueDay = Number(raw.dueDay ?? item.dueDate ?? 1)
  const isPaid = raw.status === 'paid' || Boolean(record.isPaid)
  const status: OverheadStatus = isPaid ? 'paid' : 'unpaid'
  const iconKey = inferIconKey(title, raw.iconKey || item.iconKey)
  const isRecurring = raw.isRecurring !== undefined ? raw.isRecurring : !item.isArchived
  const paidAt = raw.paidAt || record.paidAt || (isPaid ? new Date().toISOString() : null)
  const createdAt = raw.createdAt || item.createdAt || new Date().toISOString()
  const updatedAt = raw.updatedAt || item.updatedAt || new Date().toISOString()

  return {
    id,
    userId,
    title,
    amount,
    dueDay,
    status,
    iconKey,
    isRecurring,
    notes: raw.notes || item.notes,
    paidAt,
    createdAt,
    updatedAt,
  }
}

export const computeSummary = (bills: OverheadBill[]): OverheadSummary => {
  const totalPaid = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0)

  const totalUnpaid = bills
    .filter((b) => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0)

  const totalMonthly = totalPaid + totalUnpaid
  const billsCount = bills.length
  const unpaidCount = bills.filter((b) => b.status === 'unpaid').length
  const percentagePaid = totalMonthly > 0 ? Math.min(100, Math.round((totalPaid / totalMonthly) * 100)) : 0

  return {
    totalUnpaid,
    totalPaid,
    totalMonthly,
    billsCount,
    unpaidCount,
    percentagePaid,
  }
}

export const overheadsApi = {
  getOverheads: async (monthKey?: string): Promise<{ bills: OverheadBill[]; summary: OverheadSummary }> => {
    const res = (await api.get('/overheads', {
      params: monthKey ? { monthKey } : undefined,
    })) as OverheadsApiResponse

    const rawList = Array.isArray(res?.data) ? res.data : []
    const bills = rawList.map(normalizeBill)
    const summary = computeSummary(bills)

    return { bills, summary }
  },

  createOverhead: async (payload: CreateOverheadPayload): Promise<OverheadBill> => {
    const res = (await api.post('/overheads', {
      title: payload.title,
      amount: payload.amount,
      defaultAmount: payload.amount,
      dueDay: payload.dueDay,
      dueDate: payload.dueDay,
      isRecurring: payload.isRecurring ?? true,
      notes: payload.notes,
      iconKey: payload.iconKey,
    })) as { success: boolean; data: any }

    return normalizeBill(res?.data || {})
  },

  updateOverheadStatus: async (
    id: string,
    status: OverheadStatus,
    monthKey?: string
  ): Promise<void> => {
    await api.patch(`/overheads/${id}/status`, {
      status,
      monthKey,
    })
  },

  deleteOverhead: async (id: string): Promise<void> => {
    await api.delete(`/overheads/${id}`)
  },
}

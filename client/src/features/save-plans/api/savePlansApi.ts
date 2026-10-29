import { api } from '@/lib/api'
import type {
  SavePlan,
  CreateSavePlanPayload,
  DepositSavePlanPayload,
  SavePlanCategory,
  SavePlanStatus,
  SavePlanType,
} from '../types/savePlan.types'

export interface SavePlansApiResponse<T> {
  success: boolean
  data: T
}

export const normalizeSavePlan = (raw: any): SavePlan => {
  const id = raw.id || raw._id?.toString?.() || String(raw._id || Date.now())
  const userId = raw.userId?.toString?.() || raw.userId || ''
  const title = raw.title || raw.name || 'Untitled Plan'
  const targetAmount = Number(raw.targetAmount ?? 1000)
  const currentAmount = Number(raw.currentAmount ?? raw.currentSaved ?? 0)
  const percentage =
    targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
      : 0

  const category: SavePlanCategory = ['emergency', 'general', 'item_funding'].includes(
    raw.category
  )
    ? raw.category
    : 'general'

  const type: SavePlanType =
    raw.type === 'general_life' ? 'general_life' : 'targeted'

  const status: SavePlanStatus = [
    'active',
    'completed',
    'cancelled',
    'canceled',
    'deactivated',
  ].includes(raw.status)
    ? raw.status
    : 'active'

  return {
    id,
    userId,
    title,
    name: title,
    category,
    type,
    targetAmount,
    currentAmount,
    currentSaved: currentAmount,
    percentage,
    monthlyContribution:
      raw.monthlyContribution !== undefined
        ? Number(raw.monthlyContribution)
        : undefined,
    linkedItemId: raw.linkedItemId,
    linkedItemName: raw.linkedItemName,
    isPinned: raw.isPinned !== undefined ? Boolean(raw.isPinned) : true,
    iconKey: raw.iconKey,
    status,
    targetDate: raw.targetDate,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

export const savePlansApi = {
  getSavePlans: async (status?: string): Promise<SavePlan[]> => {
    const res = (await api.get('/save-plans', {
      params: status ? { status } : undefined,
    })) as SavePlansApiResponse<any[]>

    const rawList = Array.isArray(res?.data) ? res.data : []
    return rawList.map(normalizeSavePlan)
  },

  createSavePlan: async (payload: CreateSavePlanPayload): Promise<SavePlan> => {
    const initialDeposit =
      payload.initialDeposit ?? payload.currentAmount ?? payload.currentSaved ?? 0

    const res = (await api.post('/save-plans', {
      title: payload.title || payload.name,
      name: payload.title || payload.name,
      category: payload.category || 'general',
      type: payload.type || 'targeted',
      targetAmount: payload.targetAmount,
      initialDeposit,
      currentAmount: initialDeposit,
      monthlyContribution: payload.monthlyContribution,
      linkedItemId: payload.linkedItemId,
      linkedItemName: payload.linkedItemName,
      linkedItemIds: payload.linkedItemIds,
      isPinned: payload.isPinned ?? true,
      iconKey: payload.iconKey,
      targetDate: payload.targetDate,
    })) as SavePlansApiResponse<any>

    return normalizeSavePlan(res?.data || {})
  },

  depositToSavePlan: async (
    id: string,
    payload: DepositSavePlanPayload | number
  ): Promise<SavePlan> => {
    const amount = typeof payload === 'number' ? payload : payload.amount
    const res = (await api.patch(`/save-plans/${id}/fund`, {
      amount,
    })) as SavePlansApiResponse<any>

    return normalizeSavePlan(res?.data || {})
  },

  completeSavePlan: async (id: string): Promise<SavePlan> => {
    const res = (await api.patch(
      `/save-plans/${id}/complete`
    )) as SavePlansApiResponse<any>

    return normalizeSavePlan(res?.data || {})
  },

  cancelSavePlan: async (id: string): Promise<SavePlan> => {
    const res = (await api.patch(
      `/save-plans/${id}/cancel`
    )) as SavePlansApiResponse<any>

    return normalizeSavePlan(res?.data || {})
  },

  updateSavePlan: async (
    id: string,
    updates: Partial<SavePlan>
  ): Promise<SavePlan> => {
    const res = (await api.patch(
      `/save-plans/${id}`,
      updates
    )) as SavePlansApiResponse<any>

    return normalizeSavePlan(res?.data || {})
  },

  deleteSavePlan: async (id: string): Promise<void> => {
    await api.delete(`/save-plans/${id}`)
  },
}


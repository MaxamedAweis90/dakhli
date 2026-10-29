import { api } from '@/lib/api'
import type {
  RegistryItem,
  CreateItemPayload,
  UpdateItemPayload,
  ItemTier,
  DisplayItemTier,
  ItemStatus,
} from '../types/item.types'

export interface ItemsApiResponse<T> {
  success: boolean
  data: T
}

const DEFAULT_FALLBACK_IMAGES: Record<ItemTier, string> = {
  essentials:
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  future_needs:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  wants:
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
}

export const toContractTier = (raw?: string): ItemTier => {
  const lower = (raw || '').toLowerCase().trim()
  if (lower.startsWith('essential')) return 'essentials'
  if (lower.startsWith('future')) return 'future_needs'
  return 'wants'
}

export const toDisplayTier = (raw?: string): DisplayItemTier => {
  const tier = toContractTier(raw)
  if (tier === 'essentials') return 'Essentials'
  if (tier === 'future_needs') return 'Future Needs'
  return 'Wants'
}

const formatBoughtDate = (isoOrDate?: string | null): string | undefined => {
  if (!isoOrDate) return undefined
  const d = new Date(isoOrDate)
  if (isNaN(d.getTime())) return isoOrDate
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export const normalizeItem = (raw: any): RegistryItem => {
  const id = raw.id || raw._id?.toString?.() || String(raw._id || Date.now())
  const userId = raw.userId?.toString?.() || raw.userId || ''
  const title = raw.title || raw.name || 'Untitled Item'
  const targetPrice = Number(raw.targetPrice ?? raw.estimatedPrice ?? raw.price ?? 0)
  const tier = toContractTier(raw.tier || raw.displayTier)
  const displayTier = toDisplayTier(raw.tier || raw.displayTier)

  const status: ItemStatus =
    raw.status === 'bought'
      ? 'bought'
      : raw.status === 'cancelled' || raw.status === 'removed'
      ? 'cancelled'
      : 'planned'

  const imageUrl =
    raw.imageUrl || DEFAULT_FALLBACK_IMAGES[tier] || DEFAULT_FALLBACK_IMAGES.wants

  const inSavePlan =
    Boolean(raw.inSavePlan) ||
    raw.tag === 'In Save Plan' ||
    (typeof raw.targetProgress === 'number' && raw.targetProgress > 0)

  const tag = raw.tag || (inSavePlan ? 'In Save Plan' : displayTier)

  return {
    id,
    userId,
    title,
    name: title,
    targetPrice,
    price: targetPrice,
    tier,
    displayTier,
    status,
    imageUrl,
    iconKey: raw.iconKey,
    notes: raw.notes,
    tag,
    inSavePlan,
    savePlanId: raw.savePlanId || null,
    targetProgress:
      raw.targetProgress !== undefined ? Number(raw.targetProgress) : undefined,
    savedAmount:
      raw.savedAmount !== undefined ? Number(raw.savedAmount) : undefined,
    boughtAt: raw.boughtAt || null,
    boughtDate:
      raw.boughtDate ||
      formatBoughtDate(raw.boughtAt) ||
      (status === 'bought' ? 'completed' : undefined),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

export const itemsApi = {
  getItems: async (params?: { tier?: string; status?: string }): Promise<RegistryItem[]> => {
    const res = (await api.get('/items', {
      params,
    })) as ItemsApiResponse<any[]>

    const rawList = Array.isArray(res?.data) ? res.data : []
    return rawList.map(normalizeItem)
  },

  createItem: async (payload: CreateItemPayload): Promise<RegistryItem> => {
    const title = payload.title || payload.name || 'Untitled Item'
    const targetPrice = Number(payload.targetPrice ?? payload.price ?? 0)
    const tier = toContractTier(payload.tier)

    const res = (await api.post('/items', {
      title,
      name: title,
      targetPrice,
      estimatedPrice: targetPrice,
      price: targetPrice,
      tier,
      imageUrl: payload.imageUrl,
      iconKey: payload.iconKey,
      notes: payload.notes,
      tag: payload.tag,
      targetProgress: payload.targetProgress,
    })) as ItemsApiResponse<any>

    return normalizeItem(res?.data || {})
  },

  updateItem: async (
    id: string,
    payload: UpdateItemPayload
  ): Promise<RegistryItem> => {
    const res = (await api.patch(`/items/${id}`, payload)) as ItemsApiResponse<any>
    return normalizeItem(res?.data || {})
  },

  buyItem: async (id: string): Promise<RegistryItem> => {
    const res = (await api.patch(`/items/${id}/buy`)) as ItemsApiResponse<any>
    return normalizeItem(res?.data || {})
  },

  unbuyItem: async (id: string): Promise<RegistryItem> => {
    const res = (await api.patch(`/items/${id}/unbuy`)) as ItemsApiResponse<any>
    return normalizeItem(res?.data || {})
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/items/${id}`)
  },
}


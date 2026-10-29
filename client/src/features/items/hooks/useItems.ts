import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemsApi } from '../api/itemsApi'
import type {
  RegistryItem,
  CreateItemPayload,
  UpdateItemPayload,
  DisplayItemTier,
} from '../types/item.types'
import { useItemsStore, type RegisteredItem } from '@/stores/itemsStore'
import { useSavingsStore } from '@/stores/savingsStore'
import { BASELINE_QUERY_KEY } from '@/features/settings/hooks/useBaseline'
import { SAVE_PLANS_QUERY_KEY } from '@/features/save-plans/hooks/useSavePlans'

export const ITEMS_QUERY_KEY = ['items']

export const toStoreRegisteredItem = (item: RegistryItem): RegisteredItem => ({
  id: item.id,
  name: item.title || item.name,
  price: item.targetPrice,
  imageUrl: item.imageUrl,
  tier: item.displayTier,
  status: item.status === 'bought' ? 'bought' : 'unbought',
  tag: item.tag,
  targetProgress: item.targetProgress,
  boughtDate: item.boughtDate,
})

export const useItems = (activeTierFilter?: 'All' | DisplayItemTier) => {
  const queryClient = useQueryClient()
  const { setItems, activeTier: storeActiveTier } = useItemsStore()
  const { plans: savePlans } = useSavingsStore()

  const effectiveTier = activeTierFilter ?? storeActiveTier

  const query = useQuery<RegistryItem[]>({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: () => itemsApi.getItems(),
    staleTime: 60 * 1000,
  })

  // Enrich items with any linked save plan progress
  const enrichedItems = useMemo(() => {
    const raw = query.data ?? []
    return raw.map((item) => {
      const linkedPlan = savePlans.find(
        (p) =>
          p.status !== 'canceled' &&
          ((item.savePlanId && p.id === item.savePlanId) ||
            (p.linkedItemId && p.linkedItemId === item.id) ||
            (p.category === 'item_funding' &&
              p.name.toLowerCase() === item.title.toLowerCase()))
      )

      if (linkedPlan) {
        return {
          ...item,
          inSavePlan: true,
          tag: 'In Save Plan',
          targetProgress: linkedPlan.percentage,
          savedAmount: linkedPlan.currentSaved,
        }
      }
      return item
    })
  }, [query.data, savePlans])

  // Sync zustand itemsStore whenever items resolve
  useEffect(() => {
    if (query.data) {
      setItems(enrichedItems.map(toStoreRegisteredItem))
    }
  }, [query.data, enrichedItems, setItems])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: SAVE_PLANS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['balance'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateItemPayload) => itemsApi.createItem(payload),
    onSuccess: invalidateAll,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) =>
      itemsApi.updateItem(id, payload),
    onSuccess: invalidateAll,
  })

  const buyMutation = useMutation({
    mutationFn: (id: string) => itemsApi.buyItem(id),
    onSuccess: invalidateAll,
  })

  const unbuyMutation = useMutation({
    mutationFn: (id: string) => itemsApi.unbuyItem(id),
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsApi.deleteItem(id),
    onSuccess: invalidateAll,
  })

  const toggleBought = async (id: string) => {
    const target = enrichedItems.find((i) => i.id === id)
    if (!target) return
    if (target.status === 'bought') {
      return unbuyMutation.mutateAsync(id)
    }
    return buyMutation.mutateAsync(id)
  }

  const unboughtItems = enrichedItems.filter(
    (item) =>
      item.status !== 'bought' &&
      item.status !== 'cancelled' &&
      item.status !== 'removed' &&
      (effectiveTier === 'All' || item.displayTier === effectiveTier)
  )

  const allUnboughtItems = enrichedItems.filter(
    (item) =>
      item.status !== 'bought' &&
      item.status !== 'cancelled' &&
      item.status !== 'removed'
  )

  const boughtItems = enrichedItems.filter((item) => item.status === 'bought')

  const unboughtTotal = unboughtItems.reduce(
    (sum, item) => sum + (item.targetPrice || 0),
    0
  )

  const overallUnboughtTotal = allUnboughtItems.reduce(
    (sum, item) => sum + (item.targetPrice || 0),
    0
  )

  const boughtTotal = boughtItems.reduce(
    (sum, item) => sum + (item.targetPrice || 0),
    0
  )

  return {
    items: enrichedItems,
    unboughtItems,
    allUnboughtItems,
    boughtItems,
    unboughtTotal,
    overallUnboughtTotal,
    boughtTotal,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateItem: updateMutation.mutateAsync,
    buyItem: buyMutation.mutateAsync,
    unbuyItem: unbuyMutation.mutateAsync,
    toggleBought,
    deleteItem: deleteMutation.mutateAsync,
    removeItem: deleteMutation.mutateAsync,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      buyMutation.isPending ||
      unbuyMutation.isPending ||
      deleteMutation.isPending,
  }
}

export const useItemsQuery = useItems


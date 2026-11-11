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
    const storeFallback = useItemsStore.getState().items.map((i) => ({
      id: i.id,
      userId: 'demo',
      title: i.name,
      name: i.name,
      targetPrice: i.price,
      price: i.price,
      tier: i.tier === 'Essentials' ? 'essentials' : i.tier === 'Future Needs' ? 'future_needs' : 'wants',
      displayTier: i.tier,
      status: i.status === 'bought' ? 'bought' : 'planned',
      imageUrl: i.imageUrl,
      tag: i.tag,
      targetProgress: i.targetProgress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as RegistryItem))

    const raw = (query.data && query.data.length > 0) ? query.data : storeFallback
    const sorted = [...raw].sort((a, b) => {
      const orderA = a.sortOrder ?? 0
      const orderB = b.sortOrder ?? 0
      if (orderA !== orderB) return orderA - orderB
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return sorted.map((item) => {
      const itemTitleLower = (item.title || item.name || '').toLowerCase().trim()
      const linkedPlan = savePlans.find(
        (p) =>
          p.status !== 'canceled' &&
          ((item.savePlanId && p.id === item.savePlanId) ||
            (p.linkedItemId && p.linkedItemId === item.id) ||
            (p.category === 'item_funding' &&
              ((p as any).name || (p as any).title || '').toLowerCase().trim() === itemTitleLower))
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
    onSuccess: (newItem) => {
      if (newItem?.id) {
        queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, (old = []) => {
          if (!old.some((i) => i.id === newItem.id)) {
            return [newItem, ...old]
          }
          return old
        })
      }
      invalidateAll()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) =>
      itemsApi.updateItem(id, payload),
    onSuccess: (updatedItem) => {
      if (updatedItem?.id) {
        queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, (old = []) =>
          old.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        )
      }
      invalidateAll()
    },
  })

  const buyMutation = useMutation({
    mutationFn: (id: string) => itemsApi.buyItem(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY })
      const previousItems = queryClient.getQueryData<RegistryItem[]>(ITEMS_QUERY_KEY)
      const nowFormatted = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(new Date())

      queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, (old = []) =>
        old.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'bought',
                boughtDate: nowFormatted,
                boughtAt: new Date().toISOString(),
              }
            : item
        )
      )
      return { previousItems }
    },
    onSuccess: (updatedItem) => {
      if (updatedItem?.id) {
        queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, (old = []) =>
          old.map((item) =>
            item.id === updatedItem.id
              ? {
                  ...item,
                  ...updatedItem,
                  status: 'bought',
                  boughtDate:
                    updatedItem.boughtDate ||
                    item.boughtDate ||
                    new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date()),
                }
              : item
          )
        )
      }
      // Invalidate balance and dashboard, avoiding ITEMS_QUERY_KEY cache resets/flickers
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SAVE_PLANS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY, context.previousItems)
      }
    },
  })

  const unbuyMutation = useMutation({
    mutationFn: (id: string) => itemsApi.unbuyItem(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY })
      const previousItems = queryClient.getQueryData<RegistryItem[]>(ITEMS_QUERY_KEY)

      queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, (old = []) =>
        old.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'planned',
                boughtDate: undefined,
                boughtAt: null,
              }
            : item
        )
      )
      return { previousItems }
    },
    onSuccess: (updatedItem) => {
      if (updatedItem?.id) {
        queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, (old = []) =>
          old.map((item) =>
            item.id === updatedItem.id
              ? {
                  ...item,
                  ...updatedItem,
                  status: 'planned',
                  boughtDate: undefined,
                  boughtAt: null,
                }
              : item
          )
        )
      }
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SAVE_PLANS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY, context.previousItems)
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsApi.deleteItem(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, (old = []) =>
        old.filter((item) => item.id !== deletedId)
      )
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SAVE_PLANS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => itemsApi.reorderItems(orderedIds),
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY })
      const previousItems = queryClient.getQueryData<RegistryItem[]>(ITEMS_QUERY_KEY)

      if (previousItems) {
        const orderMap = new Map(orderedIds.map((id, index) => [id, index]))
        const reordered = [...previousItems]
          .map((item) => {
            if (orderMap.has(item.id)) {
              return { ...item, sortOrder: orderMap.get(item.id)! }
            }
            return item
          })
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

        queryClient.setQueryData<RegistryItem[]>(ITEMS_QUERY_KEY, reordered)
      }

      return { previousItems }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY, context.previousItems)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
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
    reorderItems: reorderMutation.mutateAsync,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      buyMutation.isPending ||
      unbuyMutation.isPending ||
      deleteMutation.isPending,
  }
}

export const useItemsQuery = useItems


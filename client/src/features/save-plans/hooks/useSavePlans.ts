import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savePlansApi } from '../api/savePlansApi'
import type {
  SavePlan,
  CreateSavePlanPayload,
  SavePlanStatus,
} from '../types/savePlan.types'
import { useSavingsStore, type SavePlanItem } from '@/stores/savingsStore'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { BASELINE_QUERY_KEY } from '@/features/settings/hooks/useBaseline'

export const SAVE_PLANS_QUERY_KEY = ['save-plans']

export const toStorePlanItem = (plan: SavePlan): SavePlanItem => ({
  id: plan.id,
  name: plan.title || plan.name,
  title: plan.title || plan.name,
  type: plan.type || 'targeted',
  category: plan.category || 'general',
  status: (plan.status === 'cancelled' ? 'canceled' : plan.status) as SavePlanItem['status'],
  currentSaved: plan.currentAmount,
  currentAmount: plan.currentAmount,
  targetAmount: plan.targetAmount,
  monthlyContribution: plan.monthlyContribution,
  percentage: plan.percentage,
  linkedItemId: plan.linkedItemId,
  linkedItemName: plan.linkedItemName,
  isPinned: plan.isPinned ?? true,
  iconKey: plan.iconKey,
  targetDate: plan.targetDate,
})

export const useSavePlans = () => {
  const queryClient = useQueryClient()
  const { setPlans } = useSavingsStore()
  const { updateTotalSaved } = useLiquidityStore()

  const query = useQuery<SavePlan[]>({
    queryKey: SAVE_PLANS_QUERY_KEY,
    queryFn: () => savePlansApi.getSavePlans(),
    staleTime: 60 * 1000,
  })

  // Synchronize zustand stores whenever query data resolves
  useEffect(() => {
    if (query.data) {
      const storeItems = query.data.map(toStorePlanItem)
      setPlans(storeItems)

      const activeSaved = query.data
        .filter((p) => p.status === 'active')
        .reduce((sum, p) => sum + (p.currentAmount || 0), 0)

      updateTotalSaved(activeSaved)
    }
  }, [query.data, setPlans, updateTotalSaved])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: SAVE_PLANS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['balance'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateSavePlanPayload) =>
      savePlansApi.createSavePlan(payload),
    onSuccess: invalidateAll,
  })

  const depositMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      savePlansApi.depositToSavePlan(id, { amount }),
    onSuccess: invalidateAll,
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => savePlansApi.completeSavePlan(id),
    onSuccess: invalidateAll,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => savePlansApi.cancelSavePlan(id),
    onSuccess: invalidateAll,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SavePlan> }) =>
      savePlansApi.updateSavePlan(id, updates),
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => savePlansApi.deleteSavePlan(id),
    onSuccess: invalidateAll,
  })

  const plans = query.data ?? []

  const toggleActive = async (id: string) => {
    const target = plans.find((p) => p.id === id)
    if (!target || target.type === 'general_life') return
    const nextStatus: SavePlanStatus =
      target.status === 'active' ? 'deactivated' : 'active'
    return updateMutation.mutateAsync({
      id,
      updates: { status: nextStatus },
    })
  }

  const togglePin = async (id: string) => {
    const target = plans.find((p) => p.id === id)
    if (!target) return
    return updateMutation.mutateAsync({
      id,
      updates: { isPinned: !target.isPinned },
    })
  }

  const depositToPlan = async (id: string, amount: number) => {
    return depositMutation.mutateAsync({ id, amount })
  }

  const activePlans = plans.filter(
    (p) => p.status !== 'canceled' && p.status !== 'cancelled'
  )
  const pinned = activePlans.filter((p) => p.isPinned)
  const unpinned = activePlans.filter((p) => !p.isPinned)
  const pinnedPlans = [...pinned, ...unpinned].slice(0, 3)

  const activeCount = plans.filter(
    (p) => p.status === 'active'
  ).length

  const totalSaved = plans
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + (p.currentAmount || 0), 0)

  return {
    plans,
    pinnedPlans,
    activeCount,
    totalSaved,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createPlan: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    depositToPlan,
    isDepositing: depositMutation.isPending,
    completePlan: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
    cancelPlan: cancelMutation.mutateAsync,
    isCanceling: cancelMutation.isPending,
    toggleActive,
    togglePin,
    deletePlan: deleteMutation.mutateAsync,
    isMutationPending:
      createMutation.isPending ||
      depositMutation.isPending ||
      completeMutation.isPending ||
      cancelMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  }
}


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
  currentSaved:
    plan.isSystemDefault && plan.cumulativeTotal !== undefined
      ? plan.cumulativeTotal
      : plan.currentAmount,
  currentAmount:
    plan.isSystemDefault && plan.cumulativeTotal !== undefined
      ? plan.cumulativeTotal
      : plan.currentAmount,
  targetAmount: plan.targetAmount,
  monthlyContribution: plan.monthlyContribution,
  monthlyDeduction: plan.monthlyDeduction,
  isSystemDefault: plan.isSystemDefault,
  isRemovable: plan.isRemovable,
  targetCycleWindow: plan.targetCycleWindow,
  sourceBalance: plan.sourceBalance,
  cumulativeTotal: plan.cumulativeTotal,
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
        .filter((p) => p.status === 'active' || p.status === 'ACTIVE')
        .reduce((sum, p) => {
          const val =
            p.isSystemDefault && p.cumulativeTotal !== undefined
              ? p.cumulativeTotal
              : p.currentAmount || 0
          return sum + val
        }, 0)

      updateTotalSaved(activeSaved)
    }
  }, [query.data, setPlans, updateTotalSaved])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: SAVE_PLANS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['items'] })
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

  const systemReservePlan = plans.find(
    (p) => p.isSystemDefault || p.type === 'general_life'
  )
  const targetedPlans = plans.filter(
    (p) => !p.isSystemDefault && p.type !== 'general_life'
  )

  const toggleActive = async (id: string) => {
    const target = plans.find((p) => p.id === id)
    if (!target || target.isSystemDefault || target.type === 'general_life') return
    const nextStatus: SavePlanStatus =
      target.status === 'active' || target.status === 'ACTIVE'
        ? 'deactivated'
        : 'active'
    return updateMutation.mutateAsync({
      id,
      updates: { status: nextStatus },
    })
  }

  const toggleReserveStatus = async (id: string) => {
    const target = plans.find((p) => p.id === id)
    if (!target) return
    const isCurrentlyActive =
      target.status === 'active' || target.status === 'ACTIVE'
    const nextStatus = isCurrentlyActive ? 'PAUSED' : 'ACTIVE'
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

  const deletePlanSafely = async (id: string) => {
    const target = plans.find((p) => p.id === id)
    if (target?.isSystemDefault || target?.isRemovable === false) {
      throw new Error('403 Forbidden: System baseline reserve cannot be removed')
    }
    return deleteMutation.mutateAsync(id)
  }

  const activePlans = plans.filter(
    (p) => p.status !== 'canceled' && p.status !== 'cancelled'
  )
  const pinned = activePlans.filter((p) => p.isPinned)
  const unpinned = activePlans.filter((p) => !p.isPinned)
  const pinnedPlans = [...pinned, ...unpinned].slice(0, 3)

  const activeCount = targetedPlans.filter(
    (p) => p.status === 'active' || p.status === 'ACTIVE'
  ).length

  const totalSaved = plans
    .filter((p) => p.status === 'active' || p.status === 'ACTIVE')
    .reduce((sum, p) => {
      const val =
        p.isSystemDefault && p.cumulativeTotal !== undefined
          ? p.cumulativeTotal
          : p.currentAmount || 0
      return sum + val
    }, 0)

  return {
    plans,
    systemReservePlan,
    targetedPlans,
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
    updatePlan: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleActive,
    toggleReserveStatus,
    togglePin,
    deletePlan: deletePlanSafely,
    isMutationPending:
      createMutation.isPending ||
      depositMutation.isPending ||
      completeMutation.isPending ||
      cancelMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  }
}

export const useSavePlansQuery = useSavePlans


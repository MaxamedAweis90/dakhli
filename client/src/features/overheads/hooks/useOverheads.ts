import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { overheadsApi, computeSummary } from '../api/overheadsApi'
import type {
  OverheadBill,
  CreateOverheadPayload,
  UpdateOverheadPayload,
  OverheadSummary,
  OverheadStatus,
} from '../types/overhead.types'
import { BASELINE_QUERY_KEY } from '@/features/settings/hooks/useBaseline'

export const OVERHEADS_QUERY_KEY = ['overheads']

export const useOverheads = (monthKey?: string) => {
  const queryClient = useQueryClient()
  const nowKey = new Date().toISOString().slice(0, 7)
  const targetMonth = monthKey || nowKey

  const isCurrentCycle = targetMonth === nowKey
  const isFutureCycle = targetMonth > nowKey
  const isPastCycle = targetMonth < nowKey

  const queryKey = [...OVERHEADS_QUERY_KEY, targetMonth]

  const query = useQuery<{ bills: OverheadBill[]; summary: OverheadSummary }>({
    queryKey,
    queryFn: () => overheadsApi.getOverheads(targetMonth),
    staleTime: 60 * 1000,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: OVERHEADS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['overhead'] })
    queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    queryClient.invalidateQueries({ queryKey: ['balance'] })
    queryClient.invalidateQueries({ queryKey: ['cashflow'] })
  }

  // 1. Create bill: optimistic prepend to index 0
  const createMutation = useMutation({
    mutationFn: (payload: CreateOverheadPayload) => overheadsApi.createOverhead(payload),
    onSuccess: (newBill) => {
      queryClient.setQueryData<{ bills: OverheadBill[]; summary: OverheadSummary }>(
        queryKey,
        (old) => {
          if (!old) return old
          const existing = old.bills || []
          const filtered = existing.filter((b) => b.id !== newBill.id)
          const updatedBills = [newBill, ...filtered]
          return {
            bills: updatedBills,
            summary: computeSummary(updatedBills, isFutureCycle),
          }
        }
      )
      invalidateAll()
    },
  })

  // 2. Update bill: in-place update retaining order
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOverheadPayload }) =>
      overheadsApi.updateOverhead(id, { ...payload, monthKey: targetMonth }),
    onSuccess: (updatedBill) => {
      queryClient.setQueryData<{ bills: OverheadBill[]; summary: OverheadSummary }>(
        queryKey,
        (old) => {
          if (!old) return old
          const existing = old.bills || []
          const updatedBills = existing.map((b) =>
            b.id === updatedBill.id ? { ...b, ...updatedBill } : b
          )
          return {
            bills: updatedBills,
            summary: computeSummary(updatedBills, isFutureCycle),
          }
        }
      )
      invalidateAll()
    },
  })

  // 3. Toggle active: in-place toggle
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      overheadsApi.updateOverhead(id, { isActive, monthKey: targetMonth }),
    onSuccess: (updatedBill) => {
      queryClient.setQueryData<{ bills: OverheadBill[]; summary: OverheadSummary }>(
        queryKey,
        (old) => {
          if (!old) return old
          const existing = old.bills || []
          const updatedBills = existing.map((b) =>
            b.id === updatedBill.id ? { ...b, ...updatedBill } : b
          )
          return {
            bills: updatedBills,
            summary: computeSummary(updatedBills, isFutureCycle),
          }
        }
      )
      invalidateAll()
    },
  })

  // 4. Update status (Mark Paid / Unpaid)
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      targetMonth: overrideMonth,
    }: {
      id: string
      status: OverheadStatus
      targetMonth?: string
    }) => overheadsApi.updateOverheadStatus(id, status, overrideMonth || targetMonth),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<{ bills: OverheadBill[]; summary: OverheadSummary }>(
        queryKey,
        (old) => {
          if (!old) return old
          const existing = old.bills || []
          const updatedBills = existing.map((b) => {
            if (b.id !== variables.id) return b
            return {
              ...b,
              status: variables.status,
              paidAt: variables.status === 'paid' ? new Date().toISOString() : null,
            }
          })
          return {
            bills: updatedBills,
            summary: computeSummary(updatedBills, isFutureCycle),
          }
        }
      )
      invalidateAll()
    },
  })

  // 5. Delete bill: optimistic remove
  const deleteMutation = useMutation({
    mutationFn: (id: string) => overheadsApi.deleteOverhead(id, targetMonth),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<{ bills: OverheadBill[]; summary: OverheadSummary }>(
        queryKey,
        (old) => {
          if (!old) return old
          const existing = old.bills || []
          const updatedBills = existing.filter((b) => b.id !== deletedId)
          return {
            bills: updatedBills,
            summary: computeSummary(updatedBills, isFutureCycle),
          }
        }
      )
      invalidateAll()
    },
  })

  return {
    bills: query.data?.bills ?? [],
    summary: query.data?.summary ?? {
      totalUnpaid: 0,
      totalPaid: 0,
      totalMonthly: 0,
      billsCount: 0,
      unpaidCount: 0,
      percentagePaid: 0,
    },
    targetMonth,
    isCurrentCycle,
    isFutureCycle,
    isPastCycle,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createOverhead: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateOverhead: (id: string, payload: UpdateOverheadPayload) =>
      updateMutation.mutateAsync({ id, payload }),
    isUpdatingOverhead: updateMutation.isPending,
    toggleActive: (id: string, currentActive: boolean) =>
      toggleActiveMutation.mutateAsync({ id, isActive: !currentActive }),
    isTogglingActive: toggleActiveMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    deleteOverhead: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}

export const useOverheadsQuery = useOverheads

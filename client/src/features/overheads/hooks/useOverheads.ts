import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { overheadsApi } from '../api/overheadsApi'
import type {
  OverheadBill,
  CreateOverheadPayload,
  OverheadSummary,
  OverheadStatus,
} from '../types/overhead.types'
import { BASELINE_QUERY_KEY } from '@/features/settings/hooks/useBaseline'

export const OVERHEADS_QUERY_KEY = ['overheads']

export const useOverheads = (monthKey?: string) => {
  const queryClient = useQueryClient()

  const query = useQuery<{ bills: OverheadBill[]; summary: OverheadSummary }>({
    queryKey: [...OVERHEADS_QUERY_KEY, monthKey || 'current'],
    queryFn: () => overheadsApi.getOverheads(monthKey),
    staleTime: 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateOverheadPayload) => overheadsApi.createOverhead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OVERHEADS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      targetMonth,
    }: {
      id: string
      status: OverheadStatus
      targetMonth?: string
    }) => overheadsApi.updateOverheadStatus(id, status, targetMonth || monthKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OVERHEADS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => overheadsApi.deleteOverhead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OVERHEADS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
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
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createOverhead: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    deleteOverhead: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}

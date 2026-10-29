import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { settingsApi } from '../api/settingsApi'
import type { FinancialBaseline, UpdateBaselinePayload } from '../types/settings.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { queryClient } from '@/lib/query-client'

export const BASELINE_QUERY_KEY = ['baseline']

export const useBaseline = () => {
  const { setLiquidity, setCurrency } = useLiquidityStore()

  const query = useQuery<FinancialBaseline>({
    queryKey: BASELINE_QUERY_KEY,
    queryFn: settingsApi.getBaseline,
    staleTime: 5 * 60 * 1000,
  })

  // Synchronize store when baseline query resolves
  useEffect(() => {
    if (query.data) {
      setLiquidity({
        grossBalance: query.data.grossBalance,
        totalSaved:
          query.data.totalSaved !== undefined
            ? query.data.totalSaved
            : useLiquidityStore.getState().totalSaved,
        currency: query.data.currency,
      })
      setCurrency(query.data.currency)
    }
  }, [query.data, setLiquidity, setCurrency])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBaselinePayload) => settingsApi.updateBaseline(payload),
    onSuccess: (updatedData) => {
      // 1. Sync global liquidity store
      setLiquidity({
        grossBalance: updatedData.grossBalance,
        totalSaved: useLiquidityStore.getState().totalSaved,
        currency: updatedData.currency,
      })
      setCurrency(updatedData.currency)

      // 2. Invalidate caches
      queryClient.setQueryData(BASELINE_QUERY_KEY, updatedData)
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
    },
  })

  return {
    baseline: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateBaseline: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

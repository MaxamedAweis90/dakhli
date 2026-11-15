import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { settingsApi } from '../api/settingsApi'
import type {
  FinancialBaseline,
  UpdateBaselinePayload,
  UserPreferences,
  UpdatePreferencesPayload,
} from '../types/settings.types'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { usePrivacyStore } from '@/stores/privacyStore'
import { queryClient } from '@/lib/query-client'

export const BASELINE_QUERY_KEY = ['baseline']
export const USER_PREFERENCES_QUERY_KEY = ['user-preferences']

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
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
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

export const useUserPreferences = () => {
  const { setCurrency } = useLiquidityStore()
  const { setMasked } = usePrivacyStore()

  const query = useQuery<UserPreferences>({
    queryKey: USER_PREFERENCES_QUERY_KEY,
    queryFn: settingsApi.getPreferences,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data?.currency) {
      setCurrency(query.data.currency)
    }
  }, [query.data?.currency, setCurrency])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePreferencesPayload) => settingsApi.updatePreferences(payload),
    onSuccess: (updatedData, variables) => {
      setCurrency(updatedData.currency)
      if (variables.maskBalancesOnStartup !== undefined) {
        setMasked(updatedData.maskBalancesOnStartup)
      }

      queryClient.setQueryData(USER_PREFERENCES_QUERY_KEY, updatedData)
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

export const useBaselineQuery = useBaseline

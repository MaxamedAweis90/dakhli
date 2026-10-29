import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dailyApi } from '../api/dailyApi'
import type { CheckOffPayload, DailyRecord, DailySummary } from '../types/daily.types'
import { BASELINE_QUERY_KEY } from '@/features/settings/hooks/useBaseline'

export const DAILY_QUERY_KEY = ['daily']

export const useDaily = (monthKey?: string) => {
  const queryClient = useQueryClient()
  const activeMonth = monthKey || new Date().toISOString().slice(0, 7)

  const logsQuery = useQuery<DailyRecord[]>({
    queryKey: [...DAILY_QUERY_KEY, 'logs', activeMonth],
    queryFn: () => dailyApi.getLogs(activeMonth),
    staleTime: 60 * 1000,
  })

  const summaryQuery = useQuery<DailySummary>({
    queryKey: [...DAILY_QUERY_KEY, 'summary', activeMonth],
    queryFn: () => dailyApi.getSummary(activeMonth),
    staleTime: 60 * 1000,
  })

  const checkOffMutation = useMutation({
    mutationFn: (payload: CheckOffPayload) => dailyApi.recordCheckOff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DAILY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: BASELINE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
    },
  })

  const logs = logsQuery.data ?? []
  const summary = summaryQuery.data ?? {
    todayRecord: null,
    currentStreak: 0,
    monthlySavedFromDaily: 0,
    recentLogs: [],
  }

  return {
    logs,
    summary,
    isLoading: logsQuery.isLoading || summaryQuery.isLoading,
    isError: logsQuery.isError || summaryQuery.isError,
    error: logsQuery.error || summaryQuery.error,
    refetch: () => {
      logsQuery.refetch()
      summaryQuery.refetch()
    },
    recordCheckOff: checkOffMutation.mutateAsync,
    isRecording: checkOffMutation.isPending,
  }
}

export const useDailyHistoryQuery = useDaily

import { QueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/types/api'

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) {
    return false
  }

  // Do not retry authorization or not-found errors
  const apiError = error as ApiError | undefined
  if (apiError) {
    if (apiError.code === '401' || apiError.code === '403' || apiError.code === '404') {
      return false
    }
    const details = apiError.details as { status?: number; response?: { status?: number } } | undefined
    const status = details?.status ?? details?.response?.status
    if (status === 401 || status === 403 || status === 404) {
      return false
    }
  }

  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
    },
    mutations: {
      retry: false,
    },
  },
})

export default queryClient

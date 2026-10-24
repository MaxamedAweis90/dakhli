import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiError, ApiErrorResponse } from '@/types/api'

export const TOKEN_STORAGE_KEY = 'dakhli_token'
export const AUTH_UNAUTHORIZED_EVENT = 'dakhli:unauthorized'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT bearer token if available
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // Gracefully fall through if localStorage is inaccessible
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// Response Interceptor: Pass through data, handle 401 and normalize errors
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<ApiErrorResponse | { message?: string }>) => {
    if (error.response?.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
        }
      } catch {
        // Suppress storage cleanup error in restricted contexts
      }
    }

    const payload = error.response?.data
    let message = 'A network error occurred. Please try again.'
    let code: string | undefined = error.code

    if (payload && typeof payload === 'object') {
      if ('error' in payload && payload.error && typeof payload.error === 'object') {
        const backendError = payload.error as ApiError
        message = backendError.message || message
        code = backendError.code || code
      } else if ('message' in payload && typeof payload.message === 'string') {
        message = payload.message
      }
    } else if (error.message) {
      message = error.message
    }

    const normalizedError: ApiError = {
      message,
      code,
      details: payload,
    }

    return Promise.reject(normalizedError)
  }
)

export default api

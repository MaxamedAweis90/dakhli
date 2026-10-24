export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

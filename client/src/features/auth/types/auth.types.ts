export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  authProvider?: 'LOCAL' | 'GOOGLE'
  isVerified?: boolean
  isDeactivated?: boolean
  createdAt?: string
}

export interface AuthResponse {
  token: string
  user: User
  isDeactivated?: false
}

export interface VerifyOtpPayload {
  email: string
  otp: string
}

export interface ResendOtpPayload {
  email: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  name?: string
  initialBalance?: number
  baseMonthlyIncome?: number
  paydayAnchor?: number
}

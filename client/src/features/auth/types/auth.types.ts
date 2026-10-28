export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt?: string
}

export interface AuthResponse {
  token: string
  user: User
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

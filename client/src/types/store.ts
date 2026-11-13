export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string | null
  authProvider?: 'LOCAL' | 'GOOGLE'
  hasPassword?: boolean
  isVerified?: boolean
  isDeactivated?: boolean
  isOnboarded?: boolean
  dormantCycles?: string[]
  createdAt?: string
}


export interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean
  setSession: (token: string, user: AuthUser) => void
  updateUser: (partialUser: Partial<AuthUser>) => void
  clearSession: () => void
  initialize: () => Promise<void> | void
}

export interface LiquidityPayload {
  grossBalance: number
  totalSaved: number
  currency?: string
}

export interface LiquidityState {
  grossBalance: number
  totalSaved: number
  netSpendable: number
  currency: string
  isStale: boolean
  setLiquidity: (payload: LiquidityPayload) => void
  setCurrency: (currency: string) => void
  updateGrossBalance: (newGross: number) => void
  updateTotalSaved: (newSaved: number) => void
  resetLiquidity: () => void
}

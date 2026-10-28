export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
}


export interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  setSession: (token: string, user: AuthUser) => void
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

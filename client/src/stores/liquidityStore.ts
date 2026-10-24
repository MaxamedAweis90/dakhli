import { create } from 'zustand'
import type { LiquidityPayload, LiquidityState } from '@/types/store'

const INITIAL_STATE = {
  grossBalance: 0,
  totalSaved: 0,
  netSpendable: 0,
  currency: 'USD',
  isStale: false,
}

export const useLiquidityStore = create<LiquidityState>((set) => ({
  ...INITIAL_STATE,

  setLiquidity: (payload: LiquidityPayload) => {
    const grossBalance = payload.grossBalance
    const totalSaved = payload.totalSaved
    const netSpendable = grossBalance - totalSaved
    set({
      grossBalance,
      totalSaved,
      netSpendable,
      currency: payload.currency || 'USD',
      isStale: false,
    })
  },

  updateGrossBalance: (newGross: number) => {
    set((state) => ({
      grossBalance: newGross,
      netSpendable: newGross - state.totalSaved,
      isStale: false,
    }))
  },

  updateTotalSaved: (newSaved: number) => {
    set((state) => ({
      totalSaved: newSaved,
      netSpendable: state.grossBalance - newSaved,
      isStale: false,
    }))
  },

  resetLiquidity: () => {
    set({ ...INITIAL_STATE })
  },
}))

export default useLiquidityStore

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SavePlanType = 'targeted' | 'general_life' | 'system_baseline'
export type SavePlanStatus =
  | 'active'
  | 'deactivated'
  | 'completed'
  | 'canceled'
  | 'paused'
  | 'ACTIVE'
  | 'PAUSED'
export type SavePlanCategory = 'emergency' | 'general' | 'item_funding'

export interface SavePlanItem {
  id: string
  name: string
  title?: string
  type: SavePlanType
  category: SavePlanCategory
  status: SavePlanStatus
  currentSaved: number
  currentAmount?: number
  targetAmount?: number
  monthlyContribution?: number
  percentage: number
  linkedItemId?: string
  linkedItemName?: string
  isPinned: boolean
  iconKey?: string
  targetDate?: string
  isSystemDefault?: boolean
  isRemovable?: boolean
  monthlyDeduction?: number
  targetCycleWindow?: string | number | null
  sourceBalance?: 'BASELINE_INCOME' | 'LIQUID_BALANCE'
  cumulativeTotal?: number
}

interface SavingsState {
  plans: SavePlanItem[]
  toggleActive: (id: string) => void
  cancelPlan: (id: string) => void
  completePlan: (id: string) => void
  depositToPlan: (id: string, amount: number) => void
  togglePin: (id: string) => void
  setPlans: (plans: SavePlanItem[]) => void
  addPlan: (plan: Omit<SavePlanItem, 'id' | 'percentage'>) => void
  updatePlan: (id: string, updates: Partial<SavePlanItem>) => void
  deletePlan: (id: string) => void
  resetToDefaults: () => void
  getPinnedPlans: () => SavePlanItem[]
  getActiveCount: () => number
  getTotalSaved: () => number
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('dakhli_savings_store_v4')
  } catch {
    // ignore storage access errors
  }
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set, get) => ({
      plans: [],

      toggleActive: (id: string) => {
        set((state) => ({
          plans: state.plans.map((p) => {
            // General Life savings cannot be deactivated
            if (p.id !== id || p.type === 'general_life') return p
            const nextStatus: SavePlanStatus =
              p.status === 'active' ? 'deactivated' : 'active'
            return { ...p, status: nextStatus }
          }),
        }))
      },

      cancelPlan: (id: string) => {
        set((state) => ({
          plans: state.plans.map((p) => {
            // General Life savings cannot be canceled
            if (p.id !== id || p.type === 'general_life') return p
            return { ...p, status: 'canceled' as SavePlanStatus }
          }),
        }))
      },

      completePlan: (id: string) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id ? { ...p, status: 'completed' as SavePlanStatus, percentage: 100 } : p
          ),
        }))
      },

      depositToPlan: (id: string, amount: number) => {
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== id) return p
            const newSaved = p.currentSaved + amount
            const target = p.targetAmount || 1
            const percentage = Math.min(100, Math.round((newSaved / target) * 100))
            return { ...p, currentSaved: newSaved, percentage }
          }),
        }))
      },

      togglePin: (id: string) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id ? { ...p, isPinned: !p.isPinned } : p
          ),
        }))
      },

      setPlans: (plans: SavePlanItem[]) => set({ plans }),

      addPlan: (planData) => {
        const id = `plan-${Date.now()}`
        const target = planData.targetAmount || 1
        const percentage = Math.min(
          100,
          Math.round((planData.currentSaved / target) * 100)
        )

        const newPlan: SavePlanItem = {
          ...planData,
          id,
          percentage,
        }

        set((state) => ({
          plans: [newPlan, ...state.plans],
        }))
      },

      updatePlan: (id: string, updates: Partial<SavePlanItem>) => {
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== id) return p
            const updated = { ...p, ...updates }
            const target = updated.targetAmount || 1
            updated.percentage = Math.min(
              100,
              Math.round((updated.currentSaved / target) * 100)
            )
            return updated
          }),
        }))
      },

      deletePlan: (id: string) => {
        set((state) => ({
          plans: state.plans.filter((p) => {
            if (p.id === id && (p.isSystemDefault || p.isRemovable === false)) {
              return true // Cannot delete system baseline reserve
            }
            return p.id !== id
          }),
        }))
      },

      resetToDefaults: () => {
        set({ plans: [] })
      },

      getPinnedPlans: () => {
        const activePlans = get().plans.filter((p) => p.status !== 'canceled')
        const pinned = activePlans.filter((p) => p.isPinned)
        if (pinned.length >= 3) {
          return pinned.slice(0, 3)
        }
        const unpinned = activePlans.filter((p) => !p.isPinned)
        return [...pinned, ...unpinned].slice(0, 3)
      },

      getActiveCount: () => {
        return get().plans.filter(
          (p) =>
            p.type === 'targeted' &&
            (p.status === 'active' || p.status === 'ACTIVE') &&
            p.percentage < 100
        ).length
      },

      getTotalSaved: () => {
        return get().plans
          .filter((p) => p.status === 'active' || p.status === 'ACTIVE')
          .reduce(
            (acc, p) =>
              acc +
              (p.isSystemDefault && p.cumulativeTotal !== undefined
                ? p.cumulativeTotal
                : p.currentSaved || 0),
            0
          )
      },
    }),
    {
      name: 'dakhli_savings_store_v5',
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.plans)) {
          state.plans = state.plans.filter((plan) => OBJECT_ID_REGEX.test(plan.id))
        }
      },
    }
  )
)

export default useSavingsStore

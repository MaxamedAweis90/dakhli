import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SavePlanType = 'targeted' | 'general_life'
export type SavePlanStatus = 'active' | 'deactivated' | 'completed' | 'canceled'
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

const DEFAULT_PLANS: SavePlanItem[] = [
  {
    id: 'plan-general-life',
    name: 'General Savings',
    type: 'general_life',
    category: 'general',
    status: 'active',
    currentSaved: 14500,
    targetAmount: 25000,
    monthlyContribution: 300,
    percentage: 58,
    isPinned: true,
  },
  {
    id: 'plan-rent-runway',
    name: '6-Month Rent Runway',
    type: 'targeted',
    category: 'emergency',
    status: 'active',
    currentSaved: 2400,
    targetAmount: 6000,
    percentage: 40,
    isPinned: true,
  },
  {
    id: 'plan-macbook-pro',
    name: 'MacBook Pro',
    type: 'targeted',
    category: 'item_funding',
    status: 'active',
    currentSaved: 600,
    targetAmount: 2000,
    percentage: 30,
    linkedItemId: 'item-pc-setup',
    linkedItemName: 'MacBook Pro 16"',
    isPinned: true,
  },
  {
    id: 'plan-emergency-fund',
    name: 'Emergency Fund',
    type: 'targeted',
    category: 'emergency',
    status: 'active',
    currentSaved: 1000,
    targetAmount: 1000,
    percentage: 100,
    isPinned: true,
  },
]

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set, get) => ({
      plans: DEFAULT_PLANS,

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
          plans: state.plans.filter((p) => p.id !== id),
        }))
      },

      resetToDefaults: () => {
        set({ plans: DEFAULT_PLANS })
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
          (p) => p.type === 'targeted' && p.status === 'active' && p.percentage < 100
        ).length
      },

      getTotalSaved: () => {
        return get().plans
          .filter((p) => p.status === 'active')
          .reduce((acc, p) => acc + p.currentSaved, 0)
      },
    }),
    {
      name: 'dakhli_savings_store_v4',
    }
  )
)

export default useSavingsStore

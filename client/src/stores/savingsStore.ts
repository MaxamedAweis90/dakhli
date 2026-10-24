import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavePlanItem {
  id: string
  name: string
  currentSaved: number
  targetAmount: number
  percentage: number
  isPinned: boolean
  category?: 'emergency' | 'general' | 'item_funding'
}

interface SavingsState {
  plans: SavePlanItem[]
  togglePin: (id: string) => void
  setPlans: (plans: SavePlanItem[]) => void
  addPlan: (plan: Omit<SavePlanItem, 'id'>) => void
  updatePlan: (id: string, updates: Partial<SavePlanItem>) => void
  getPinnedPlans: () => SavePlanItem[]
}

const DEFAULT_PLANS: SavePlanItem[] = [
  {
    id: 'plan-car',
    name: 'Car',
    currentSaved: 4500,
    targetAmount: 10000,
    percentage: 45,
    isPinned: true,
    category: 'general',
  },
  {
    id: 'plan-edu',
    name: 'Education',
    currentSaved: 6800,
    targetAmount: 10000,
    percentage: 68,
    isPinned: true,
    category: 'general',
  },
  {
    id: 'plan-emg',
    name: 'Emergency',
    currentSaved: 3200,
    targetAmount: 10000,
    percentage: 32,
    isPinned: true,
    category: 'emergency',
  },
  {
    id: 'plan-vac',
    name: 'Vacation',
    currentSaved: 5000,
    targetAmount: 5000,
    percentage: 100,
    isPinned: false,
    category: 'general',
  },
]

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set, get) => ({
      plans: DEFAULT_PLANS,
      togglePin: (id: string) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id ? { ...p, isPinned: !p.isPinned } : p
          ),
        }))
      },
      setPlans: (plans: SavePlanItem[]) => set({ plans }),
      addPlan: (plan) => {
        const id = `plan-${Date.now()}`
        set((state) => ({
          plans: [...state.plans, { ...plan, id }],
        }))
      },
      updatePlan: (id: string, updates: Partial<SavePlanItem>) => {
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== id) return p
            const updated = { ...p, ...updates }
            if (updates.currentSaved !== undefined || updates.targetAmount !== undefined) {
              const target = updated.targetAmount || 1
              updated.percentage = Math.min(100, Math.round((updated.currentSaved / target) * 100))
            }
            return updated
          }),
        }))
      },
      getPinnedPlans: () => {
        const plans = get().plans
        const pinned = plans.filter((p) => p.isPinned)
        if (pinned.length >= 3) {
          return pinned.slice(0, 3)
        }
        const unpinned = plans.filter((p) => !p.isPinned)
        return [...pinned, ...unpinned].slice(0, 3)
      },
    }),
    {
      name: 'dakhli_savings_store',
    }
  )
)

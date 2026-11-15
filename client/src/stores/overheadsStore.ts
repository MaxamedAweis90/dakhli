import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const getRealCurrentMonth = (): string => new Date().toISOString().slice(0, 7)

export const getMaxFutureMonth = (baseMonth?: string, offset = 3): string => {
  const base = baseMonth || getRealCurrentMonth()
  const [y, m] = base.split('-').map(Number)
  const date = new Date(y, m - 1 + offset, 1)
  const newY = date.getFullYear()
  const newM = String(date.getMonth() + 1).padStart(2, '0')
  return `${newY}-${newM}`
}

interface OverheadsState {
  currentMonth: string // Format: "YYYY-MM", e.g. "2026-11"
  setMonth: (monthStr: string, minMonth?: string, maxMonth?: string) => void
  prevMonth: (minMonth?: string) => void
  nextMonth: (maxMonth?: string) => void
  jumpToCurrentMonth: () => void
  isAtCreationMonth: (minMonth?: string) => boolean
  isAtFutureLimit: (maxMonth?: string) => boolean
}

if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('dakhli_overheads_store')
    window.localStorage.removeItem('dakhli_overheads_store_v2')
  } catch {
    // ignore storage access errors
  }
}

export const useOverheadsStore = create<OverheadsState>()(
  persist(
    (set, get) => ({
      // Always initialize dynamically to real current month (e.g. 2026-11)
      currentMonth: getRealCurrentMonth(),

      setMonth: (monthStr: string, minMonth?: string, maxMonth?: string) => {
        let finalMonth = monthStr.slice(0, 7)
        if (minMonth) {
          const cleanMin = minMonth.slice(0, 7)
          if (finalMonth < cleanMin) {
            finalMonth = cleanMin
          }
        }
        const limit = maxMonth ? maxMonth.slice(0, 7) : getMaxFutureMonth()
        if (finalMonth > limit) {
          finalMonth = limit
        }
        set({ currentMonth: finalMonth })
      },

      prevMonth: (minMonth?: string) => {
        const current = get().currentMonth
        if (minMonth) {
          const cleanMin = minMonth.slice(0, 7)
          if (current <= cleanMin) {
            return
          }
        }
        const [y, m] = current.split('-').map(Number)
        const date = new Date(y, m - 1 - 1, 1)
        const newY = date.getFullYear()
        const newM = String(date.getMonth() + 1).padStart(2, '0')
        const target = `${newY}-${newM}`
        if (minMonth && target < minMonth.slice(0, 7)) {
          set({ currentMonth: minMonth.slice(0, 7) })
        } else {
          set({ currentMonth: target })
        }
      },

      nextMonth: (maxMonth?: string) => {
        const current = get().currentMonth
        const limit = maxMonth ? maxMonth.slice(0, 7) : getMaxFutureMonth()
        if (current >= limit) {
          return
        }
        const [y, m] = current.split('-').map(Number)
        const date = new Date(y, m - 1 + 1, 1)
        const newY = date.getFullYear()
        const newM = String(date.getMonth() + 1).padStart(2, '0')
        const target = `${newY}-${newM}`
        if (target > limit) {
          set({ currentMonth: limit })
        } else {
          set({ currentMonth: target })
        }
      },

      jumpToCurrentMonth: () => {
        set({ currentMonth: getRealCurrentMonth() })
      },

      isAtCreationMonth: (minMonth?: string) => {
        if (!minMonth) return false
        return get().currentMonth <= minMonth.slice(0, 7)
      },

      isAtFutureLimit: (maxMonth?: string) => {
        const limit = maxMonth ? maxMonth.slice(0, 7) : getMaxFutureMonth()
        return get().currentMonth >= limit
      },
    }),
    {
      name: 'dakhli_overheads_store_v3',
      // Cycle selection always starts cleanly on live current month
      partialize: () => ({}),
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BillCategory = 'key' | 'home' | 'wifi' | 'dumbbell' | 'flash' | 'shield' | 'other'

export interface OverheadBill {
  id: string
  name: string
  category: BillCategory
  dueDate: string // e.g. "Due 1st", "Due 10th", "Due 15th"
  amount: number
  status: 'paid' | 'unpaid'
  paidDate?: string // e.g. "Paid on Oct 1st"
}

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
  bills: OverheadBill[]
  baseTotal: number
  setMonth: (monthStr: string, minMonth?: string, maxMonth?: string) => void
  prevMonth: (minMonth?: string) => void
  nextMonth: (maxMonth?: string) => void
  jumpToCurrentMonth: () => void
  isAtCreationMonth: (minMonth?: string) => boolean
  isAtFutureLimit: (maxMonth?: string) => boolean
  toggleBillPaid: (id: string) => void
  addBill: (bill: Omit<OverheadBill, 'id'>) => void
  deleteBill: (id: string) => void
  
  // Computed values
  getTotalOverhead: () => number
  getTotalPaid: () => number
  getTotalUnpaid: () => number
  getPaidPercentage: () => number
}

const DEFAULT_BILLS: OverheadBill[] = [
  {
    id: 'bill-rent',
    name: 'Rent',
    category: 'key',
    dueDate: 'Due 1st',
    amount: 800,
    status: 'paid',
    paidDate: 'Paid on Oct 1st',
  },
  {
    id: 'bill-internet',
    name: 'Internet',
    category: 'wifi',
    dueDate: 'Due 10th',
    amount: 60,
    status: 'unpaid',
  },
  {
    id: 'bill-gym',
    name: 'Gym',
    category: 'dumbbell',
    dueDate: 'Due 15th',
    amount: 20,
    status: 'paid',
    paidDate: 'paid',
  },
]

export const useOverheadsStore = create<OverheadsState>()(
  persist(
    (set, get) => ({
      // Always initialize dynamically to real current month (e.g. 2026-11)
      currentMonth: getRealCurrentMonth(),
      bills: DEFAULT_BILLS,
      baseTotal: 1200,

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

      toggleBillPaid: (id: string) => {
        set((state) => ({
          bills: state.bills.map((b) => {
            if (b.id !== id) return b
            const isNowPaid = b.status !== 'paid'
            return {
              ...b,
              status: isNowPaid ? 'paid' : 'unpaid',
              paidDate: isNowPaid ? 'Paid on Oct 1st' : undefined,
            }
          }),
        }))
      },

      addBill: (bill) => {
        const id = `bill-${Date.now()}`
        set((state) => ({
          bills: [...state.bills, { ...bill, id }],
          baseTotal: state.baseTotal + bill.amount,
        }))
      },

      deleteBill: (id: string) => {
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id),
        }))
      },

      getTotalOverhead: () => {
        const addedAmount = get().bills.slice(DEFAULT_BILLS.length).reduce((s, b) => s + b.amount, 0)
        return 1200 + addedAmount
      },

      getTotalPaid: () => {
        const internetPaid = get().bills.find((b) => b.id === 'bill-internet')?.status === 'paid'
        const rentUnpaid = get().bills.find((b) => b.id === 'bill-rent')?.status === 'unpaid'
        const gymUnpaid = get().bills.find((b) => b.id === 'bill-gym')?.status === 'unpaid'
        
        let paid = 400
        if (internetPaid) paid += 60
        if (rentUnpaid) paid = Math.max(0, paid - 800)
        if (gymUnpaid) paid = Math.max(0, paid - 20)

        const customPaid = get().bills.slice(DEFAULT_BILLS.length)
          .filter((b) => b.status === 'paid')
          .reduce((s, b) => s + b.amount, 0)

        return paid + customPaid
      },

      getTotalUnpaid: () => {
        const total = get().getTotalOverhead()
        const paid = get().getTotalPaid()
        return Math.max(0, total - paid)
      },

      getPaidPercentage: () => {
        const total = get().getTotalOverhead()
        if (total <= 0) return 0
        const paid = get().getTotalPaid()
        return Math.min(100, Math.round((paid / total) * 100))
      },
    }),
    {
      name: 'dakhli_overheads_store',
      // Strictly exclude currentMonth from persistent storage so login always starts on live current month
      partialize: (state) => ({
        bills: state.bills,
        baseTotal: state.baseTotal,
      }),
    }
  )
)

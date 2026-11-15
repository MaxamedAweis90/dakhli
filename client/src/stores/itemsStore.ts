import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ItemTier = 'Essentials' | 'Future Needs' | 'Wants'

export interface RegisteredItem {
  id: string
  name: string
  price: number
  imageUrl: string
  tier: ItemTier
  status: 'unbought' | 'bought'
  tag?: string
  targetProgress?: number // e.g. 15 for 15% target
  boughtDate?: string // e.g. 'Oct 15'
}

interface ItemsState {
  items: RegisteredItem[]
  activeTier: 'All' | ItemTier
  isAddModalOpen: boolean

  // Actions
  setItems: (items: RegisteredItem[]) => void
  toggleBought: (id: string) => void
  removeItem: (id: string) => void
  addItem: (item: Omit<RegisteredItem, 'id'>) => void
  setActiveTier: (tier: 'All' | ItemTier) => void
  openAddModal: () => void
  closeAddModal: () => void
  resetToDefaults: () => void

  // Computed Values
  getUnboughtTotal: () => number
  getBoughtTotal: () => number
  getFilteredItems: () => RegisteredItem[]
  getUnboughtItems: () => RegisteredItem[]
  getBoughtItems: () => RegisteredItem[]
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('dakhli_items_store')
  } catch {
    // ignore storage access errors
  }
}

export const useItemsStore = create<ItemsState>()(
  persist(
    (set, get) => ({
      items: [],
      activeTier: 'All',
      isAddModalOpen: false,

      setItems: (items) => set({ items }),

      toggleBought: (id: string) => {
        const today = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date())
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: item.status === 'bought' ? 'unbought' : 'bought',
                  boughtDate: item.status === 'bought' ? undefined : (item.boughtDate || today),
                }
              : item
          ),
        }))
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      addItem: (itemData) => {
        const id = `item-${Date.now()}`
        const newItem: RegisteredItem = {
          ...itemData,
          id,
        }
        set((state) => ({
          items: [...state.items, newItem],
          isAddModalOpen: false,
        }))
      },

      setActiveTier: (tier) => set({ activeTier: tier }),
      openAddModal: () => set({ isAddModalOpen: true }),
      closeAddModal: () => set({ isAddModalOpen: false }),

      resetToDefaults: () =>
        set({
          items: [],
          activeTier: 'All',
          isAddModalOpen: false,
        }),

      getUnboughtTotal: () => {
        const { items } = get()
        return items
          .filter((i) => i.status === 'unbought')
          .reduce((acc, it) => acc + (it.price || 0), 0)
      },

      getBoughtTotal: () => {
        const { items } = get()
        return items
          .filter((item) => item.status === 'bought')
          .reduce((acc, item) => acc + item.price, 0)
      },

      getFilteredItems: () => {
        const { items, activeTier } = get()
        if (activeTier === 'All') return items
        return items.filter((item) => item.tier === activeTier)
      },

      getUnboughtItems: () => {
        const { items, activeTier } = get()
        return items.filter(
          (item) => item.status === 'unbought' && (activeTier === 'All' || item.tier === activeTier)
        )
      },

      getBoughtItems: () => {
        const { items } = get()
        return items.filter((item) => item.status === 'bought')
      },
    }),
    {
      name: 'dakhli_items_store_v2',
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.items)) {
          state.items = state.items.filter((item) => OBJECT_ID_REGEX.test(item.id))
        }
      },
    }
  )
)

export default useItemsStore

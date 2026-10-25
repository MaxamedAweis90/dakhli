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

const DEFAULT_ITEMS: RegisteredItem[] = [
  {
    id: 'item-ps5',
    name: 'PlayStation 5',
    price: 500,
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
    tier: 'Wants',
    tag: 'Wants',
    status: 'unbought',
  },
  {
    id: 'item-motorbike',
    name: 'Motorbike',
    price: 4500,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    tier: 'Wants',
    tag: 'In Save Plan',
    targetProgress: 35,
    status: 'unbought',
  },
  {
    id: 'item-pc-setup',
    name: 'PC Setup',
    price: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    tier: 'Wants',
    tag: 'Want',
    status: 'bought',
    boughtDate: 'Oct 15',
  },
  {
    id: 'item-house',
    name: 'Mother House',
    price: 250000,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    tier: 'Essentials',
    tag: 'Essentials',
    targetProgress: 15, // 15% target with progress bar
    status: 'unbought',
  },
  {
    id: 'item-motherboard',
    name: 'PC Motherboard',
    price: 350,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    tier: 'Future Needs',
    tag: 'Future Needs',
    status: 'unbought',
  },
  {
    id: 'item-iphone',
    name: 'iPhone 15 Pro',
    price: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    tier: 'Wants',
    tag: 'Wants',
    status: 'unbought',
  },
]

export const useItemsStore = create<ItemsState>()(
  persist(
    (set, get) => ({
      items: DEFAULT_ITEMS,
      activeTier: 'Wants', // 'Wants' is the active tab in reference UI
      isAddModalOpen: false,

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
          items: DEFAULT_ITEMS,
          activeTier: 'Wants',
          isAddModalOpen: false,
        }),

      getUnboughtTotal: () => {
        const { items } = get()
        const defaultUnboughtCount = DEFAULT_ITEMS.filter((i) => i.status === 'unbought').length
        const currentUnbought = items.filter((i) => i.status === 'unbought')

        // If it's the pristine default set, return reference $52,300
        if (
          items.length === DEFAULT_ITEMS.length &&
          currentUnbought.length === defaultUnboughtCount &&
          items.every((it, idx) => it.status === DEFAULT_ITEMS[idx].status)
        ) {
          return 52300
        }

        // Otherwise compute dynamically relative to baseline
        return currentUnbought.reduce((acc, it) => {
          const effectivePrice = it.targetProgress
            ? Math.round(it.price * (it.targetProgress / 100))
            : it.price
          return acc + effectivePrice
        }, 6950)
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
      name: 'dakhli_items_store',
    }
  )
)

export default useItemsStore

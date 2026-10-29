import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from '@/components/shared/icons'
import {
  RegistryItemCard,
  AddRegistryItemCard,
  type RegistryItem,
  type TierKey,
} from '@/components/shared/RegistryItemCard'
import { useItems } from '@/features/items/hooks/useItems'
import { useItemsStore } from '@/stores/itemsStore'
import { cn } from '@/lib/utils'

export interface ItemRegistryCardProps {
  className?: string
}

const TABS: { key: TierKey; label: string }[] = [
  { key: 'essentials', label: 'Essentials' },
  { key: 'future', label: 'Future Needs' },
  { key: 'wants', label: 'Wants' },
]

const REGISTRY_DATA: Record<TierKey, RegistryItem[]> = {
  essentials: [
    {
      id: 'serum',
      name: 'Serum',
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=260&auto=format&fit=crop&q=80',
      tier: 'essentials',
      targetPrice: 38,
      savedAmount: 25,
    },
    {
      id: 'coffee',
      name: 'Coffee Brewer',
      imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=260&auto=format&fit=crop&q=80',
      tier: 'essentials',
      targetPrice: 85,
      savedAmount: 85,
    },
    {
      id: 'flask',
      name: 'Water Flask',
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=260&auto=format&fit=crop&q=80',
      tier: 'essentials',
      targetPrice: 45,
      // No plan linked
    },
    {
      id: 'lamp',
      name: 'Desk Lamp',
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=260&auto=format&fit=crop&q=80',
      tier: 'essentials',
      targetPrice: 60,
      // No plan linked
    },
    {
      id: 'pillow',
      name: 'Sleep Pillow',
      imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=260&auto=format&fit=crop&q=80',
      tier: 'essentials',
      targetPrice: 70,
      savedAmount: 35,
    },
    {
      id: 'candle',
      name: 'Aroma Candle',
      imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=260&auto=format&fit=crop&q=80',
      tier: 'essentials',
      targetPrice: 42,
      // No plan linked
    },
    {
      id: 'carafe',
      name: 'Oil Carafe',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=260&auto=format&fit=crop&q=80',
      tier: 'essentials',
      targetPrice: 30,
      savedAmount: 18,
    },
  ],
  future: [
    {
      id: 'watch',
      name: 'Smart Watch',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=260&auto=format&fit=crop&q=80',
      tier: 'future',
      targetPrice: 350,
      savedAmount: 140,
    },
    {
      id: 'keyboard',
      name: 'Keyboard',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=260&auto=format&fit=crop&q=80',
      tier: 'future',
      targetPrice: 180,
      savedAmount: 90,
    },
    {
      id: 'backpack',
      name: 'Backpack',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=260&auto=format&fit=crop&q=80',
      tier: 'future',
      targetPrice: 120,
      // No plan linked
    },
    {
      id: 'earbuds',
      name: 'Audio Buds',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=260&auto=format&fit=crop&q=80',
      tier: 'future',
      targetPrice: 150,
      savedAmount: 75,
    },
  ],
  wants: [
    {
      id: 'headphones',
      name: 'Headphones',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=260&auto=format&fit=crop&q=80',
      tier: 'wants',
      targetPrice: 280,
      savedAmount: 196,
    },
    {
      id: 'sunglasses',
      name: 'Sunglasses',
      imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=260&auto=format&fit=crop&q=80',
      tier: 'wants',
      targetPrice: 210,
      // No plan linked
    },
    {
      id: 'sneakers',
      name: 'Sneakers',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=260&auto=format&fit=crop&q=80',
      tier: 'wants',
      targetPrice: 160,
      savedAmount: 48,
    },
    {
      id: 'camera',
      name: 'Vintage Camera',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=260&auto=format&fit=crop&q=80',
      tier: 'wants',
      targetPrice: 450,
      // No plan linked
    },
  ],
}

const mapTabToContractTier = (tab: TierKey): 'essentials' | 'future_needs' | 'wants' => {
  if (tab === 'essentials') return 'essentials'
  if (tab === 'future') return 'future_needs'
  return 'wants'
}

const mapTabToStoreTier = (tab: TierKey): 'Essentials' | 'Future Needs' | 'Wants' => {
  if (tab === 'essentials') return 'Essentials'
  if (tab === 'future') return 'Future Needs'
  return 'Wants'
}

export const ItemRegistryCard: React.FC<ItemRegistryCardProps> = ({ className }) => {
  const [tab, setTab] = useState<TierKey>('essentials')
  const navigate = useNavigate()
  const { allUnboughtItems } = useItems()
  const { setActiveTier, openAddModal } = useItemsStore()

  const contractTier = mapTabToContractTier(tab)

  const liveTierItems: RegistryItem[] = allUnboughtItems
    .filter((item) => item.tier === contractTier)
    .slice(0, 7)
    .map((item) => ({
      id: item.id,
      name: item.title || item.name,
      imageUrl: item.imageUrl,
      tier: tab,
      targetPrice: item.targetPrice,
      savedAmount:
        item.savedAmount !== undefined
          ? item.savedAmount
          : item.targetProgress !== undefined
          ? Math.round(item.targetPrice * (item.targetProgress / 100))
          : undefined,
    }))

  // If the user has any live items in the registry, use live tier items; otherwise fall back to preview tiles
  const items = allUnboughtItems.length > 0 ? liveTierItems : REGISTRY_DATA[tab]

  const handleOpenItemOnPage = () => {
    setActiveTier(mapTabToStoreTier(tab))
    navigate('/items')
  }

  const handleAddClick = () => {
    setActiveTier(mapTabToStoreTier(tab))
    openAddModal()
    navigate('/items')
  }

  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.1rem] pb-[1.25rem] flex flex-col select-none h-auto min-h-fit',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Link
          to="/items"
          className="text-[0.85rem] leading-4 font-normal text-white hover:text-white/90 flex items-center gap-1 group transition-colors"
        >
          <span>Item Registry</span>
          <ChevronRight className="w-3 h-3 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        className="shrink-0 w-full mt-[0.75rem] flex items-center gap-[0.5rem] overflow-x-auto no-scrollbar"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'shrink-0 h-[2.1rem] px-[1rem] rounded-full text-[0.8rem] font-medium leading-none cursor-pointer transition-colors',
              tab === t.key
                ? 'bg-[#303030] text-white shadow-sm'
                : 'text-[#c9c9c9] shadow-[inset_0_0_0_0.0625rem_rgba(255,255,255,0.1)] hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Unified Grid: 4 columns of RegistryItemCards + Add item card */}
      <div className="mt-[0.9rem] grid grid-cols-4 gap-x-[0.625rem] gap-y-[1.1rem]">
        {items.map((item) => (
          <RegistryItemCard
            key={item.id}
            item={item}
            onClick={handleOpenItemOnPage}
          />
        ))}
        <AddRegistryItemCard onClick={handleAddClick} />
      </div>
    </div>
  )
}

export default ItemRegistryCard

import React from 'react'
import { ItemTabsBar } from './components/ItemTabsBar'
import { RegisteredItemCard } from './components/RegisteredItemCard'
import { BoughtItemsList } from './components/BoughtItemsList'
import { AddItemModal } from './components/AddItemModal'
import { useItemsStore } from '@/stores/itemsStore'
import { useItems } from './hooks/useItems'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import { useSavePlans } from '@/features/save-plans/hooks/useSavePlans'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)

export const ItemsPage: React.FC = () => {
  useBaseline()
  useSavePlans()

  const {
    activeTier,
    isAddModalOpen,
    setActiveTier,
    openAddModal,
    closeAddModal,
  } = useItemsStore()

  const {
    unboughtItems,
    boughtItems,
    unboughtTotal,
    createItem,
    toggleBought,
    removeItem,
    isCreating,
    isMutating,
  } = useItems(activeTier)

  const liquidityStore = useLiquidityStore()
  const currentCode = (liquidityStore.currency in CURRENCY_CONFIGS
    ? liquidityStore.currency
    : 'USD') as CurrencyCode
  const currencyConfig = CURRENCY_CONFIGS[currentCode]
  const rate = currencyConfig.rate ?? 1
  const convertedUnboughtTotal = unboughtTotal * rate

  return (
    <div className="flex flex-col gap-6 pb-14 pt-1 select-none">
      {/* Subheader: Tier Tabs & Add Item Action */}
      <ItemTabsBar
        activeTier={activeTier}
        onSelectTier={setActiveTier}
        onAddItem={openAddModal}
      />

      {/* Section 1: Active Unbought Items 3-Column Card Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {unboughtItems.map((item) => (
            <RegisteredItemCard
              key={item.id}
              item={item}
              onToggleBought={toggleBought}
              onRemove={removeItem}
              isMutating={isMutating}
            />
          ))}

          {unboughtItems.length === 0 && (
            <div className="col-span-full py-14 text-center text-[#8E92A0] rounded-[1.25rem] bg-[#17181D]/50 border border-white/[0.03]">
              <p className="text-[0.92rem]">No active unbought items in {activeTier}.</p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-2.5 text-[0.82rem] font-medium text-[#D4A359] hover:underline cursor-pointer"
              >
                + Add an item to this tier
              </button>
            </div>
          )}
        </div>

        {/* Unbought Totals Summary matching reference */}
        <div className="mt-5 flex items-center text-[0.92rem] text-[#8E92A0] select-none">
          <span>Unbought totals:</span>
          <span className="text-white font-semibold text-[1.05rem] font-mono ml-2 tracking-tight">
            {currencyConfig.symbol}{fmt(convertedUnboughtTotal)}
          </span>
        </div>
      </div>

      {/* Section 2: Minimalist Bought Items List Ledger (No Cards) */}
      <div className="mt-2">
        <BoughtItemsList
          items={boughtItems}
          onUndoBought={toggleBought}
          onRemove={removeItem}
          isMutating={isMutating}
        />
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onAdd={createItem}
        isSubmitting={isCreating}
      />
    </div>
  )
}

export default ItemsPage

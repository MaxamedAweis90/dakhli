import React from 'react'
import { ItemTabsBar } from './components/ItemTabsBar'
import { RegisteredItemCard } from './components/RegisteredItemCard'
import { ItemsBottomTotals } from './components/ItemsBottomTotals'
import { AddItemModal } from './components/AddItemModal'
import { useItemsStore } from '@/stores/itemsStore'

export const ItemsPage: React.FC = () => {
  const {
    activeTier,
    isAddModalOpen,
    setActiveTier,
    openAddModal,
    closeAddModal,
    toggleBought,
    removeItem,
    addItem,
    getUnboughtTotal,
    getBoughtTotal,
    getFilteredItems,
    items,
  } = useItemsStore()

  const filteredItems = getFilteredItems()
  const unboughtTotal = getUnboughtTotal()
  const boughtTotal = getBoughtTotal()
  const boughtCount = items.filter((i) => i.status === 'bought').length

  return (
    <div className="flex flex-col pb-12 pt-1 select-none">
      {/* Subheader: Tabs & Add Item Action */}
      <ItemTabsBar
        activeTier={activeTier}
        onSelectTier={setActiveTier}
        onAddItem={openAddModal}
      />

      {/* 3-Column Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mt-6 mb-8 items-stretch">
        {filteredItems.map((item) => (
          <RegisteredItemCard
            key={item.id}
            item={item}
            onToggleBought={toggleBought}
            onRemove={removeItem}
          />
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#8E92A0]">
            <p className="text-[0.95rem]">No items found in {activeTier}.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-3 text-[0.85rem] font-medium text-[#D4A359] hover:underline cursor-pointer"
            >
              + Add an item to this tier
            </button>
          </div>
        )}
      </div>

      {/* Bottom Summary: Unbought Totals (Left) + Bought Items Total (Far Right) */}
      <ItemsBottomTotals
        unboughtTotal={unboughtTotal}
        boughtTotal={boughtTotal}
        boughtCount={boughtCount}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onAdd={addItem}
      />
    </div>
  )
}

export default ItemsPage

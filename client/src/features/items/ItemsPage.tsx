import React, { useState, useEffect, useRef } from "react";
import { ItemTabsBar } from "./components/ItemTabsBar";
import { RegisteredItemCard } from "./components/RegisteredItemCard";
import { BoughtItemsList } from "./components/BoughtItemsList";
import { AddItemModal } from "./components/AddItemModal";
import { EditItemModal } from "./components/EditItemModal";
import { useItemsStore } from "@/stores/itemsStore";
import { useItems } from "./hooks/useItems";
import { useBaseline } from "@/features/settings/hooks/useBaseline";
import { useSavePlans } from "@/features/save-plans/hooks/useSavePlans";
import { useLiquidityStore } from "@/stores/liquidityStore";
import { usePrivacyStore, getDynamicBullets } from "@/stores/privacyStore";
import {
  CURRENCY_CONFIGS,
  type CurrencyCode,
} from "@/features/settings/types/settings.types";
import type {
  CreateItemPayload,
  RegistryItem,
  UpdateItemPayload,
} from "./types/item.types";

const fmt = (n: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export const ItemsPage: React.FC = () => {
  useBaseline();
  useSavePlans();

  const {
    activeTier,
    isAddModalOpen,
    setActiveTier,
    openAddModal,
    closeAddModal,
  } = useItemsStore();

  const {
    items,
    unboughtItems,
    boughtItems,
    unboughtTotal,
    createItem,
    updateItem,
    toggleBought,
    removeItem,
    isCreating,
    isMutating,
  } = useItems(activeTier);

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );
  const [highlightedBadgeLabel, setHighlightedBadgeLabel] = useState<
    "Just Added" | "Restored"
  >("Just Added");
  const [boughtHighlightId, setBoughtHighlightId] = useState<string | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const scrolledItemRef = useRef<string | null>(null);

  const scrollToVerticalCenter = (el: HTMLElement) => {
    const mainContainer = el.closest("main");
    if (mainContainer) {
      const containerRect = mainContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetScrollTop =
        mainContainer.scrollTop +
        (elRect.top - containerRect.top) -
        (containerRect.height / 2 - elRect.height / 2);
      mainContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        left: 0,
        behavior: "smooth",
      });
    }
  };

  const handleCreateItem = async (payload: CreateItemPayload) => {
    const newItem = await createItem(payload);
    if (newItem?.id) {
      // If the current filter tier hides this item, switch to its tier so it's visible
      if (
        activeTier !== "All" &&
        newItem.displayTier &&
        activeTier !== newItem.displayTier
      ) {
        setActiveTier(newItem.displayTier);
      }

      setHighlightedBadgeLabel("Just Added");
      scrolledItemRef.current = null;
      setHighlightedItemId(newItem.id);
    }
    return newItem;
  };

  const handleUpdateItem = async (id: string, payload: UpdateItemPayload) => {
    setIsUpdating(true);
    try {
      await updateItem({ id, payload });
      setEditingItem(null);
    } catch (err) {
      console.error("[ItemsPage] Failed to update item:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBought = (id: string) => {
    // Optimistic toggle: immediate state & highlight change without UI network blocking
    toggleBought(id);
    setBoughtHighlightId(id);

    const attemptScroll = () => {
      const row = document.getElementById(`bought-row-${id}`);
      const section = document.getElementById("bought-items-section");
      const target = row || section;
      if (target) {
        scrollToVerticalCenter(target);
      }
    };

    setTimeout(attemptScroll, 40);
    setTimeout(attemptScroll, 160);

    setTimeout(() => {
      setBoughtHighlightId((prev) => (prev === id ? null : prev));
    }, 2800);
  };

  const handleUndoBought = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (
      activeTier !== "All" &&
      target?.displayTier &&
      activeTier !== target.displayTier
    ) {
      setActiveTier(target.displayTier);
    }

    toggleBought(id);

    setHighlightedBadgeLabel("Restored");
    scrolledItemRef.current = null;
    setHighlightedItemId(id);

    const attemptScroll = () => {
      const el = document.getElementById(`item-card-${id}`);
      if (el) {
        scrollToVerticalCenter(el);
      }
    };

    setTimeout(attemptScroll, 40);
    setTimeout(attemptScroll, 180);

    setTimeout(() => {
      setHighlightedItemId((prev) => (prev === id ? null : prev));
    }, 2800);
  };

  // Smooth scroll to the newly created item and fade the highlight after a duration
  useEffect(() => {
    if (!highlightedItemId) return;

    const attemptScroll = () => {
      const el = document.getElementById(`item-card-${highlightedItemId}`);
      if (el && scrolledItemRef.current !== highlightedItemId) {
        scrolledItemRef.current = highlightedItemId;
        scrollToVerticalCenter(el);
      }
    };

    // Scroll attempts to ensure the DOM has painted the new card
    const timer1 = setTimeout(attemptScroll, 60);
    const timer2 = setTimeout(attemptScroll, 200);

    // Fade out highlight after showcase duration (3.2 seconds)
    const clearTimer = setTimeout(() => {
      setHighlightedItemId((prev) =>
        prev === highlightedItemId ? null : prev,
      );
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(clearTimer);
    };
  }, [highlightedItemId, unboughtItems]);

  const liquidityStore = useLiquidityStore();
  const currentCode = (
    liquidityStore.currency in CURRENCY_CONFIGS
      ? liquidityStore.currency
      : "USD"
  ) as CurrencyCode;
  const currencyConfig = CURRENCY_CONFIGS[currentCode];
  const rate = currencyConfig.rate ?? 1;
  const convertedUnboughtTotal = unboughtTotal * rate;
  const isMasked = usePrivacyStore((state) => state.isMasked);

  return (
    <div className="flex flex-col gap-6 pb-14 pt-1 px-1.5 select-none">
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
              isHighlighted={highlightedItemId === item.id}
              badgeLabel={highlightedBadgeLabel}
              onToggleBought={handleToggleBought}
              onRemove={removeItem}
              onEdit={(it) => setEditingItem(it as RegistryItem)}
              isMutating={isMutating}
            />
          ))}

          {unboughtItems.length === 0 && (
            <div className="col-span-full py-14 text-center text-[#8E92A0] rounded-[1.25rem] bg-[#17181D]/50 border border-white/[0.03]">
              <p className="text-[0.92rem]">
                No active unbought items in {activeTier}.
              </p>
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
            {currencyConfig.symbol}
            {isMasked
              ? getDynamicBullets(convertedUnboughtTotal)
              : fmt(convertedUnboughtTotal)}
          </span>
        </div>
      </div>

      {/* Section 2: Minimalist Bought Items List Ledger (No Cards) */}
      <div className="mt-2">
        <BoughtItemsList
          items={boughtItems}
          onUndoBought={handleUndoBought}
          onRemove={removeItem}
          highlightedRowId={boughtHighlightId}
          isMutating={isMutating}
        />
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onAdd={handleCreateItem}
        isSubmitting={isCreating}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onUpdate={handleUpdateItem}
        isSubmitting={isUpdating}
      />
    </div>
  );
};

export default ItemsPage;

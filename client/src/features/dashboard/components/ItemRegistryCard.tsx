import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "@/components/shared/icons";
import {
  RegistryItemCard,
  AddRegistryItemCard,
  type RegistryItem,
  type TierKey,
} from "@/components/shared/RegistryItemCard";
import { useItems } from "@/features/items/hooks/useItems";
import { useItemsStore } from "@/stores/itemsStore";
import { AddItemModal } from "@/features/items/components/AddItemModal";
import { cn } from "@/lib/utils";

export interface ItemRegistryCardProps {
  className?: string;
}

const TABS: { key: TierKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "essentials", label: "Essentials" },
  { key: "future", label: "Future Needs" },
  { key: "wants", label: "Wants" },
];

const mapTabToContractTier = (
  tab: TierKey,
): "essentials" | "future_needs" | "wants" | null => {
  if (tab === "essentials") return "essentials";
  if (tab === "future") return "future_needs";
  if (tab === "wants") return "wants";
  return null;
};

const mapTabToStoreTier = (
  tab: TierKey,
): "All" | "Essentials" | "Future Needs" | "Wants" => {
  if (tab === "all") return "All";
  if (tab === "essentials") return "Essentials";
  if (tab === "future") return "Future Needs";
  return "Wants";
};

export const ItemRegistryCard: React.FC<ItemRegistryCardProps> = ({
  className,
}) => {
  const [tab, setTab] = useState<TierKey>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();
  const { allUnboughtItems, createItem, isCreating } = useItems();
  const { setActiveTier } = useItemsStore();

  const contractTier = mapTabToContractTier(tab);

  const liveTierItems: RegistryItem[] = (
    tab === "all"
      ? allUnboughtItems
      : allUnboughtItems.filter((item) => item.tier === contractTier)
  )
    .slice(0, 7)
    .map((item) => ({
      id: item.id,
      name: item.title || item.name,
      imageUrl: item.imageUrl,
      tier:
        item.tier === "future_needs"
          ? "future"
          : item.tier === "wants"
            ? "wants"
            : "essentials",
      targetPrice: item.targetPrice,
      savePlanId: item.savePlanId,
      savedAmount:
        item.savedAmount !== undefined
          ? item.savedAmount
          : item.targetProgress !== undefined
            ? Math.round(item.targetPrice * (item.targetProgress / 100))
            : undefined,
    }));

  const items = liveTierItems;

  const handleOpenItemOnPage = () => {
    setActiveTier(mapTabToStoreTier(tab));
    navigate("/items");
  };

  const handleAddClick = () => {
    setActiveTier(mapTabToStoreTier(tab));
    setIsAddModalOpen(true);
  };

  return (
    <div
      className={cn(
        "rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.1rem] pb-[1.25rem] flex flex-col select-none h-auto min-h-fit min-w-0 overflow-hidden",
        className,
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
              "shrink-0 h-[2.1rem] px-[1rem] rounded-full text-[0.8rem] font-medium leading-none cursor-pointer transition-colors",
              tab === t.key
                ? "bg-[#303030] text-white shadow-sm"
                : "text-[#c9c9c9] shadow-[inset_0_0_0_0.0625rem_rgba(255,255,255,0.1)] hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Unified Grid or Empty State */}
      {items.length === 0 ? (
        <div className="mt-[0.9rem] rounded-xl bg-[#13151B] border border-white/[0.05] px-4 py-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-mono text-slate-500">
              No items in this tier
            </p>
            <button
              type="button"
              onClick={handleAddClick}
              className="text-xs font-mono text-[#E5A855] hover:underline cursor-pointer"
            >
              + Add item
            </button>
          </div>
          <div className="w-[4.5rem]">
            <AddRegistryItemCard onClick={handleAddClick} />
          </div>
        </div>
      ) : (
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
      )}

      {/* Quick Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={createItem}
        isSubmitting={isCreating}
      />
    </div>
  );
};

export default ItemRegistryCard;

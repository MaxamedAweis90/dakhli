import React, { useState } from "react";
import { MoreHorizontal, Plus, Check } from "lucide-react";
import { type SavePlanItem, useSavingsStore } from "@/stores/savingsStore";
import type { SavePlan } from "../types/savePlan.types";
import { useLiquidityStore } from "@/stores/liquidityStore";
import {
  CURRENCY_CONFIGS,
  type CurrencyCode,
} from "@/features/settings/types/settings.types";
import { cn } from "@/lib/utils";

interface SavePlanCardProps {
  plan: SavePlan | SavePlanItem;
  onDeposit?: (id: string, amount: number) => Promise<any> | void;
  onToggleActive?: (id: string) => Promise<any> | void;
  onCancel?: (id: string) => Promise<any> | void;
  onComplete?: (id: string) => Promise<any> | void;
  onTogglePin?: (id: string) => Promise<any> | void;
  onDelete?: (id: string) => Promise<any> | void;
  isMutating?: boolean;
}

export const SavePlanCard: React.FC<SavePlanCardProps> = ({
  plan,
  onDeposit,
  onToggleActive,
  onCancel,
  onComplete,
  onTogglePin,
  onDelete,
  isMutating = false,
}) => {
  const store = useSavingsStore();
  const liquidityStore = useLiquidityStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [depositAmount, setDepositAmount] = useState("100");

  const currentCode = (
    liquidityStore.currency in CURRENCY_CONFIGS
      ? liquidityStore.currency
      : "USD"
  ) as CurrencyCode;
  const currencyConfig = CURRENCY_CONFIGS[currentCode];
  const rate = currencyConfig.rate ?? 1;

  const formatCurrency = (val?: number): string => {
    if (val === undefined || isNaN(val)) return `${currencyConfig.symbol}0`;
    const converted = val * rate;
    return `${currencyConfig.symbol}${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(converted)}`;
  };

  const displayTitle = "title" in plan && plan.title ? plan.title : plan.name;
  const currentSaved =
    "currentAmount" in plan && plan.currentAmount !== undefined
      ? plan.currentAmount
      : plan.currentSaved;

  const isGeneralLife = plan.type === "general_life";
  const isAlreadyCompleted = plan.status === "completed";
  const isGoalReached =
    isAlreadyCompleted || (plan.type === "targeted" && plan.percentage >= 100);
  const isCanceled = plan.status === "canceled" || plan.status === "cancelled";
  const isActive = plan.status === "active";

  // Clamp percentage
  const clampedPercentage = Math.min(100, Math.max(0, plan.percentage));

  const handleDeposit = async (amount: number) => {
    if (amount <= 0 || isNaN(amount)) return;
    if (onDeposit) {
      await onDeposit(plan.id, amount);
    } else {
      store.depositToPlan(plan.id, amount);
    }
    setShowDepositInput(false);
  };

  const handleToggleActive = async () => {
    if (onToggleActive) {
      await onToggleActive(plan.id);
    } else {
      store.toggleActive(plan.id);
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel(plan.id);
    } else {
      store.cancelPlan(plan.id);
    }
  };

  const handleComplete = async () => {
    if (onComplete) {
      await onComplete(plan.id);
    } else {
      store.completePlan(plan.id);
    }
  };

  const handleTogglePin = async () => {
    if (onTogglePin) {
      await onTogglePin(plan.id);
    } else {
      store.togglePin(plan.id);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(plan.id);
    } else {
      store.deletePlan(plan.id);
    }
  };

  // GENERAL SAVINGS CARD: Unique styled full-width card with bigger font & horizontal ribbon bar
  if (isGeneralLife) {
    return (
      <div className="col-span-full rounded-[1.25rem] bg-[#17181D] border border-white/[0.04] p-6 lg:p-8 select-none shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.04]">
          <div>
            <h3 className="text-[1.3rem] lg:text-[1.4rem] font-semibold text-white tracking-tight">
              {displayTitle}
            </h3>
            <p className="text-[0.84rem] text-[#8E92A0] mt-0.5">
              General Reserve •{" "}
              {formatCurrency(plan.monthlyContribution || 300)}/mo auto-flow
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {showDepositInput ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDeposit(parseFloat(depositAmount));
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount ($)"
                  className="w-28 px-3 py-1.5 rounded-xl bg-[#121316] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400/60"
                />
                <button
                  type="submit"
                  disabled={isMutating}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F7B668] text-[#16171B] text-xs font-semibold hover:brightness-105 transition-all cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositInput(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => handleDeposit(500)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#22242D] hover:bg-[#2A2D38] text-white border border-white/[0.06] text-[0.8rem] font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Deposit $500</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDepositAmount("500");
                    setShowDepositInput(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8E92A0] hover:text-white text-[0.78rem] font-medium transition-colors cursor-pointer"
                >
                  Custom
                </button>
              </>
            )}
          </div>
        </div>

        {/* Large Figures Row (Bigger Font) */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <span className="text-[0.82rem] text-[#8E92A0] block mb-1.5">
              Total Reserve
            </span>
            <span className="text-[3rem] sm:text-[3.5rem] font-semibold text-white tracking-tight leading-none">
              {formatCurrency(currentSaved)}
            </span>
          </div>
          <span className="text-[0.88rem] font-medium text-[#8E92A0]">
            {clampedPercentage}% of {formatCurrency(plan.targetAmount)} target
          </span>
        </div>

        {/* Horizontal Progress Bar with Segmented Ticks */}
        <div className="mt-5 w-full">
          <div
            className="w-full h-[0.55rem] rounded-full overflow-hidden bg-[#181A22]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #2D3242 0px, #2D3242 2px, transparent 2px, transparent 6px)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${clampedPercentage}%`,
                background:
                  "linear-gradient(90deg, #818CF8 0%, #6EE7B7 60%, #FDE68A 100%)",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // TARGETED SAVE PLAN CARDS: Clean minimalist card, text title only, bigger font, no hover glow
  return (
    <div
      className={cn(
        "rounded-[1.25rem] bg-[#17181D] border border-white/[0.04] p-6 select-none flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]",
        isCanceled && "opacity-40",
      )}
    >
      <div>
        {/* Header Row: Text Title ONLY, Deposit Action & Minimal Menu */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[1.18rem] font-semibold text-white tracking-tight">
            {displayTitle}
          </h3>

          <div className="flex items-center gap-1.5">
            {!isAlreadyCompleted && !isCanceled && (
              <button
                type="button"
                onClick={() => setShowDepositInput((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22242D] hover:bg-[#2A2D38] text-[#F7B668] border border-white/[0.06] text-[0.74rem] font-semibold transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Deposit</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="More options"
                className="p-1 rounded-lg text-[#8E92A0] hover:text-white transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-[#1C1E24] border border-white/10 shadow-2xl py-1 text-xs">
                    {!isAlreadyCompleted && !isCanceled && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDepositInput(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[#F7B668] hover:bg-white/[0.06] transition-colors cursor-pointer font-medium"
                      >
                        Deposit Funds
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        handleTogglePin();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      {plan.isPinned
                        ? "Unpin from Dashboard"
                        : "Pin to Dashboard"}
                    </button>

                    {!isAlreadyCompleted && !isCanceled && (
                      <button
                        type="button"
                        onClick={() => {
                          handleComplete();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        Mark as Complete
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      Delete Plan
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category subtitle */}
        <div className="flex items-center space-x-2 mb-5">
          <span className="text-[0.8rem] text-[#8E92A0] capitalize">
            {plan.category === "item_funding"
              ? "Item Funding"
              : plan.category === "emergency"
                ? "Emergency"
                : "General Reserve"}
          </span>
          {!isActive && !isCanceled && !isAlreadyCompleted && (
            <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Deactivated
            </span>
          )}
          {isAlreadyCompleted && (
            <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Completed
            </span>
          )}
          {isCanceled && (
            <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Canceled
            </span>
          )}
        </div>

        {/* Inline Deposit Form when toggled */}
        {showDepositInput && !isCanceled && !isAlreadyCompleted && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDeposit(parseFloat(depositAmount));
            }}
            className="mb-4 p-2.5 rounded-xl bg-[#121316] border border-white/[0.07] flex items-center gap-2"
          >
            <input
              type="number"
              min="1"
              step="any"
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Deposit amount ($)"
              className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-[#1A1D24] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-amber-400/50"
            />
            <button
              type="submit"
              disabled={isMutating}
              className="px-3.5 py-1.5 rounded-lg bg-[#F7B668] hover:bg-[#ffc47d] text-[#111215] font-semibold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              Allocate
            </button>
            <button
              type="button"
              onClick={() => setShowDepositInput(false)}
              className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </form>
        )}

        {/* Figures Row: Bigger Font */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-[#8E92A0] block text-[0.74rem] mb-1">
              Target
            </span>
            <span className="text-white font-semibold text-[1.32rem] sm:text-[1.4rem] tracking-tight leading-none">
              {formatCurrency(plan.targetAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[#8E92A0] block text-[0.74rem] mb-1">
              Saved
            </span>
            <span className="text-[#4ADE80] font-semibold text-[1.32rem] sm:text-[1.4rem] tracking-tight leading-none">
              {formatCurrency(currentSaved)}
            </span>
          </div>
        </div>

        {/* Horizontal Progress Bar matching Daily Checkoff / Monthly Billing Ribbon */}
        <div className="w-full mt-3">
          <div className="flex items-center space-x-3">
            <div
              className="flex-1 h-[0.45rem] rounded-full overflow-hidden bg-[#181A22]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #2D3242 0px, #2D3242 2px, transparent 2px, transparent 6px)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${clampedPercentage}%`,
                  background:
                    clampedPercentage >= 100
                      ? "#4ADE80"
                      : "linear-gradient(90deg, #818CF8 0%, #6EE7B7 60%, #FDE68A 100%)",
                }}
              />
            </div>
            <span className="text-[0.82rem] font-medium text-[#8E92A0] shrink-0">
              {clampedPercentage}%
            </span>
          </div>
        </div>

        {/* Registry Item Linkage Note (for Item Funding) */}
        {plan.category === "item_funding" && (
          <p className="text-[0.76rem] text-[#8E92A0] mt-3">
            {plan.linkedItemName
              ? `Linked to ${plan.linkedItemName}`
              : "Linked to 1 registry item"}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-white/[0.04]">
        {isCanceled ? (
          <div className="flex items-center justify-between">
            <span className="text-[0.78rem] text-rose-400/80">
              Plan was canceled
            </span>
            <button
              type="button"
              disabled={isMutating}
              onClick={handleToggleActive}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-[0.75rem] font-medium text-slate-200 transition-colors cursor-pointer"
            >
              Restore Plan
            </button>
          </div>
        ) : isAlreadyCompleted ? (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-emerald-400">
              <Check className="w-4 h-4" />
              Goal Fulfilled
            </span>
            <span className="text-[0.75rem] text-[#8E92A0]">100% Complete</span>
          </div>
        ) : isGoalReached ? (
          /* 100% Completed State matching Emergency Fund */
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={isMutating}
              onClick={handleComplete}
              className="h-[2.4rem] px-6 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 font-semibold text-[0.82rem] tracking-tight transition-all cursor-pointer"
            >
              Complete
            </button>
          </div>
        ) : (
          /* Targeted Active / Deactivate and Cancel buttons */
          <div className="grid grid-cols-2 gap-3">
            {/* Left Button: Activate / Deactivate Toggle */}
            <button
              type="button"
              disabled={isMutating}
              onClick={handleToggleActive}
              className={cn(
                "h-[2.4rem] px-4 rounded-xl text-[0.82rem] font-medium tracking-tight transition-all cursor-pointer flex items-center justify-center",
                isActive
                  ? "bg-[#21232B] hover:bg-[#282B35] text-slate-200 border border-white/[0.06]"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30",
              )}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>

            {/* Right Button: Cancel */}
            <button
              type="button"
              disabled={isMutating}
              onClick={handleCancel}
              className="h-[2.4rem] px-4 rounded-xl text-[0.82rem] font-medium text-[#9E9E9E] hover:text-rose-300 bg-[#1C1D22] hover:bg-rose-500/10 border border-white/[0.04] transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavePlanCard;

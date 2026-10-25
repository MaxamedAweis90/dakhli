import React, { useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { type SavePlanItem, useSavingsStore } from '@/stores/savingsStore'
import { cn } from '@/lib/utils'

interface SavePlanCardProps {
  plan: SavePlanItem
}

export const SavePlanCard: React.FC<SavePlanCardProps> = ({ plan }) => {
  const { toggleActive, cancelPlan, completePlan, depositToPlan, togglePin } = useSavingsStore()
  const [showMenu, setShowMenu] = useState(false)

  const formatCurrency = (val?: number): string => {
    if (val === undefined || isNaN(val)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const isGeneralLife = plan.type === 'general_life'
  const isCompleted =
    plan.status === 'completed' || (plan.type === 'targeted' && plan.percentage >= 100)
  const isCanceled = plan.status === 'canceled'
  const isActive = plan.status === 'active'

  // Clamp percentage
  const clampedPercentage = Math.min(100, Math.max(0, plan.percentage))

  // GENERAL SAVINGS CARD: Unique styled full-width card with bigger font & horizontal ribbon bar
  if (isGeneralLife) {
    return (
      <div className="col-span-full rounded-[1.25rem] bg-[#17181D] border border-white/[0.04] p-6 lg:p-8 select-none shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.04]">
          <div>
            <h3 className="text-[1.3rem] lg:text-[1.4rem] font-semibold text-white tracking-tight">
              {plan.name}
            </h3>
            <p className="text-[0.84rem] text-[#8E92A0] mt-0.5">
              General Reserve • ${plan.monthlyContribution || 300}/mo auto-flow
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => depositToPlan(plan.id, 500)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#22242D] hover:bg-[#2A2D38] text-white border border-white/[0.06] text-[0.8rem] font-semibold transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Deposit $500</span>
            </button>
          </div>
        </div>

        {/* Large Figures Row (Bigger Font) */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <span className="text-[0.82rem] text-[#8E92A0] block mb-1.5">Total Reserve</span>
            <span className="text-[3rem] sm:text-[3.5rem] font-semibold text-white tracking-tight leading-none">
              {formatCurrency(plan.currentSaved)}
            </span>
          </div>
          <span className="text-[0.88rem] font-medium text-[#8E92A0]">
            {clampedPercentage}% of target
          </span>
        </div>

        {/* Horizontal Progress Bar with Segmented Ticks */}
        <div className="mt-5 w-full">
          <div
            className="w-full h-[0.55rem] rounded-full overflow-hidden bg-[#181A22]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #2D3242 0px, #2D3242 2px, transparent 2px, transparent 6px)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${clampedPercentage}%`,
                background: 'linear-gradient(90deg, #818CF8 0%, #6EE7B7 60%, #FDE68A 100%)',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // TARGETED SAVE PLAN CARDS: Clean minimalist card, text title only, bigger font, no hover glow
  return (
    <div
      className={cn(
        'rounded-[1.25rem] bg-[#17181D] border border-white/[0.04] p-6 select-none flex flex-col justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]',
        isCanceled && 'opacity-40'
      )}
    >
      <div>
        {/* Header Row: Text Title ONLY & Minimal Menu */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[1.18rem] font-semibold text-white tracking-tight">
            {plan.name}
          </h3>

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
                  <button
                    type="button"
                    onClick={() => {
                      togglePin(plan.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    {plan.isPinned ? 'Unpin from Dashboard' : 'Pin to Dashboard'}
                  </button>

                  {!isCompleted && !isCanceled && (
                    <button
                      type="button"
                      onClick={() => {
                        completePlan(plan.id)
                        setShowMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      Mark as Complete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category subtitle */}
        <div className="flex items-center space-x-2 mb-5">
          <span className="text-[0.8rem] text-[#8E92A0] capitalize">
            {plan.category === 'item_funding'
              ? 'Item Funding'
              : plan.category === 'emergency'
                ? 'Emergency'
                : 'General Reserve'}
          </span>
          {!isActive && !isCanceled && (
            <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Deactivated
            </span>
          )}
          {isCanceled && (
            <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Canceled
            </span>
          )}
        </div>

        {/* Figures Row: Bigger Font */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-[#8E92A0] block text-[0.74rem] mb-1">Target</span>
            <span className="text-white font-semibold text-[1.32rem] sm:text-[1.4rem] tracking-tight leading-none">
              {formatCurrency(plan.targetAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[#8E92A0] block text-[0.74rem] mb-1">Saved</span>
            <span className="text-[#4ADE80] font-semibold text-[1.32rem] sm:text-[1.4rem] tracking-tight leading-none">
              {formatCurrency(plan.currentSaved)}
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
                  'repeating-linear-gradient(90deg, #2D3242 0px, #2D3242 2px, transparent 2px, transparent 6px)',
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${clampedPercentage}%`,
                  background:
                    clampedPercentage >= 100
                      ? '#4ADE80'
                      : 'linear-gradient(90deg, #818CF8 0%, #6EE7B7 60%, #FDE68A 100%)',
                }}
              />
            </div>
            <span className="text-[0.82rem] font-medium text-[#8E92A0] shrink-0">
              {clampedPercentage}%
            </span>
          </div>
        </div>

        {/* Registry Item Linkage Note (for Item Funding) */}
        {plan.category === 'item_funding' && (
          <p className="text-[0.76rem] text-[#8E92A0] mt-3">
            Linked to 1 registry item
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-white/[0.04]">
        {isCanceled ? (
          <div className="flex items-center justify-between">
            <span className="text-[0.78rem] text-rose-400/80">Plan was canceled</span>
            <button
              type="button"
              onClick={() => toggleActive(plan.id)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-[0.75rem] font-medium text-slate-200 transition-colors cursor-pointer"
            >
              Restore Plan
            </button>
          </div>
        ) : isCompleted ? (
          /* 100% Completed State matching Emergency Fund */
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => completePlan(plan.id)}
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
              onClick={() => toggleActive(plan.id)}
              className={cn(
                'h-[2.4rem] px-4 rounded-xl text-[0.82rem] font-medium tracking-tight transition-all cursor-pointer flex items-center justify-center',
                isActive
                  ? 'bg-[#21232B] hover:bg-[#282B35] text-slate-200 border border-white/[0.06]'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
              )}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>

            {/* Right Button: Cancel */}
            <button
              type="button"
              onClick={() => cancelPlan(plan.id)}
              className="h-[2.4rem] px-4 rounded-xl text-[0.82rem] font-medium text-[#9E9E9E] hover:text-rose-300 bg-[#1C1D22] hover:bg-rose-500/10 border border-white/[0.04] transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SavePlanCard

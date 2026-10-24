import React from "react";
import { useSavingsStore, type SavePlanItem } from "@/stores/savingsStore";
import { cn } from "@/lib/utils";

export interface SavingPlanCardProps {
  plans?: SavePlanItem[];
  className?: string;
}

// Total number of discrete vertical tally ticks matching the reference design
const TOTAL_TICKS = 36;

function interpolateRgb(
  start: [number, number, number],
  end: [number, number, number],
  factor: number,
): string {
  const r = Math.round(start[0] + factor * (end[0] - start[0]));
  const g = Math.round(start[1] + factor * (end[1] - start[1]));
  const b = Math.round(start[2] + factor * (end[2] - start[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns dynamic tick color according to user requirements:
 * - < 50%: graded blue/indigo (soft lavender to vibrant indigo/blue)
 * - >= 50%: samy green (pale mint to rich emerald)
 * - 100%: radiant yellow/amber (pale lemon to rich gold)
 * - Inactive: dark slate (#20222A)
 */
function getSegmentTickColor(
  percentage: number,
  index: number,
  activeCount: number,
): string {
  if (activeCount <= 0 || index >= activeCount) {
    return "#20222A";
  }

  const factor = activeCount === 1 ? 1 : index / (activeCount - 1);

  if (percentage >= 100) {
    return interpolateRgb([254, 240, 138], [245, 158, 11], factor);
  }

  if (percentage >= 50) {
    return interpolateRgb([167, 243, 208], [16, 185, 129], factor);
  }

  return interpolateRgb([186, 215, 253], [99, 102, 241], factor);
}

export const SegmentedTicks: React.FC<{ percentage: number }> = ({
  percentage,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const activeCount = Math.round((clamped / 100) * TOTAL_TICKS);

  return (
    <div className="flex gap-[3px] items-center w-full justify-between">
      {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
        const bg = getSegmentTickColor(clamped, i, activeCount);
        return (
          <span
            key={i}
            className="flex-1 h-[70px] rounded-[2px] max-w-[4px] transition-colors"
            style={{ backgroundColor: bg }}
          />
        );
      })}
    </div>
  );
};

export const SavingPlanCard: React.FC<SavingPlanCardProps> = ({
  plans: propPlans,
  className,
}) => {
  const store = useSavingsStore();
  const displayPlans = propPlans ?? store.getPinnedPlans();

  return (
    <div
      className={cn(
        "rounded-[26px] bg-[#17181D] border border-white/[0.02] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] p-6 flex flex-col justify-between",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-[14px] font-semibold text-white tracking-tight">
          Saving plan
        </h3>
      </div>

      {/* Plan items with subtle dividers matching reference interface */}
      <div className="divide-y divide-white/[0.04]">
        {displayPlans.map((plan, idx) => (
          <div
            key={plan.id}
            className={cn(
              "py-3",
              idx === 0 && "pt-0",
              idx === displayPlans.length - 1 && "pb-0",
            )}
          >
            {/* Title and Percentage row (Clean text, no icons per requirements) */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-[14px] tracking-tight">
                {plan.name}
              </span>
              <span className="text-slate-400 font-normal text-xs tabular-nums">
                {plan.percentage}%
              </span>
            </div>

            {/* Segmented Tick Bar with dynamic multi-color gradient */}
            <SegmentedTicks percentage={plan.percentage} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavingPlanCard;

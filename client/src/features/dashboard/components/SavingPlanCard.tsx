import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "@/components/shared/icons";
import { useSavingsStore, type SavePlanItem } from "@/stores/savingsStore";
import { useSavePlans } from "@/features/save-plans/hooks/useSavePlans";
import { cn } from "@/lib/utils";

export interface SavingPlanCardProps {
  plans?: SavePlanItem[];
  className?: string;
}

const FALLBACK_DISPLAY_PLANS: Array<{ id: string; name: string; percentage: number }> = [
  { id: "fallback-1", name: "General Savings", percentage: 0 },
  { id: "fallback-2", name: "Emergency Fund", percentage: 0 },
  { id: "fallback-3", name: "Target Goal", percentage: 0 },
];

// Hairline tally ticks, as in the reference
const TOTAL_TICKS = 44;

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
 * Dynamic tick color:
 * - < 50%: graded blue (pale periwinkle to indigo)
 * - >= 50%: green (pale mint to emerald)
 * - 100%: yellow (pale lemon to amber)
 * - Inactive: barely-there dark tick
 */
function getSegmentTickColor(
  percentage: number,
  index: number,
  activeCount: number,
): string {
  if (activeCount <= 0 || index >= activeCount) {
    return "#242424";
  }

  const factor = activeCount === 1 ? 1 : index / (activeCount - 1);

  if (percentage >= 100) {
    return interpolateRgb([254, 240, 138], [245, 158, 11], factor);
  }

  if (percentage >= 50) {
    return interpolateRgb([178, 226, 178], [112, 190, 130], factor);
  }

  return interpolateRgb([170, 184, 248], [98, 100, 226], factor);
}

export const SegmentedTicks: React.FC<{
  percentage: number;
  tickHeight?: string;
  className?: string;
}> = ({ percentage, tickHeight = "3rem", className }) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const activeCount = Math.round((clamped / 100) * TOTAL_TICKS);

  return (
    <div
      className={cn("grid w-full gap-x-[0.14rem]", className)}
      style={{ gridTemplateColumns: `repeat(${TOTAL_TICKS}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: TOTAL_TICKS }).map((_, i) => (
        <span
          key={i}
          className="rounded-[1px]"
          style={{
            height: tickHeight,
            backgroundColor: getSegmentTickColor(clamped, i, activeCount),
          }}
        />
      ))}
    </div>
  );
};

export const SavingPlanCard: React.FC<SavingPlanCardProps> = ({
  plans: propPlans,
  className,
}) => {
  const { pinnedPlans } = useSavePlans();
  const store = useSavingsStore();

  const livePlans =
    propPlans ??
    (pinnedPlans.length > 0
      ? pinnedPlans.map((p) => ({
          id: p.id,
          name: p.title || p.name,
          percentage: p.percentage,
        }))
      : store.getPinnedPlans().length > 0
      ? store.getPinnedPlans().map((p) => ({
          id: p.id,
          name: p.title || p.name,
          percentage: p.percentage,
        }))
      : FALLBACK_DISPLAY_PLANS);

  return (
    <div
      className={cn(
        "rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.1rem] pb-[1.25rem] flex flex-col justify-between gap-[1rem] select-none h-auto min-h-fit",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Link
          to="/save-plans"
          className="text-[0.78rem] leading-4 font-normal text-white hover:text-white/90 flex items-center gap-1 group transition-colors"
        >
          <span>Saving plan</span>
          <ChevronRight className="w-3 h-3 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Rows are spread evenly; hairline dividers sit between them */}
      <div className="flex-1 flex flex-col justify-between gap-[0.75rem]">
        {livePlans.map((plan, idx) => (
          <React.Fragment key={plan.id}>
            {idx > 0 && <div className="h-px bg-white/[0.05]" />}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[0.9rem] leading-5 font-medium tracking-[-0.01em] text-white">
                  {plan.name}
                </span>
                <span className="text-[0.69rem] leading-4 text-[#8d8d8d]">
                  {plan.percentage}%
                </span>
              </div>
              <div className="mt-[0.55rem]">
                <SegmentedTicks percentage={plan.percentage} />
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SavingPlanCard;

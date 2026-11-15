import React, { useId } from "react";
import { useLiquidityStore } from "@/stores/liquidityStore";
import { useBaseline } from "@/features/settings/hooks/useBaseline";
import { useOverheads } from "@/features/overheads/hooks/useOverheads";
import { useDaily } from "@/features/daily/hooks/useDaily";
import { CURRENCY_CONFIGS, type CurrencyCode } from "@/features/settings/types/settings.types";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { calculateCycleBurnRate } from "@/features/daily/hooks/useCycleBurnRate";
import { cn } from "@/lib/utils";

export interface CashFlowCardProps {
  income?: number;
  expenses?: number;
  limit?: number;
  /** Share of the limit bar that is filled, 0-100 */
  usedPercent?: number;
  className?: string;
}

interface SparklineProps {
  path: string;
  viewBox: string;
  color: string;
  dot: [number, number] | null;
  className?: string;
}

const buildSparkline = (
  values: number[],
  activeColor: string,
): { path: string; color: string; dot: [number, number] | null } => {
  const valid = values.filter((v) => Number.isFinite(v) && v >= 0);
  if (valid.length === 0 || valid.every((v) => v <= 0)) {
    return {
      path: "M0,24 L120,24",
      color: "#64748B",
      dot: null,
    };
  }

  const series = valid.length === 1 ? [valid[0], valid[0]] : valid.slice(-14);
  const max = Math.max(...series);
  const min = Math.min(...series, 0);
  const span = max - min;

  const points: [number, number][] = series.map((val, idx) => {
    const x = Number((2 + (idx / (series.length - 1)) * 114).toFixed(1));
    const normalized = span > 0 ? (val - min) / span : 0.5;
    const y = Number((38 - normalized * 26).toFixed(1));
    return [x, y];
  });

  const path = points
    .map(([x, y], idx) => `${idx === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");

  return {
    path,
    color: activeColor,
    dot: points[points.length - 1],
  };
};

const Sparkline: React.FC<SparklineProps> = ({
  path,
  viewBox,
  color,
  dot,
  className,
}) => {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={viewBox}
      className={cn("overflow-visible", className)}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fade-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={dot ? "0" : "0.35"} />
          <stop offset="0.25" stopColor={color} stopOpacity={dot ? "0.85" : "0.45"} />
          <stop offset="0.75" stopColor={color} stopOpacity={dot ? "0.95" : "0.45"} />
          <stop offset="1" stopColor={color} stopOpacity={dot ? "0" : "0.35"} />
        </linearGradient>
        <filter
          id={`glow-${id}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        stroke={`url(#fade-${id})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {dot && (
        <>
          <circle
            cx={dot[0]}
            cy={dot[1]}
            r="7"
            fill={color}
            opacity="0.45"
            filter={`url(#glow-${id})`}
          />
          <circle cx={dot[0]} cy={dot[1]} r="2.8" fill={color} />
          <circle cx={dot[0]} cy={dot[1]} r="1.2" fill="#ffffff" />
        </>
      )}
    </svg>
  );
};

export const CashFlowCard: React.FC<CashFlowCardProps> = ({
  income: propIncome,
  expenses: propExpenses,
  limit: propLimit,
  usedPercent: propUsedPercent,
  className,
}) => {
  const { baseline } = useBaseline();
  const { summary: overheadSummary } = useOverheads();
  const { logs: dailyLogs } = useDaily();
  const store = useLiquidityStore();

  const currentCode = (store.currency in CURRENCY_CONFIGS
    ? store.currency
    : "USD") as CurrencyCode;
  const config = CURRENCY_CONFIGS[currentCode];
  const rate = config.rate ?? 1;

  // Base raw amounts (strictly zero until real user records exist)
  const rawIncome = propIncome ?? (baseline?.monthlyIncome ?? 0);

  const liveSpent = dailyLogs.reduce((sum, l) => sum + (l.spent || 0), 0);
  const liveOverheadObligations =
    overheadSummary.totalMonthly ||
    (overheadSummary.totalPaid || 0) + (overheadSummary.totalUnpaid || 0);
  const totalRecordedExpenses = liveSpent + liveOverheadObligations;

  const rawExpenses = propExpenses ?? totalRecordedExpenses;

  const dailySpendCeiling =
    baseline?.defaultDailyCap && baseline.defaultDailyCap > 0
      ? baseline.defaultDailyCap * 30
      : 0;

  const rawLimit =
    propLimit ??
    (dailySpendCeiling > 0
      ? dailySpendCeiling + liveOverheadObligations
      : rawIncome > 0
      ? Math.round(rawIncome * 0.9)
      : 0);

  // Converted amounts
  const income = rawIncome * rate;
  const expenses = rawExpenses * rate;
  const limit = rawLimit * rate;
  const net = income - expenses;

  const usedPercent =
    propUsedPercent ??
    (limit > 0 ? Math.min(100, Math.round((expenses / limit) * 100)) : 0);

  const isNetPositive = net >= 0;
  const netSign = isNetPositive ? "+" : "-";

  // Data-driven sparklines with flat muted baseline on zero/empty data
  const incomeSeries = rawIncome > 0 ? [rawIncome] : [];
  const sortedExpenseValues = [...dailyLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => l.spent || 0);
  const expenseSeries =
    sortedExpenseValues.some((v) => v > 0)
      ? sortedExpenseValues
      : rawExpenses > 0
      ? [rawExpenses]
      : [];

  const incomeSparkline = buildSparkline(incomeSeries, "#4ADE80");
  const expenseSparkline = buildSparkline(expenseSeries, "#F87171");

  // Cycle burn-rate calculation
  const totalCycleDays = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  const discretionaryBaseline =
    baseline?.defaultDailyCap && baseline.defaultDailyCap > 0
      ? baseline.defaultDailyCap * totalCycleDays
      : rawLimit > 0
      ? rawLimit
      : 0;

  const cumulativeSpend =
    propExpenses !== undefined
      ? propExpenses
      : liveSpent > 0
      ? liveSpent
      : rawExpenses;

  const baselineForBurn =
    propLimit !== undefined ? propLimit : discretionaryBaseline;

  const burnRate = calculateCycleBurnRate({
    cumulativeSpend,
    discretionaryBaseline: baselineForBurn,
    warningThreshold: baseline?.warningThreshold ?? 35,
  });

  return (
    <div
      className={cn(
        "relative rounded-[1.25rem] bg-[#17181D] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] px-[1.1rem] pt-[1.2rem] pb-[1.25rem] flex flex-col justify-between gap-[1.1rem] select-none h-auto min-h-fit",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[0.0625rem]">
        <h3 className="text-[1.05rem] font-medium leading-none text-white tracking-[-0.01em]">
          Cash Flow
        </h3>
        <div
          className="flex items-center gap-[0.2rem] h-[0.4rem] p-[0.05rem]"
          aria-hidden="true"
        >
          <span className="block w-[1.4rem] h-full rounded-full bg-gradient-to-r from-[#A7F3D0] to-[#67E8F9] shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
          <span className="block w-[1.2rem] h-full rounded-full bg-[#2C2E38]" />
        </div>
      </div>

      {/* Income / Expenses Container with floating badge */}
      <div className="relative flex flex-col gap-[0.5rem]">
        {/* Income Box */}
        <div className="relative h-[4.5rem] rounded-2xl bg-[#1E2028] px-[1.1rem] py-[0.75rem] flex items-center justify-between overflow-hidden">
          <div>
            <p className="text-[0.75rem] leading-none text-[#8E92A0] font-normal">
              Income
            </p>
            <div className="mt-[0.45rem] text-[1.35rem] leading-none font-semibold tracking-tight text-white font-mono tabular-nums">
              <AnimatedNumber
                value={income}
                prefix={config.symbol}
                currency={currentCode}
                className="font-mono tabular-nums"
              />
            </div>
          </div>
          <Sparkline
            viewBox="0 0 120 48"
            path={incomeSparkline.path}
            color={incomeSparkline.color}
            dot={incomeSparkline.dot}
            className="w-[5.4rem] h-[2.8rem]"
          />
        </div>

        {/* Expenses Box */}
        <div className="relative h-[4.5rem] rounded-2xl bg-[#1E2028] px-[1.1rem] py-[0.75rem] flex items-center justify-between overflow-hidden">
          <div>
            <p className="text-[0.75rem] leading-none text-[#8E92A0] font-normal">
              Expenses
            </p>
            <div className="mt-[0.45rem] text-[1.35rem] leading-none font-semibold tracking-tight text-white font-mono tabular-nums">
              <AnimatedNumber
                value={expenses}
                prefix={config.symbol}
                currency={currentCode}
                className="font-mono tabular-nums"
              />
            </div>
          </div>
          <Sparkline
            viewBox="0 0 120 48"
            path={expenseSparkline.path}
            color={expenseSparkline.color}
            dot={expenseSparkline.dot}
            className="w-[5.4rem] h-[2.5rem]"
          />
        </div>

        {/* Floating net pill centered over the seam */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-[1.75rem] min-w-[3.8rem] px-[0.85rem] rounded-full bg-white text-[#15161A] text-[0.78rem] font-semibold flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.5)] font-mono tabular-nums">
          <AnimatedNumber
            value={Math.abs(net)}
            prefix={`${netSign}${config.symbol}`}
            currency={currentCode}
            className="font-mono tabular-nums font-semibold"
          />
        </div>
      </div>

      {/* Expenses limit */}
      <div className="pt-[0.25rem]">
        <div className="flex items-baseline justify-between px-[0.0625rem]">
          <span className="text-[0.85rem] leading-none text-[#8E92A0] font-normal">
            Expenses limit
          </span>
          <div className="flex items-baseline gap-2.5">
            <span className={burnRate.pacingClassName}>
              {burnRate.pacingLabel}
            </span>
            <span className="text-[1.45rem] leading-none font-semibold tracking-tight text-white font-mono tabular-nums">
              <AnimatedNumber
                value={limit}
                prefix={config.symbol}
                currency={currentCode}
                className="font-mono tabular-nums"
              />
            </span>
          </div>
        </div>
        <div className="relative mt-[0.7rem] w-full h-[3.4rem] rounded-2xl overflow-hidden">
          {/* Hatched track spanning full width, cleanly rounded at edges */}
          <div className="absolute inset-0 bg-limit-hatch" />

          {/* Neon pill with full rounded corners and radiant ambient glow */}
          <div
            className="relative h-full rounded-2xl bg-expenses-neon transition-all duration-500 ease-out"
            style={{ width: `${usedPercent}%` }}
          />

          {/* Hairline Timeline Marker */}
          <div
            className="w-[1.5px] h-full bg-white/40 absolute top-0 pointer-events-none z-10"
            style={{
              left: `${Math.min(100, Math.max(0, burnRate.timeProgressRatio * 100))}%`,
            }}
            title={`Expected cycle consumption pace: ${(burnRate.timeProgressRatio * 100).toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
};

export default CashFlowCard;

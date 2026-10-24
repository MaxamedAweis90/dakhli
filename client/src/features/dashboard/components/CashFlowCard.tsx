import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface CashFlowCardProps {
  income?: number;
  expenses?: number;
  limit?: number;
  /** Share of the limit bar that is filled, 0-100 */
  usedPercent?: number;
  className?: string;
}

const fmt = (n: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

interface SparklineProps {
  path: string;
  viewBox: string;
  color: string;
  dot: [number, number];
  className?: string;
}

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
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.25" stopColor={color} stopOpacity="0.85" />
          <stop offset="0.75" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
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
    </svg>
  );
};

export const CashFlowCard: React.FC<CashFlowCardProps> = ({
  income = 8385,
  expenses = 2200,
  limit = 82300,
  usedPercent = 67,
  className,
}) => {
  const net = income - expenses;

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
            <p className="mt-[0.45rem] text-[1.35rem] leading-none font-semibold tracking-tight text-white">
              ${fmt(income)}
            </p>
          </div>
          <Sparkline
            viewBox="0 0 100 50"
            path="M 0,38 C 12,38 18,44 26,42 C 34,40 38,12 48,8 C 55,5 57,20 63,20 C 69,20 73,15 80,18 C 88,22 93,36 100,40"
            color="#4ADE80"
            dot={[60, 20]}
            className="w-[5.4rem] h-[2.8rem]"
          />
        </div>

        {/* Expenses Box */}
        <div className="relative h-[4.5rem] rounded-2xl bg-[#1E2028] px-[1.1rem] py-[0.75rem] flex items-center justify-between overflow-hidden">
          <div>
            <p className="text-[0.75rem] leading-none text-[#8E92A0] font-normal">
              Expenses
            </p>
            <p className="mt-[0.45rem] text-[1.35rem] leading-none font-semibold tracking-tight text-white">
              ${fmt(expenses)}
            </p>
          </div>
          <Sparkline
            viewBox="0 0 100 50"
            path="M 0,30 C 8,30 14,22 24,20 C 34,18 38,36 48,38 C 58,40 64,18 74,18 C 84,18 88,38 100,32"
            color="#F87171"
            dot={[74, 18]}
            className="w-[5.4rem] h-[2.5rem]"
          />
        </div>

        {/* Floating net pill centered over the seam */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-[1.75rem] min-w-[3.8rem] px-[0.85rem] rounded-full bg-white text-[#15161A] text-[0.78rem] font-semibold flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
          +${fmt(net)}
        </div>
      </div>

      {/* Expenses limit */}
      <div className="pt-[0.25rem]">
        <div className="flex items-baseline justify-between px-[0.0625rem]">
          <span className="text-[0.85rem] leading-none text-[#8E92A0] font-normal">
            Expenses limit
          </span>
          <span className="text-[1.45rem] leading-none font-semibold tracking-tight text-white">
            ${fmt(limit)}
          </span>
        </div>
        <div className="relative mt-[0.7rem] w-full h-[3.4rem]">
          {/* Hatched track spanning full width, cleanly rounded at edges */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden bg-limit-hatch" />

          {/* Neon pill with full rounded corners and radiant ambient glow */}
          <div
            className="relative h-full rounded-2xl bg-expenses-neon transition-all"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CashFlowCard;

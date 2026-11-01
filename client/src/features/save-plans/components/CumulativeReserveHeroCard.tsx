import React, { useState, useId } from 'react'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { useLiquidityStore } from '@/stores/liquidityStore'
import {
  CURRENCY_CONFIGS,
  type CurrencyCode,
} from '@/features/settings/types/settings.types'
import { cn } from '@/lib/utils'
import type { SavePlan } from '../types/savePlan.types'

interface CumulativeReserveHeroCardProps {
  plan: SavePlan
  onToggleStatus: (id: string) => Promise<any> | void
  onOpenDrawer: () => void
  isMutating?: boolean
}

/**
 * Generates a smooth cubic bezier SVG path from coordinate points.
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export const CumulativeReserveHeroCard: React.FC<CumulativeReserveHeroCardProps> = ({
  plan,
  onToggleStatus,
  onOpenDrawer,
  isMutating = false,
}) => {
  const filterId = useId().replace(/:/g, '')
  const liquidityStore = useLiquidityStore()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const currentCode = (
    liquidityStore.currency in CURRENCY_CONFIGS
      ? liquidityStore.currency
      : 'USD'
  ) as CurrencyCode
  const config = CURRENCY_CONFIGS[currentCode]
  const rate = config.rate ?? 1

  const isPaused = plan.status === 'PAUSED' || plan.status === 'paused'
  const monthlyDeduction = Number(
    plan.monthlyDeduction ?? plan.monthlyContribution ?? 300
  )
  const cumulativeTotal = Number(
    plan.cumulativeTotal ?? plan.currentAmount ?? plan.currentSaved ?? 0
  )

  const convertedTotal = cumulativeTotal * rate
  const convertedCut = monthlyDeduction * rate

  const sourceLabel =
    plan.sourceBalance === 'LIQUID_BALANCE'
      ? 'Liquid Surplus'
      : 'Monthly Baseline Income'

  // Generate 7 rolling monthly trajectory points (3 past months, current, 3 projected)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const today = new Date()
  const currentMonthIdx = today.getMonth()

  const trajectory = [-3, -2, -1, 0, 1, 2, 3].map((offset, i) => {
    const targetDate = new Date(
      today.getFullYear(),
      currentMonthIdx + offset,
      1
    )
    const label = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`
    const shortLabel = monthNames[targetDate.getMonth()]

    let val = cumulativeTotal
    if (offset < 0) {
      val = Math.max(0, cumulativeTotal + offset * monthlyDeduction)
    } else if (offset > 0) {
      val = isPaused
        ? cumulativeTotal
        : cumulativeTotal + offset * monthlyDeduction
    }

    return {
      index: i,
      label,
      shortLabel,
      value: val * rate,
      isCurrent: offset === 0,
      isFuture: offset > 0,
    }
  })

  // SVG Chart Geometry
  const width = 640
  const height = 110
  const padX = 12
  const padTop = 14
  const padBottom = 16

  const rawValues = trajectory.map((t) => t.value)
  const minVal = Math.min(...rawValues, 0)
  const maxVal = Math.max(...rawValues, 100)
  const range = maxVal - minVal || 1

  const coords = trajectory.map((t, idx) => {
    const x = padX + (idx / Math.max(1, trajectory.length - 1)) * (width - padX * 2)
    const norm = (t.value - minVal) / range
    const y = height - padBottom - norm * (height - padTop - padBottom)
    return { ...t, x, y }
  })

  const linePath = createSmoothPath(coords)
  const lastCoord = coords[coords.length - 1]
  const firstCoord = coords[0]
  const areaPath = `${linePath} L ${lastCoord.x} ${height} L ${firstCoord.x} ${height} Z`

  const activePoint = hoveredIdx !== null ? coords[hoveredIdx] : coords[3]

  return (
    <div className="w-full select-none">
      {/* Iridescent Gradient Outer Border Container matching /daily screen */}
      <div className="relative p-[1.5px] rounded-[1.25rem] bg-gradient-to-br from-[#FCD34D]/40 via-[#6EE7B7]/50 to-[#2DD4BF]/60 shadow-[0_0_24px_rgba(94,234,212,0.12)]">
        <div className="rounded-[calc(1.25rem-1.5px)] bg-[#17181D] px-6 sm:px-7 pt-5 pb-4 overflow-hidden">
          {/* Header Row: Title, Subtitle, and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.04]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[1.1rem] sm:text-[1.2rem] font-semibold text-white tracking-tight">
                  Save for Life
                </h2>
                <span className="text-[0.68rem] text-[#8E92A0] bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.04]">
                  Permanent Buffer
                </span>
              </div>
              <p className="text-[0.8rem] text-[#8E92A0] mt-0.5">
                {isPaused ? (
                  <span className="text-[#FBBF24]">
                    Accumulation paused • Reserve preserved
                  </span>
                ) : (
                  <span>
                    Auto-saving{' '}
                    <strong className="text-white font-medium">
                      {config.symbol}
                      {new Intl.NumberFormat('en-US', {
                        maximumFractionDigits: 0,
                      }).format(convertedCut)}
                    </strong>
                    /mo from {sourceLabel}
                  </span>
                )}
              </p>
            </div>

            {/* Micro Controls: Pause/Resume Toggle & Adjust Cut */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleStatus(plan.id)}
                disabled={isMutating}
                className={cn(
                  'h-8 px-3 rounded-xl border text-[0.76rem] font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50',
                  isPaused
                    ? 'bg-[#FBBF24]/10 hover:bg-[#FBBF24]/20 border-[#FBBF24]/30 text-[#FBBF24]'
                    : 'bg-[#4ADE80]/10 hover:bg-[#4ADE80]/20 border-[#4ADE80]/30 text-[#4ADE80]'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isPaused ? 'bg-[#FBBF24]' : 'bg-[#4ADE80]'
                  )}
                />
                <span>{isPaused ? 'Paused • Resume' : 'Active'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenDrawer}
                disabled={isMutating}
                className="h-8 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8E92A0] hover:text-white border border-white/[0.06] text-[0.78rem] font-medium transition-colors cursor-pointer"
              >
                Adjust Cut
              </button>
            </div>
          </div>

          {/* Primary Accumulated Amount */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <div>
              <span className="text-[0.78rem] text-[#8E92A0] block">
                Total Life Reserve
              </span>
              <div className="text-[2.35rem] sm:text-[2.75rem] font-semibold text-white tracking-tight leading-none mt-1">
                <AnimatedNumber
                  value={convertedTotal}
                  prefix={config.symbol}
                />
              </div>
            </div>

            {activePoint && (
              <div className="text-right sm:self-end">
                <span className="text-[0.72rem] text-[#8E92A0] block">
                  {activePoint.label}
                </span>
                <span className="text-[0.95rem] font-medium text-[#5EEAD4]">
                  {config.symbol}
                  {new Intl.NumberFormat('en-US', {
                    maximumFractionDigits: 0,
                  }).format(activePoint.value)}
                  {activePoint.isFuture && !isPaused && (
                    <span className="text-[#8E92A0] text-[0.72rem] ml-1 font-normal">
                      (projected)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Area Sparkline Chart (Matching /daily screen SVG) */}
          <div className="w-full mt-3 h-[95px] relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`savingsFade-${filterId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="#5EEAD4" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.0" />
                </linearGradient>
                <filter id={`mintGlow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#5EEAD4" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Gradient filled area under curve */}
              <path d={areaPath} fill={`url(#savingsFade-${filterId})`} />

              {/* Smooth stroke curve */}
              <path
                d={linePath}
                fill="none"
                stroke="#5EEAD4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#mintGlow-${filterId})`}
              />

              {/* Interactive Point Markers */}
              {coords.map((pt, i) => {
                const isHovered = hoveredIdx === i
                return (
                  <g
                    key={pt.label + i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={0}
                        x2={pt.x}
                        y2={height}
                        stroke="rgba(94, 234, 212, 0.4)"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                      />
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : pt.isCurrent ? 4 : 2.5}
                      fill={isHovered ? '#FFFFFF' : pt.isCurrent ? '#5EEAD4' : '#2DD4BF'}
                      stroke="#17181D"
                      strokeWidth="2"
                    />
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Month labels footer */}
          <div className="flex items-center justify-between text-[0.72rem] text-[#8E92A0] px-1 pt-1">
            {coords.map((pt, idx) => (
              <span
                key={pt.label + idx}
                className={cn(
                  'cursor-pointer transition-colors',
                  pt.isCurrent && 'text-white font-medium',
                  hoveredIdx === idx && 'text-[#5EEAD4] font-medium'
                )}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {pt.shortLabel}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CumulativeReserveHeroCard

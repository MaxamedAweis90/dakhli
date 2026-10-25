import React from 'react'
import { cn } from '@/lib/utils'

export interface CumulativeSavingsCardProps {
  savings: number
  points?: number[]
  className?: string
}

/**
 * Generates a smooth cubic bezier SVG path from a set of data points.
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

export const CumulativeSavingsCard: React.FC<CumulativeSavingsCardProps> = ({
  savings,
  points = [8, 12, 11, 18, 16, 21, 20, 35, 27, 31, 35],
  className,
}) => {
  // SVG Viewport sizing
  const width = 340
  const height = 130
  const padX = 8
  const padTop = 18
  const padBottom = 12

  // Map data points into SVG space
  const minVal = Math.min(0, ...points)
  const maxVal = Math.max(40, ...points)
  const range = maxVal - minVal || 1

  const coords = points.map((val, idx) => {
    const x = padX + (idx / (points.length - 1)) * (width - padX * 2)
    const norm = (val - minVal) / range
    // SVG y goes from top (0) to bottom (height)
    const y = height - padBottom - norm * (height - padTop - padBottom)
    return { x, y }
  })

  const linePath = createSmoothPath(coords)
  const lastCoord = coords[coords.length - 1]
  const firstCoord = coords[0]
  const areaPath = `${linePath} L ${lastCoord.x} ${height} L ${firstCoord.x} ${height} Z`

  // Format savings value e.g. +$35.00 or -$15.00
  const isPositive = savings > 0
  const isNegative = savings < 0
  const absSavings = Math.abs(savings).toFixed(2)
  const displaySavings = isPositive
    ? `+$${absSavings}`
    : isNegative
    ? `-$${absSavings}`
    : `$${absSavings}`

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Category Header Label */}
      <span className="text-[0.82rem] font-normal text-[#8E92A0] mb-2.5 pl-1 select-none">
        Preview-only
      </span>

      {/* Iridescent Gradient Outer Border Container */}
      <div className="relative p-[1.5px] rounded-[1.25rem] bg-gradient-to-br from-[#FCD34D]/40 via-[#6EE7B7]/50 to-[#2DD4BF]/60 shadow-[0_0_24px_rgba(94,234,212,0.12)]">
        <div className="rounded-[calc(1.25rem-1.5px)] bg-[#17181D] px-6 pt-5 pb-4 select-none flex flex-col justify-between overflow-hidden">
          {/* Card Metric Header */}
          <div>
            <span className="block text-[0.85rem] font-medium text-[#D1D5DB] tracking-tight">
              Cumulative Savings:
            </span>
            <p className="text-[2.15rem] lg:text-[2.35rem] font-semibold text-white tracking-tight leading-none mt-1.5">
              {displaySavings}
            </p>
          </div>

          {/* Area Sparkline Chart */}
          <div className="w-full mt-4 h-[125px] relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="savingsFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="#5EEAD4" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.0" />
                </linearGradient>
                <filter id="mintGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#5EEAD4" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Gradient filled area under curve */}
              <path d={areaPath} fill="url(#savingsFade)" />

              {/* Glowing smooth stroke line */}
              <path
                d={linePath}
                fill="none"
                stroke="#5EEAD4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#mintGlow)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CumulativeSavingsCard

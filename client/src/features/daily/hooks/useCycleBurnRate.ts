import { useMemo } from 'react'
import { useDaily } from './useDaily'
import { useBaseline } from '@/features/settings/hooks/useBaseline'

export type PacingStatus = 'nominal' | 'elevated' | 'critical'

export interface CycleBurnRateOptions {
  cumulativeSpend?: number
  discretionaryBaseline?: number
  referenceDate?: Date
}

export interface CycleBurnRateResult {
  totalCycleDays: number
  daysElapsed: number
  currentHour: number
  timeProgressRatio: number
  timeProgressPercent: number
  budgetConsumedRatio: number
  varianceDelta: number
  variancePercent: number
  status: PacingStatus
  pacingLabel: string
  pacingClassName: string
}

/**
 * Deterministic Cycle Burn-Rate mathematics:
 * - totalCycleDays: Total calendar days in the current cycle month.
 * - daysElapsed: Active day index within the cycle (1 to totalCycleDays).
 * - timeProgressRatio: ((daysElapsed - 1) + (currentHour / 24)) / totalCycleDays
 * - budgetConsumedRatio: Actual Cumulative Spend to Date / Total Monthly Discretionary Baseline
 * - varianceDelta: budgetConsumedRatio - timeProgressRatio
 *
 * Pacing Classification (Strictly Monospace & Understated):
 * - On Pace: Variance <= 0% -> 'PACING: NOMINAL' (text-slate-400 font-mono text-xs)
 * - Elevated: 0% < Variance <= 10% -> 'PACING: +X.X% AHEAD' (text-amber-400 font-mono text-xs)
 * - Critical Burn: Variance > 10% -> 'BURN HIGH: +X.X%' (text-rose-400 font-mono text-xs)
 */
export function calculateCycleBurnRate(options?: CycleBurnRateOptions): CycleBurnRateResult {
  const d = options?.referenceDate ?? new Date()
  const year = d.getFullYear()
  const month = d.getMonth()

  // 1. totalCycleDays: Total calendar days in the current cycle month
  const totalCycleDays = new Date(year, month + 1, 0).getDate()

  // 2. daysElapsed: Active day index within the cycle (1 to totalCycleDays)
  const daysElapsed = Math.min(totalCycleDays, Math.max(1, d.getDate()))

  // 3. currentHour: active fractional hour of the day (0 to 24)
  const currentHour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600

  // 4. timeProgressRatio: ((daysElapsed - 1) + (currentHour / 24)) / totalCycleDays
  const rawTimeRatio = ((daysElapsed - 1) + currentHour / 24) / totalCycleDays
  const timeProgressRatio = Math.min(1, Math.max(0, rawTimeRatio))
  const timeProgressPercent = timeProgressRatio * 100

  // 5. budgetConsumedRatio: Actual Cumulative Spend to Date / Total Monthly Discretionary Baseline
  const spend = options?.cumulativeSpend ?? 0
  const baseline = options?.discretionaryBaseline ?? 0
  const budgetConsumedRatio = baseline > 0 ? spend / baseline : 0

  // 6. varianceDelta: budgetConsumedRatio - timeProgressRatio
  const varianceDelta = budgetConsumedRatio - timeProgressRatio
  const variancePercent = varianceDelta * 100

  // 7. Pacing Classification
  let status: PacingStatus = 'nominal'
  let pacingLabel = 'PACING: NOMINAL'
  let pacingClassName = 'text-slate-400 font-mono text-xs'

  if (varianceDelta > 0.1) {
    status = 'critical'
    pacingLabel = `BURN HIGH: +${variancePercent.toFixed(1)}%`
    pacingClassName = 'text-rose-400 font-mono text-xs'
  } else if (varianceDelta > 0) {
    status = 'elevated'
    pacingLabel = `PACING: +${variancePercent.toFixed(1)}% AHEAD`
    pacingClassName = 'text-amber-400 font-mono text-xs'
  }

  return {
    totalCycleDays,
    daysElapsed,
    currentHour,
    timeProgressRatio,
    timeProgressPercent,
    budgetConsumedRatio,
    varianceDelta,
    variancePercent,
    status,
    pacingLabel,
    pacingClassName,
  }
}

/**
 * Hook to retrieve real-time cycle burn-rate calculations connected to live baseline and daily logs.
 */
export function useCycleBurnRate(options?: CycleBurnRateOptions): CycleBurnRateResult {
  const { logs: dailyLogs } = useDaily()
  const { baseline } = useBaseline()

  return useMemo(() => {
    const totalCycleDays = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate()

    const liveSpend = dailyLogs.reduce((sum, l) => sum + (l.spent || 0), 0)
    const cumulativeSpend =
      options?.cumulativeSpend !== undefined
        ? options.cumulativeSpend
        : liveSpend

    const defaultMonthlyBaseline =
      (baseline?.defaultDailyCap && baseline.defaultDailyCap > 0
        ? baseline.defaultDailyCap
        : 30) * totalCycleDays

    const discretionaryBaseline =
      options?.discretionaryBaseline !== undefined
        ? options.discretionaryBaseline
        : defaultMonthlyBaseline

    return calculateCycleBurnRate({
      cumulativeSpend,
      discretionaryBaseline,
      referenceDate: options?.referenceDate,
    })
  }, [
    dailyLogs,
    baseline,
    options?.cumulativeSpend,
    options?.discretionaryBaseline,
    options?.referenceDate,
  ])
}

export default useCycleBurnRate

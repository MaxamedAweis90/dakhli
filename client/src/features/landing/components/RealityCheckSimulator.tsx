import React, { useState, useId } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CurrencyPreset {
  code: 'USD' | 'EUR' | 'SOS'
  symbol: string
  multiplier: number
  format: (val: number) => string
}

const CURRENCIES: Record<'USD' | 'EUR' | 'SOS', CurrencyPreset> = {
  USD: {
    code: 'USD',
    symbol: '$',
    multiplier: 1,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    multiplier: 0.92,
    format: (v) => `€${Math.round(v).toLocaleString()}`,
  },
  SOS: {
    code: 'SOS',
    symbol: 'Sh.So.',
    multiplier: 26000,
    format: (v) => `${Math.round(v).toLocaleString()} Sh.So.`,
  },
}

export const RealityCheckSimulator: React.FC<{ className?: string }> = ({ className }) => {
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'SOS'>('USD')
  const [grossBalance, setGrossBalance] = useState(3800)
  const [savingsCommitted, setSavingsCommitted] = useState(1300)
  const [overheadsDue, setOverheadsDue] = useState(1650)
  const [daysToPayday, setDaysToPayday] = useState(16)

  const grossId = useId()
  const savingsId = useId()
  const overheadsId = useId()
  const daysId = useId()

  const cur = CURRENCIES[currency]

  const totalLocked = savingsCommitted + overheadsDue
  const netSpendable = Math.max(0, grossBalance - totalLocked)
  const isDeficit = grossBalance < totalLocked
  const deficitAmount = totalLocked - grossBalance
  const dailyCap = daysToPayday > 0 ? netSpendable / daysToPayday : 0

  const totalForBar = Math.max(grossBalance, totalLocked, 1)
  const overheadPct = Math.min(100, (overheadsDue / totalForBar) * 100)
  const savingsPct = Math.min(100 - overheadPct, (savingsCommitted / totalForBar) * 100)
  const spendablePct = Math.max(0, 100 - overheadPct - savingsPct)

  const resetToDefault = () => {
    setGrossBalance(3800)
    setSavingsCommitted(1300)
    setOverheadsDue(1650)
    setDaysToPayday(16)
  }

  return (
    <section
      id="simulator"
      className={cn('landing-section bg-white', className)}
    >
      <div className="wrap">
        {/* Section Header + Currency Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="max-w-2xl">
            <span className="block font-mono text-[13px] font-medium text-stone-600 mb-2">
              Dakhli Simulator
            </span>
            <h2 className="font-serif text-3xl sm:text-[40px] leading-[1.12] font-normal tracking-tight text-stone-900 text-balance">
              Dakhli spendable cash calculator
            </h2>
            <p className="font-sans text-base text-stone-700 mt-2.5 leading-relaxed max-w-[54ch]">
              Subtract locked reserves and pending bills from your gross bank balance to calculate your daily cap until payday.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Calculator currency"
            className="inline-flex items-center gap-1.5 shrink-0"
          >
            {(['USD', 'EUR', 'SOS'] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={currency === c}
                onClick={() => setCurrency(c)}
                className={cn(
                  'min-h-[44px] min-w-[52px] px-3 rounded-lg text-[13px] font-mono font-medium border transition-colors cursor-pointer',
                  currency === c
                    ? 'bg-stone-900 text-stone-50 border-stone-900'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500 hover:text-stone-900'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Equal-height k=5 Split (5 cols sliders / 7 cols ledger result) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Sliders Panel (col 1-5) */}
          <div className="lg:col-span-5 rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <label htmlFor={grossId} className="font-sans text-[15px] font-medium text-stone-900">
                    Gross balance
                  </label>
                  <span className="font-mono text-base font-semibold text-stone-900 tabular-nums shrink-0">
                    {cur.format(grossBalance * cur.multiplier)}
                  </span>
                </div>
                <input
                  id={grossId}
                  type="range"
                  min="500"
                  max="12000"
                  step="50"
                  value={grossBalance}
                  onChange={(e) => setGrossBalance(Number(e.target.value))}
                  style={{ '--range-color': '#1c1917' } as React.CSSProperties}
                  className="landing-range"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <label htmlFor={savingsId} className="font-sans text-[15px] font-medium text-stone-900">
                    Locked savings
                  </label>
                  <span className="font-mono text-base font-semibold text-emerald-800 tabular-nums shrink-0">
                    {cur.format(savingsCommitted * cur.multiplier)}
                  </span>
                </div>
                <input
                  id={savingsId}
                  type="range"
                  min="0"
                  max="6000"
                  step="50"
                  value={savingsCommitted}
                  onChange={(e) => setSavingsCommitted(Number(e.target.value))}
                  style={{ '--range-color': '#047857' } as React.CSSProperties}
                  className="landing-range"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <label htmlFor={overheadsId} className="font-sans text-[15px] font-medium text-stone-900">
                    Pending bills
                  </label>
                  <span className="font-mono text-base font-semibold text-red-700 tabular-nums shrink-0">
                    {cur.format(overheadsDue * cur.multiplier)}
                  </span>
                </div>
                <input
                  id={overheadsId}
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={overheadsDue}
                  onChange={(e) => setOverheadsDue(Number(e.target.value))}
                  style={{ '--range-color': '#b91c1c' } as React.CSSProperties}
                  className="landing-range"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <label htmlFor={daysId} className="font-sans text-[15px] font-medium text-stone-900">
                    Days to payday
                  </label>
                  <span className="font-mono text-base font-semibold text-stone-900 tabular-nums shrink-0">
                    {daysToPayday} {daysToPayday === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <input
                  id={daysId}
                  type="range"
                  min="1"
                  max="31"
                  step="1"
                  value={daysToPayday}
                  onChange={(e) => setDaysToPayday(Number(e.target.value))}
                  style={{ '--range-color': '#1c1917' } as React.CSSProperties}
                  className="landing-range"
                />
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] font-mono text-stone-700">
                {Math.round(spendablePct)}% free · {Math.round(savingsPct)}% saved · {Math.round(overheadPct)}% bills
              </span>
              <button
                type="button"
                onClick={resetToDefault}
                className="landing-btn-secondary"
              >
                <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Load defaults</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Ledger Result (col 6-12) */}
          <div
            data-ui="ledger-panel"
            className="lg:col-span-7 rounded-2xl border border-stone-200 bg-[#FAFAF9] p-5 sm:p-6 flex flex-col justify-between gap-5"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-medium text-stone-700 flex items-center gap-2">
                  {isDeficit ? (
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  )}
                  <span>True net spendable cash</span>
                </span>
                <span className="font-mono text-sm text-stone-600 line-through decoration-red-600 tabular-nums">
                  {cur.format(grossBalance * cur.multiplier)} gross
                </span>
              </div>

              {isDeficit ? (
                <div className="text-3xl sm:text-4xl font-mono font-bold text-red-700 tabular-nums">
                  - {cur.format(deficitAmount * cur.multiplier)}
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl font-mono font-bold text-stone-900 tabular-nums">
                  {cur.format(netSpendable * cur.multiplier)}
                </div>
              )}

              <p className="font-sans text-base text-stone-700 leading-relaxed">
                {isDeficit
                  ? 'Committed bills and reserves exceed your gross balance for this payday cycle.'
                  : `${cur.format(totalLocked * cur.multiplier)} remains protected across due bills and savings reserves.`}
              </p>

              <svg
                viewBox="0 0 400 22"
                className="w-full h-5 rounded-md overflow-hidden"
                role="img"
                aria-label="Allocation split between bills, savings, and spendable cash"
              >
                <rect x="0" y="0" width="400" height="22" fill="#e7e5e4" rx="5" />
                <rect x="0" y="0" width={4 * overheadPct} height="22" fill="#b91c1c" />
                <rect x={4 * overheadPct} y="0" width={4 * savingsPct} height="22" fill="#047857" />
                <rect
                  x={4 * (overheadPct + savingsPct)}
                  y="0"
                  width={4 * spendablePct}
                  height="22"
                  fill="#1c1917"
                />
              </svg>
            </div>

            <div className="rounded-xl bg-white border border-stone-200 p-4 flex items-center justify-between gap-4">
              <div>
                <span className="block font-mono text-[13px] text-stone-600">Daily spending cap</span>
                <span className="block font-sans text-base text-stone-800 mt-0.5">
                  Allowance across {daysToPayday} {daysToPayday === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">
                  {isDeficit ? cur.format(0) : cur.format(dailyCap * cur.multiplier)}
                </span>
                <span className="block text-[13px] text-stone-600 font-mono">/ day</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link to="/register" className="landing-btn-primary flex-1">
                <span>Apply to live budget</span>
                <ArrowRight className="w-4 h-4 btn-arrow shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RealityCheckSimulator

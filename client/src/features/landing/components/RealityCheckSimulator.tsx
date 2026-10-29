import React, { useState, useId } from 'react'
import { ArrowDown, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CurrencyPreset {
  code: 'USD' | 'EUR' | 'SOS'
  symbol: string
  label: string
  multiplier: number
  format: (val: number) => string
}

const CURRENCIES: Record<string, CurrencyPreset> = {
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'USD ($)',
    multiplier: 1,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'EUR (€)',
    multiplier: 0.92,
    format: (v) => `€${Math.round(v).toLocaleString()}`,
  },
  SOS: {
    code: 'SOS',
    symbol: 'Sh.So.',
    label: 'SOS (Sh.So.)',
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

  // Arithmetic
  const totalLocked = savingsCommitted + overheadsDue
  const netSpendable = Math.max(0, grossBalance - totalLocked)
  const isDeficit = grossBalance < totalLocked
  const deficitAmount = totalLocked - grossBalance
  const dailyCap = daysToPayday > 0 ? netSpendable / daysToPayday : 0

  // Distribution percentages
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
    <div
      id="simulator"
      className={cn(
        'rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm',
        className
      )}
    >
      {/* Meta Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-900 bg-stone-100 px-2.5 py-1 rounded border border-stone-200">
            Specimen § 01
          </span>
          <span className="font-mono text-xs text-stone-500">
            Formula: Net = Gross - Reserves - Overheads
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Currency Switcher */}
          <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
            {(['USD', 'EUR', 'SOS'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={cn(
                  'px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors',
                  currency === c
                    ? 'bg-stone-900 text-stone-50 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetToDefault}
            aria-label="Reset to default example"
            title="Reset to default numbers"
            className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Column: Sliders & Mechanics */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-stone-900 tracking-tight">
              Test your numbers against reality
            </h3>
            <p className="text-xs text-stone-600 font-sans mt-1 leading-relaxed max-w-[55ch]">
              Adjust the sliders below to match your actual bank balance, locked reserve savings,
              and unpaid overhead bills.
            </p>
          </div>

          <div className="flex flex-col gap-4 bg-stone-50 border border-stone-200 rounded-xl p-5">
            {/* 1. Gross Balance */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor={grossId} className="font-sans font-medium text-stone-800">
                  1. Gross Bank Balance (What your banking app displays)
                </label>
                <span className="font-mono text-sm font-semibold text-stone-900 tabular-nums">
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
                className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-400">
                <span>{cur.format(500 * cur.multiplier)}</span>
                <span>{cur.format(12000 * cur.multiplier)}</span>
              </div>
            </div>

            {/* 2. Committed Reserves */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor={savingsId} className="font-sans font-medium text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  2. Reserve Savings (Emergency buffer + locked Save Plans)
                </label>
                <span className="font-mono text-sm font-semibold text-emerald-700 tabular-nums">
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
                className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-400">
                <span>0</span>
                <span>{cur.format(6000 * cur.multiplier)}</span>
              </div>
            </div>

            {/* 3. Due Overheads */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor={overheadsId} className="font-sans font-medium text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                  3. Pending Overhead Bills (Rent, utilities, subscriptions)
                </label>
                <span className="font-mono text-sm font-semibold text-red-700 tabular-nums">
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
                className="w-full accent-red-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-400">
                <span>0</span>
                <span>{cur.format(5000 * cur.multiplier)}</span>
              </div>
            </div>

            {/* 4. Days Remaining */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor={daysId} className="font-sans font-medium text-stone-800">
                  4. Days Remaining in Income Cycle (Until next paycheck)
                </label>
                <span className="font-mono text-sm font-semibold text-stone-900 tabular-nums">
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
                className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-400">
                <span>1 day</span>
                <span>31 days</span>
              </div>
            </div>
          </div>

          {/* Allocation Ratio Bar */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-mono text-stone-500 flex items-center justify-between uppercase tracking-wider">
              <span>Capital Distribution</span>
              <span>
                {Math.round(spendablePct)}% spendable • {Math.round(savingsPct)}% saved • {Math.round(overheadPct)}% bills
              </span>
            </div>
            <div className="h-2.5 w-full bg-stone-100 rounded-md overflow-hidden flex border border-stone-200">
              <div
                style={{ width: `${overheadPct}%` }}
                className="bg-red-600 transition-all duration-150"
                title="Due Overhead Bills"
              />
              <div
                style={{ width: `${savingsPct}%` }}
                className="bg-emerald-600 transition-all duration-150"
                title="Committed Savings"
              />
              <div
                style={{ width: `${spendablePct}%` }}
                className="bg-stone-900 transition-all duration-150"
                title="Net Spendable Liquidity"
              />
            </div>
          </div>
        </div>

        {/* Right Column: The Contrast Ledger */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-stone-50 border border-stone-200 p-6">
          <div className="flex flex-col gap-4">
            {/* Bank False Signal Box */}
            <div className="p-4 rounded-lg bg-white border border-stone-200">
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                The Bank App's False Signal
              </div>
              <div className="text-2xl font-mono font-bold text-stone-400 line-through decoration-red-500/70 mt-1 tabular-nums">
                {cur.format(grossBalance * cur.multiplier)}
              </div>
              <p className="text-[11px] text-stone-600 font-sans mt-1.5 leading-snug">
                You feel you have this total. In reality, {cur.format(totalLocked * cur.multiplier)} is
                already committed to rent, bills, and reserves.
              </p>
            </div>

            <div className="flex justify-center -my-1 text-stone-400">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Dakhli Reality Box */}
            <div
              className={cn(
                'p-5 rounded-xl border-2 transition-all bg-white',
                isDeficit
                  ? 'border-red-600 text-red-900'
                  : 'border-stone-900 text-stone-900'
              )}
            >
              <div className="text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5">
                {isDeficit ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Dakhli True Net Spendable</span>
              </div>

              {isDeficit ? (
                <div className="mt-2">
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-red-600 tabular-nums">
                    - {cur.format(deficitAmount * cur.multiplier)}
                  </div>
                  <p className="text-xs text-red-700 font-sans mt-1 leading-snug">
                    Deficit: Your committed bills and savings exceed your current gross balance.
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-stone-900 tabular-nums">
                    {cur.format(netSpendable * cur.multiplier)}
                  </div>
                  <p className="text-xs text-stone-600 font-sans mt-1">
                    Real uncommitted liquidity available to spend right now.
                  </p>
                </div>
              )}
            </div>

            {/* Daily Spending Cap Metric */}
            {!isDeficit && (
              <div className="p-4 rounded-lg bg-white border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                    Daily Spending Cap
                  </div>
                  <div className="text-xs text-stone-600 font-sans mt-0.5">
                    Safe allowance for {daysToPayday} days
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-bold text-stone-900 tabular-nums">
                    {cur.format(dailyCap * cur.multiplier)}
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono block">/ day</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-200 mt-4">
            <p className="text-[11px] font-mono text-stone-500 leading-normal">
              ✦ Spend below the cap = unspent cash compounds into savings. Spend over = immediate arithmetic deficit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealityCheckSimulator

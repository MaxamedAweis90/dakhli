import React from 'react'
import { useSavingsStore } from '@/stores/savingsStore'
import { SegmentedTicks } from '@/components/shared/SavingPlanCard'
import { PiggyBank, Pin } from '@/components/shared/icons'
import { cn } from '@/lib/utils'

export const SavePlansPage: React.FC = () => {
  const { plans, togglePin } = useSavingsStore()
  const pinnedCount = plans.filter((p) => p.isPinned).length

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="p-6 rounded-[26px] bg-[#13151B] border border-white/[0.06] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Save Plans</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pinned plans appear directly on your Dashboard's Saving plan card (up to 3).
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#1A1D26] border border-white/5 text-slate-300">
            Pinned: <strong className="text-amber-400 font-mono">{pinnedCount}</strong> / 3
          </span>
        </div>
      </div>

      {/* Grid of Save Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-6 rounded-[26px] bg-[#13151B] border border-white/[0.06] shadow-sm flex flex-col justify-between hover:border-white/10 transition-colors"
          >
            <div>
              {/* Header: Title and Pin Action */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {plan.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 capitalize">{plan.category} target</span>
                </div>

                <button
                  type="button"
                  onClick={() => togglePin(plan.id)}
                  aria-label={plan.isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                  className={cn(
                    'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border',
                    plan.isPinned
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm'
                      : 'bg-[#1A1D26] text-slate-400 border-white/5 hover:text-white hover:border-white/15'
                  )}
                >
                  <Pin className={cn('w-3.5 h-3.5', plan.isPinned && 'fill-amber-400')} />
                  <span>{plan.isPinned ? 'Pinned' : 'Pin to Dashboard'}</span>
                </button>
              </div>

              {/* Amounts Row */}
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold text-white font-mono">
                  {formatCurrency(plan.currentSaved)}
                  <span className="text-xs text-slate-400 font-normal">
                    {' '}/ {formatCurrency(plan.targetAmount)}
                  </span>
                </span>
                <span className="text-sm font-semibold font-mono text-slate-300">
                  {plan.percentage}%
                </span>
              </div>

              {/* Segmented Tick Bar */}
              <SegmentedTicks percentage={plan.percentage} />
            </div>

            {/* Quick Status Footer */}
            <div className="mt-5 pt-3.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
              <span>Remaining: {formatCurrency(Math.max(0, plan.targetAmount - plan.currentSaved))}</span>
              <span
                className={cn(
                  'font-medium text-[11px]',
                  plan.percentage >= 100
                    ? 'text-amber-400'
                    : plan.percentage >= 50
                      ? 'text-emerald-400'
                      : 'text-indigo-400'
                )}
              >
                {plan.percentage >= 100 ? 'Goal Met' : `${100 - plan.percentage}% to goal`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SavePlansPage

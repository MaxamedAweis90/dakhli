import React from 'react'
import { LiquidityBanner } from '@/components/shared/LiquidityBanner'
import { MetricCard } from '@/components/primitives/MetricCard'
import { StatusBadge } from '@/components/primitives/StatusBadge'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Receipt, CalendarCheck, PiggyBank } from '@/components/shared/icons'

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Real-time Liquidity Triplet Banner */}
      <LiquidityBanner
        grossBalance={260375.03}
        totalSaved={118759.97}
        netSpendable={141615.06}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Monthly Overhead"
          amount="$375.03"
          subtitle="4 obligations remaining"
          badge={<StatusBadge variant="pending" label="Pending" />}
          icon={<Receipt className="w-5 h-5" />}
        />
        <MetricCard
          title="Today's Cap"
          amount="$45.00"
          subtitle="Check-in pending"
          trend={{ value: '+$5.00 under', isPositive: true }}
          icon={<CalendarCheck className="w-5 h-5" />}
        />
        <MetricCard
          title="Active Savings"
          amount="$118,759.97"
          subtitle="3 funded plans"
          badge={<StatusBadge variant="paid" label="Funded" />}
          icon={<PiggyBank className="w-5 h-5" />}
        />
      </div>

      {/* Goal Progress Preview */}
      <div className="p-6 rounded-card bg-surface-card border border-surface-subtle shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Emergency Fund Progress</h3>
            <p className="text-xs text-slate-400">Target: $10,000.00</p>
          </div>
          <StatusBadge variant="paid" label="68% Funded" />
        </div>
        <ProgressBar value={6800} max={10000} variant="amber" showPercentage />
      </div>
    </div>
  )
}

export default DashboardPage

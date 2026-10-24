import React, { useState } from 'react'
import { LiquidityBanner } from '@/components/shared/LiquidityBanner'
import { SavingPlanCard } from '@/components/shared/SavingPlanCard'
import {
  Check,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from '@/components/shared/icons'
import { cn } from '@/lib/utils'

export const DashboardPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<'essentials' | 'future' | 'wants'>('essentials')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ================= COLUMN 1 ================= */}
      <div className="space-y-5">
        {/* Row 1: Liquidity Summary Card */}
        <LiquidityBanner
          grossBalance={260375.03}
          totalSaved={118759.97}
          netSpendable={141615.06}
        />

        {/* Row 2: Saving Plan Card (Dynamic Pinned Savings with 36-tick multi-color gradient) */}
        <SavingPlanCard />
      </div>

      {/* ================= COLUMN 2 ================= */}
      <div className="space-y-5">
        {/* Row 1: Overhead Warm Gradient Card */}
        <div className="rounded-3xl bg-overhead-warm p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C24160]">
              Overhead Bills
            </span>
            <p className="text-xs text-[#5C333D] font-medium mt-0.5">This Month</p>
          </div>

          {/* Unpaid vs Paid Figures in crisp white font-mono */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                $175.03
              </div>
              <p className="text-xs text-[#7A3E4D] font-medium mt-0.5">Unpaid</p>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                $200.00
              </div>
              <p className="text-xs text-[#7A3E4D] font-medium mt-0.5">Paid</p>
            </div>
          </div>

          {/* Quick items inner card: clean white capsule matching reference */}
          <div className="bg-white rounded-2xl p-4 shadow-sm text-[#2D1F24]">
            <p className="text-xs font-semibold text-slate-800 mb-2.5">Quick items</p>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center space-x-2.5">
                <span>🏠</span>
                <span>Rent</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span>📶</span>
                <span>Internet</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span>🏋️</span>
                <span>Gym</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Cash Flow Card */}
        <div className="rounded-3xl bg-[#13151B] border border-white/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Cash Flow</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-950 font-mono text-xs font-bold shadow-sm">
              +$6,195
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-1 text-slate-400 text-xs mb-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Income</span>
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                $8,385
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1 text-slate-400 text-xs mb-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span>Expenses</span>
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                $2,200
              </div>
            </div>
          </div>

          {/* Expenses Limit: Neon gradient capsule */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="text-slate-400">Expenses limit</span>
              <span className="font-mono font-bold text-white text-sm">$82,300</span>
            </div>
            <div className="w-full h-7 rounded-xl bg-expenses-neon shadow-inner" />
          </div>
        </div>
      </div>

      {/* ================= COLUMN 3 ================= */}
      <div className="space-y-5">
        {/* Row 1: Upcoming Overhead Card */}
        <div className="rounded-3xl bg-[#13151B] border border-white/5 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming Overhead</h3>
          </div>

          <div className="space-y-3">
            {/* Gym */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1D26] border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#252A37] flex items-center justify-center text-sm">
                  🏋️
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Gym</p>
                  <p className="text-[11px] text-slate-400">1 Dec</p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-white">$20</span>
            </div>

            {/* Rent */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1D26] border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#252A37] flex items-center justify-center text-sm">
                  🏠
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Rent</p>
                  <p className="text-[11px] text-slate-400">17 Dec</p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-white">$200</span>
            </div>

            {/* Other dues */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1D26] border border-white/5 opacity-80">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#252A37] flex items-center justify-center text-emerald-400">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Other dues</p>
                  <p className="text-[11px] text-slate-400">22 Dec</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            </div>

            {/* Apple Music */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1D26] border border-white/5 opacity-80">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#252A37] flex items-center justify-center text-sm">
                  🎵
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Apple Music</p>
                  <p className="text-[11px] text-slate-400">22 Dec</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Item Registry Card */}
        <div className="rounded-3xl bg-[#13151B] border border-white/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Item Registry</h3>
          </div>

          {/* Tier Selector Pills */}
          <div className="flex items-center space-x-1 p-1 bg-[#1A1D26] rounded-xl mb-4 border border-white/5">
            <button
              onClick={() => setSelectedTier('essentials')}
              className={cn(
                'flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                selectedTier === 'essentials'
                  ? 'bg-[#13151B] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Essentials
            </button>
            <button
              onClick={() => setSelectedTier('future')}
              className={cn(
                'flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                selectedTier === 'future'
                  ? 'bg-[#13151B] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Future Needs
            </button>
            <button
              onClick={() => setSelectedTier('wants')}
              className={cn(
                'flex-1 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                selectedTier === 'wants'
                  ? 'bg-[#13151B] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Wants
            </button>
          </div>

          {/* Grid of Items */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#1A1D26] border border-white/5 flex flex-col items-center justify-center space-y-1">
              <span className="text-lg">🧴</span>
              <span className="text-[10px] text-slate-400">Tier</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1A1D26] border border-white/5 flex flex-col items-center justify-center space-y-1">
              <span className="text-lg">👟</span>
              <span className="text-[10px] text-slate-400">Tier</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1A1D26] border border-white/5 flex flex-col items-center justify-center space-y-1">
              <span className="text-lg">🏀</span>
              <span className="text-[10px] text-slate-400">Tier</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1A1D26]/50 border border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center transition-colors cursor-pointer">
              <Plus className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

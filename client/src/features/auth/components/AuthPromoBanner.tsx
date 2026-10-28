import React, { useState, useEffect } from 'react'
import { Home, Wifi, Dumbbell, Star } from '@/components/shared/icons'
import { cn } from '@/lib/utils'

interface PromoSlide {
  id: string
  badge: string
  headline: string
  description: string
  renderGraphic: () => React.ReactNode
}

export const AuthPromoBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const slides: PromoSlide[] = [
    {
      id: 'liquidity',
      badge: 'Unified Liquidity',
      headline: 'A Unified Hub for Smarter Financial Decision-Making',
      description:
        'Dakhli empowers you with a unified financial command center — delivering deep insights and a 360° view of your entire economic world.',
      renderGraphic: () => (
        <div className="relative w-full max-w-[460px] h-[225px] mx-auto flex items-center justify-center">
          {/* Card 1: Financial Plan / Donut Chart Card */}
          <div className="absolute top-0 left-3 w-[220px] p-3.5 rounded-2xl bg-[#17181F]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-20 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400">Financial Plan</span>
              <span className="text-[10px] text-slate-400 font-mono">This Month</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#252834" strokeWidth="4.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#E5A855"
                    strokeWidth="4.5"
                    strokeDasharray="55 100"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="4.5"
                    strokeDasharray="25 100"
                    strokeDashoffset="-58"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white tabular-nums">$ 2,005.45</div>
                <div className="text-[9.5px] text-slate-400">Available</div>
                <div className="mt-1 space-y-0.5 text-[8.5px]">
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5A855]" />
                    <span>Budgeted</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>Spendable</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2.5 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] text-slate-400">
              <span>Anticipated Costs</span>
              <span className="text-white font-medium">$ 1,200</span>
            </div>
          </div>

          {/* Card 2: Future Funds */}
          <div className="absolute top-4 right-3 w-[220px] p-4 rounded-2xl bg-[#1C1F2B]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-10 transform rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="text-[11px] font-medium text-slate-400 mb-1">Future Funds</div>
            <div className="text-xs font-semibold text-white">Bucket List Trip</div>
            <div className="text-[9.5px] text-slate-400">Target Date: Apr 2026</div>
            <div className="flex items-baseline gap-1 mt-1 text-xs">
              <span className="font-bold text-white">$1,900</span>
              <span className="text-[10px] text-slate-400">/ $4,500</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#E5A855] to-amber-300 h-full w-[82%] rounded-full" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>Progress</span>
              <span className="text-[#E5A855] font-semibold">82%</span>
            </div>
          </div>

          {/* Card 3: Capital Allocations */}
          <div className="absolute bottom-1 w-[290px] p-3.5 rounded-2xl bg-[#15161D]/95 backdrop-blur-xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] z-30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-white">Capital Allocations</span>
              <span className="text-[9px] text-emerald-400 font-mono font-medium">+12%</span>
            </div>
            <div className="text-xs font-bold text-white tabular-nums mb-1.5">$ 17,366.00</div>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center justify-between p-1 rounded-lg bg-white/[0.03]">
                <span className="text-slate-300">iPhone 15 Pro Max</span>
                <span className="text-white font-mono font-medium">$1,100</span>
              </div>
              <div className="flex items-center justify-between p-1 rounded-lg bg-white/[0.03]">
                <span className="text-slate-300">Workstation Setup</span>
                <span className="text-white font-mono font-medium">$2,400</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'savings',
      badge: 'Target Goals',
      headline: 'Targeted Wealth Accumulation with Micro-Milestones',
      description:
        'Track multi-tier savings goals with high-resolution 42-tick segmented progress meters, priority pinning, and milestone unlocks.',
      renderGraphic: () => (
        <div className="relative w-full max-w-[460px] h-[225px] mx-auto flex items-center justify-center">
          {/* Card 1: Pinned Savings Plans */}
          <div className="absolute top-0 left-3 w-[220px] p-3.5 rounded-2xl bg-[#17181F]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-20 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400">Pinned Savings</span>
              <span className="text-[9.5px] text-[#E5A855] font-mono font-semibold">3 Active</span>
            </div>
            {/* Plan 1 */}
            <div className="mb-2">
              <div className="flex justify-between text-[10.5px] mb-1">
                <span className="text-white font-medium">Education Reserve</span>
                <span className="text-emerald-400 font-bold">68%</span>
              </div>
              <div className="flex gap-[2px] h-[9px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-[1px]',
                      i < 14 ? 'bg-gradient-to-t from-emerald-500 to-emerald-300' : 'bg-white/10'
                    )}
                  />
                ))}
              </div>
            </div>
            {/* Plan 2 */}
            <div>
              <div className="flex justify-between text-[10.5px] mb-1">
                <span className="text-white font-medium">Fitness & Gym</span>
                <span className="text-[#E5A855] font-bold">45%</span>
              </div>
              <div className="flex gap-[2px] h-[9px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-[1px]',
                      i < 9 ? 'bg-gradient-to-t from-[#E5A855] to-amber-200' : 'bg-white/10'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Goal Milestone */}
          <div className="absolute top-4 right-3 w-[210px] p-4 rounded-2xl bg-[#1C1F2B]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-10 transform rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="text-[11px] font-medium text-slate-400 mb-1">Milestone Target</div>
            <div className="text-xs font-semibold text-white">Emergency Fund</div>
            <div className="text-[9.5px] text-slate-400">Target: Dec 2026</div>
            <div className="flex items-baseline gap-1 mt-1 text-xs">
              <span className="font-bold text-white">$12,000</span>
              <span className="text-[10px] text-slate-400">/ $20,000</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-[#E5A855] h-full w-[60%] rounded-full" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>On Schedule</span>
              <span className="text-emerald-400 font-semibold">60%</span>
            </div>
          </div>

          {/* Card 3: Milestone Reached */}
          <div className="absolute bottom-1 w-[280px] p-3 rounded-xl bg-[#14151C]/95 backdrop-blur-xl border border-[#E5A855]/30 shadow-[0_24px_50px_rgba(0,0,0,0.7)] z-30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E5A855]/15 flex items-center justify-center text-[#E5A855]">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-white">Target Achieved</div>
                <div className="text-[9.5px] text-slate-400">Downpayment goal reached 100%</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#E5A855] font-semibold">Complete</span>
          </div>
        </div>
      ),
    },
    {
      id: 'overheads',
      badge: 'Overheads',
      headline: 'Never Miss a Due Date with Payday Scheduling',
      description:
        'Automate recurring overhead obligations, eliminate late fees, and anchor your liabilities directly to your 25th payday cycle.',
      renderGraphic: () => (
        <div className="relative w-full max-w-[460px] h-[225px] mx-auto flex items-center justify-center">
          {/* Card 1: Overhead Bills Hero */}
          <div className="absolute top-0 left-3 w-[220px] p-3.5 rounded-2xl bg-[#181A24]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-20 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-white">Overhead Bills</span>
              <span className="text-[9.5px] text-slate-400 font-mono">This Month</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="text-[9.5px] text-slate-400">Unpaid</div>
                <div className="text-xs font-bold text-white tabular-nums">$ 175.03</div>
              </div>
              <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="text-[9.5px] text-slate-400">Paid</div>
                <div className="text-xs font-bold text-emerald-400 tabular-nums">$ 200.00</div>
              </div>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/[0.02]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Home className="w-3 h-3 text-slate-400" />
                  <span>Rent</span>
                </div>
                <span className="text-white font-mono">$ 200.00</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-md bg-white/[0.02]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="w-3 h-3 text-slate-400" />
                  <span>Internet</span>
                </div>
                <span className="text-emerald-400 font-semibold font-mono">Paid</span>
              </div>
            </div>
          </div>

          {/* Card 2: Payday Anchor */}
          <div className="absolute top-4 right-3 w-[210px] p-4 rounded-2xl bg-[#1C1F2B]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-10 transform rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="text-[11px] font-medium text-slate-400 mb-1">Payday Anchor</div>
            <div className="text-xs font-semibold text-white">Salary Day Sync</div>
            <div className="text-[9.5px] text-slate-400">Anchor: 25th of month</div>
            <div className="flex items-center gap-2 mt-2.5 p-1.5 rounded-lg bg-white/[0.03]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-white">Auto-generate: Active</span>
            </div>
          </div>

          {/* Card 3: Upcoming Obligations */}
          <div className="absolute bottom-1 w-[280px] p-3 rounded-xl bg-[#14151C]/95 backdrop-blur-xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] z-30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-white font-medium">Gym Membership</span>
            </div>
            <span className="text-[10px] text-amber-300 font-mono font-semibold">$ 20.00 Due Soon</span>
          </div>
        </div>
      ),
    },
    {
      id: 'daily',
      badge: 'Daily Cap',
      headline: 'Master Everyday Spending One Day at a Time',
      description:
        'Stay accountable with daily caps, daily check-offs, and live cumulative variance analytics to build unstoppable momentum.',
      renderGraphic: () => (
        <div className="relative w-full max-w-[460px] h-[225px] mx-auto flex items-center justify-center">
          {/* Card 1: Today's Cap */}
          <div className="absolute top-0 left-3 w-[215px] p-3.5 rounded-2xl bg-[#17181F]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-20 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-white">Today's Cap</span>
              <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                on_track
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-xl font-bold text-white tabular-nums">$ 20.00</span>
              <span className="text-[10px] text-slate-400">/ $ 30.00 cap</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-emerald-400 h-full w-[66%] rounded-full" />
            </div>
            <div className="text-[9.5px] text-slate-400 flex justify-between">
              <span>Remaining Today</span>
              <span className="text-emerald-400 font-bold">$ 10.00</span>
            </div>
          </div>

          {/* Card 2: Streak Analytics */}
          <div className="absolute top-4 right-3 w-[210px] p-4 rounded-2xl bg-[#1C1F2B]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-10 transform rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="text-[11px] font-medium text-slate-400 mb-1">Consistency</div>
            <div className="text-xs font-semibold text-white">14-Day Streak</div>
            <div className="text-[9.5px] text-slate-400">Discipline Score: 94%</div>
            <div className="mt-2 text-[10px] text-slate-300 space-y-0.5">
              <div>Planned: $ 30.00 / day</div>
              <div>Average Spend: $ 21.40</div>
            </div>
          </div>

          {/* Card 3: Cumulative Savings */}
          <div className="absolute bottom-1 w-[280px] p-3 rounded-xl bg-[#14151C]/95 backdrop-blur-xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] z-30 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Cumulative Savings</span>
            <span className="text-[#E5A855] font-bold tabular-nums text-xs">+$ 145.00 this week</span>
          </div>
        </div>
      ),
    },
  ]

  // Auto-slide effect every 6 seconds unless hovered
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, slides.length])

  const slide = slides[currentSlide]

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="h-full w-full flex flex-col justify-between py-6 px-8 xl:px-12 2xl:px-16 bg-gradient-to-br from-[#141620] via-[#111319] to-[#0D0E12] relative overflow-hidden select-none"
    >
      {/* Ambient Radial Bloom */}
      <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-[#E5A855]/10 blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] rounded-full bg-emerald-500/8 blur-[110px] pointer-events-none" />

      {/* Top Floating Graphics Cluster */}
      <div className="relative z-10 my-auto transition-all duration-500 ease-out">
        {slide.renderGraphic()}
      </div>

      {/* Center Brand Emblem & Content */}
      <div className="relative z-10 mb-4 flex flex-col items-center text-center">
        {/* Brand Emblem */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E5A855] to-[#C98B35] p-[1px] shadow-[0_4px_16px_rgba(229,168,85,0.25)] mb-2.5 flex items-center justify-center">
          <div className="w-full h-full bg-[#17181D] rounded-[11px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#E5A855]" aria-hidden="true">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
        </div>

        {/* Dynamic Badge */}
        <span className="text-[10px] font-semibold tracking-wider uppercase text-[#E5A855] mb-1.5 font-mono">
          {slide.badge}
        </span>

        {/* Dynamic Headline */}
        <h3 className="text-lg xl:text-xl font-bold text-white tracking-tight leading-snug max-w-[420px] min-h-[3rem] flex items-center justify-center">
          {slide.headline}
        </h3>

        {/* Dynamic Description */}
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-[380px] min-h-[2.2rem]">
          {slide.description}
        </p>
      </div>

      {/* Bottom Slider Pagination Indicators */}
      <div className="relative z-10 flex items-center justify-center gap-2 pt-1">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
              currentSlide === idx
                ? 'w-10 bg-[#E5A855] shadow-[0_0_10px_rgba(229,168,85,0.7)]'
                : 'w-6 bg-white/20 hover:bg-white/40'
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default AuthPromoBanner

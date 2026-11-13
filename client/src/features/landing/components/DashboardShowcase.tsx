import React, { useState, useEffect, useId } from 'react'
import {
  Home,
  Layers,
  ArrowLeftRight,
  PiggyBank,
  ClipboardList,
  Search,
  Wifi,
  Dumbbell,
  Check,
  ChevronRight,
  User as UserIcon,
} from '@/components/shared/icons'
import { Zap } from 'lucide-react'
import { AnimatedNumber } from '@/components/shared/AnimatedNumber'
import { SegmentedTicks } from '@/features/dashboard/components/SavingPlanCard'
import { cn } from '@/lib/utils'

type DemoCurrency = 'USD' | 'EUR' | 'SOS'

const CURRENCY_MAP: Record<
  DemoCurrency,
  { code: DemoCurrency; symbol: string; rate: number; decimals: number }
> = {
  USD: { code: 'USD', symbol: '$', rate: 1, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, decimals: 2 },
  SOS: { code: 'SOS', symbol: 'Sh.So. ', rate: 26000, decimals: 0 },
}

interface DemoBill {
  id: string
  name: string
  date: string
  amount: number
  icon: 'home' | 'wifi' | 'dumbbell' | 'zap'
  paid: boolean
}

const INITIAL_BILLS: DemoBill[] = [
  { id: 'rent', name: 'Apartment Rent', date: '17 Nov', amount: 550, icon: 'home', paid: false },
  { id: 'wifi', name: 'Fiber Internet', date: '12 Nov', amount: 65, icon: 'wifi', paid: false },
  { id: 'gym', name: 'Gym Pass', date: '5 Nov', amount: 40, icon: 'dumbbell', paid: false },
  { id: 'elec', name: 'Utilities', date: '28 Oct', amount: 95, icon: 'zap', paid: true },
]

type DemoTier = 'essentials' | 'future' | 'wants'

interface DemoRegistryItem {
  id: string
  name: string
  price: number
  saved?: number
  image: string
}

const DEMO_REGISTRY: Record<DemoTier, DemoRegistryItem[]> = {
  essentials: [
    {
      id: 'desk-lamp',
      name: 'Task Lamp',
      price: 60,
      saved: 60,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'flask',
      name: 'Flask',
      price: 35,
      saved: 35,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'brewer',
      name: 'Brewer',
      price: 55,
      saved: 40,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'pillow',
      name: 'Pillow',
      price: 70,
      image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=240&auto=format&fit=crop&q=80',
    },
  ],
  future: [
    {
      id: 'monitor',
      name: 'Monitor',
      price: 280,
      saved: 210,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'keyboard',
      name: 'Keyboard',
      price: 140,
      saved: 70,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'backpack',
      name: 'Daypack',
      price: 110,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'buds',
      name: 'Earbuds',
      price: 130,
      saved: 65,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=240&auto=format&fit=crop&q=80',
    },
  ],
  wants: [
    {
      id: 'headphones',
      name: 'Headset',
      price: 240,
      saved: 120,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'sneakers',
      name: 'Runners',
      price: 125,
      saved: 50,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'shades',
      name: 'Shades',
      price: 95,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'camera',
      name: 'Camera',
      price: 190,
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=240&auto=format&fit=crop&q=80',
    },
  ],
}

const SparklineSvg: React.FC<{
  path: string
  color: string
  dot: [number, number]
}> = ({ path, color, dot }) => {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 50" className="w-[4rem] h-[2rem] overflow-visible shrink-0" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`fade-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.25" stopColor={color} stopOpacity="0.85" />
          <stop offset="0.75" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path} stroke={`url(#fade-${id})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={dot[0]} cy={dot[1]} r="5" fill={color} opacity="0.28" />
      <circle cx={dot[0]} cy={dot[1]} r="2.4" fill={color} />
      <circle cx={dot[0]} cy={dot[1]} r="1" fill="#ffffff" />
    </svg>
  )
}

export const DashboardShowcase: React.FC<{ className?: string }> = ({ className }) => {
  const [currency, setCurrency] = useState<DemoCurrency>('USD')
  const [bills, setBills] = useState<DemoBill[]>(INITIAL_BILLS)
  const [tier, setTier] = useState<DemoTier>('future')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(timer)
  }, [])

  const cur = CURRENCY_MAP[currency]

  const toggleBill = (id: string) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)))
  }

  const baseMonthlyIncome = 3200
  const baseOtherPaidBills = 90
  const baseDailySpentSoFar = 650

  const unpaidTotal = bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0)
  const paidBillsTotal = bills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0) + baseOtherPaidBills

  const baseGrossBalance = 3200 - paidBillsTotal - baseDailySpentSoFar
  const baseTotalSaved = 750
  const baseNetSpendable = baseGrossBalance - baseTotalSaved

  const baseTotalExpenses = paidBillsTotal + unpaidTotal + baseDailySpentSoFar
  const baseMonthlyLimit = 2450
  const usedLimitPct = mounted ? Math.min(100, Math.round((baseTotalExpenses / baseMonthlyLimit) * 100)) : 0

  const grossVal = mounted ? baseGrossBalance * cur.rate : 0
  const savedVal = mounted ? baseTotalSaved * cur.rate : 0
  const netVal = mounted ? baseNetSpendable * cur.rate : 0
  const unpaidVal = mounted ? unpaidTotal * cur.rate : 0
  const paidVal = mounted ? paidBillsTotal * cur.rate : 0
  const incomeVal = mounted ? baseMonthlyIncome * cur.rate : 0
  const expensesVal = mounted ? baseTotalExpenses * cur.rate : 0
  const limitVal = mounted ? baseMonthlyLimit * cur.rate : 0
  const cashFlowNetVal = incomeVal - expensesVal

  const numFormat: Intl.NumberFormatOptions = {
    minimumFractionDigits: cur.decimals,
    maximumFractionDigits: cur.decimals,
  }
  const intFormat: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }

  const savePlans = [
    { id: 'emg', name: 'Emergency Buffer ($450 / $600)', pct: mounted ? 75 : 0 },
    { id: 'mon', name: 'Work Monitor ($210 / $280)', pct: mounted ? 75 : 0 },
    { id: 'trv', name: 'Winter Travel ($90 / $300)', pct: mounted ? 30 : 0 },
  ]

  const BILL_ICONS = {
    home: Home,
    wifi: Wifi,
    dumbbell: Dumbbell,
    zap: Zap,
  } as const

  return (
    <div
      data-ui="app-frame"
      role="region"
      aria-label="Interactive Dakhli application workspace"
      className={cn(
        'showcase-dark w-full rounded-2xl bg-[#111215] text-white border border-stone-300 shadow-[0_24px_56px_-14px_rgba(28,25,23,0.28)] overflow-hidden flex select-none font-sans',
        className
      )}
    >
      {/* Left Sidebar (Desktop lg+) */}
      <aside className="hidden lg:flex w-[11.5rem] shrink-0 flex-col justify-between px-3.5 py-4 border-r border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 h-7 pl-1">
            <div className="w-6 h-6 rounded-md bg-white/10 border border-white/15 flex items-center justify-center font-serif text-xs font-semibold text-white">
              د
            </div>
            <span className="text-[15px] leading-none font-semibold tracking-tight text-white">
              Dakhli
            </span>
          </div>

          <div className="mt-4 flex items-center h-8 rounded-lg bg-[#1b1c22] px-2.5 gap-2 border border-white/[0.05]">
            <Search className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
            <span className="text-xs text-zinc-400">Search</span>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            {[
              { name: 'Dashboard', icon: Home, active: true },
              { name: 'Overheads', icon: Layers, active: false },
              { name: 'Daily Check-Off', icon: ArrowLeftRight, active: false },
              { name: 'Save Plans', icon: PiggyBank, active: false },
              { name: 'Item Registry', icon: ClipboardList, active: false },
            ].map((nav) => {
              const Icon = nav.icon
              return (
                <div
                  key={nav.name}
                  className={cn(
                    'flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-xs',
                    nav.active
                      ? 'bg-[#22242c] text-white font-medium'
                      : 'text-zinc-400'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{nav.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom User Meta */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#18191f] border border-white/[0.06]">
          <div className="w-7 h-7 rounded-full bg-[#242630] flex items-center justify-center text-zinc-300 shrink-0">
            <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-medium text-white leading-tight">Omar K.</span>
            <span className="block text-[11px] text-zinc-400 leading-tight mt-0.5">Payday: 25th</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Canvas */}
      <div className="flex-1 min-w-0 p-3.5 sm:p-5 flex flex-col gap-3.5">
        {/* Top Workspace Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <div>
            <span className="block text-sm sm:text-base font-semibold tracking-tight text-white leading-tight">
              Hello, Omar
            </span>
            <span className="block text-[11px] text-zinc-400 mt-0.5 font-mono">
              Payday Cycle: 25 Oct – 24 Nov · 16 days remaining
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Workspace currency"
            className="inline-flex items-center rounded-lg bg-[#1A1C22] p-0.5 border border-white/10"
          >
            {(['USD', 'EUR', 'SOS'] as const).map((code) => (
              <button
                key={code}
                type="button"
                role="tab"
                aria-selected={currency === code}
                onClick={() => setCurrency(code)}
                className={cn(
                  'min-h-[44px] sm:min-h-[30px] px-2.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer',
                  currency === code
                    ? 'bg-[#2c303c] text-[#E5A855] font-semibold'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Dashboard Grid */}
        <div className="grid gap-3.5 lg:grid-cols-[1.52fr_1fr] items-stretch">
          {/* LEFT AREA */}
          <div className="flex flex-col gap-3.5">
            {/* TOP ROW: Liquidity Summary + Overhead Bills */}
            <div className="grid gap-3.5 sm:grid-cols-[1.12fr_1fr] items-stretch">
              {/* 1. Liquidity Summary */}
              <div className="rounded-xl bg-[#17181D] p-4 flex flex-col justify-between gap-3 border border-white/[0.06]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">Liquidity Summary</span>
                    <span className="text-[11px] font-mono text-[#E5A855] font-medium">
                      {cur.code}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums">
                    <span className="text-xs text-zinc-400">{cur.symbol}</span>
                    <span className="text-2xl font-semibold tracking-tight text-white">
                      <AnimatedNumber value={grossVal} formatOptions={numFormat} />
                    </span>
                  </div>
                  <span className="block mt-0.5 text-[11px] text-zinc-400">
                    Gross balance after paid bills
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/[0.06]">
                  <div>
                    <div className="text-sm font-mono font-medium text-white tabular-nums flex items-center gap-0.5">
                      <span>{cur.symbol}</span>
                      <AnimatedNumber value={savedVal} formatOptions={numFormat} />
                    </div>
                    <span className="block text-[11px] text-zinc-400">Locked Saved</span>
                  </div>
                  <div>
                    <div className="text-sm font-mono font-semibold text-[#86efac] tabular-nums flex items-center gap-0.5">
                      <span>{cur.symbol}</span>
                      <AnimatedNumber value={netVal} formatOptions={numFormat} />
                    </div>
                    <span className="block text-[11px] text-zinc-400">Net Spendable</span>
                  </div>
                </div>

                <div className="rounded-lg bg-[#1c231e] border border-emerald-500/25 px-3 py-2 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-medium text-[#86efac] leading-tight">
                      Daily cap on track
                    </span>
                    <span className="block text-[11px] text-zinc-300 font-mono mt-0.5">
                      {cur.symbol}
                      {Math.round(18.5 * cur.rate).toLocaleString()} / {cur.symbol}
                      {Math.round(45 * cur.rate).toLocaleString()} today
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] shrink-0" aria-hidden="true" />
                </div>
              </div>

              {/* 2. Overhead Bills */}
              <div className="hidden sm:flex rounded-xl bg-overhead-warm p-4 flex-col justify-between gap-2.5 text-stone-900">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-950">Overhead Bills</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-900" aria-hidden="true" />
                  </div>

                  <div className="mt-2 flex items-start gap-5 font-mono tabular-nums">
                    <div>
                      <div className="text-lg leading-tight font-bold text-stone-950">
                        <AnimatedNumber value={unpaidVal} prefix={cur.symbol} formatOptions={numFormat} />
                      </div>
                      <span className="block text-[11px] font-sans font-medium text-stone-800">Unpaid</span>
                    </div>
                    <div>
                      <div className="text-lg leading-tight font-bold text-stone-950">
                        <AnimatedNumber value={paidVal} prefix={cur.symbol} formatOptions={numFormat} />
                      </div>
                      <span className="block text-[11px] font-sans font-medium text-stone-800">Paid</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-950/15 pt-2.5">
                  <ul className="flex flex-col gap-1.5">
                    <li className="flex items-center justify-between text-xs text-stone-900">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Home className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                        Rent
                      </span>
                      <span className="font-mono font-semibold">
                        {cur.symbol}
                        {Math.round(550 * cur.rate).toLocaleString()}
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-xs text-stone-900">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Wifi className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                        Fiber
                      </span>
                      <span className="font-mono font-semibold">
                        {cur.symbol}
                        {Math.round(65 * cur.rate).toLocaleString()}
                      </span>
                    </li>
                    <li className="flex items-center justify-between text-xs text-stone-900">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Dumbbell className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                        Gym
                      </span>
                      <span className="font-mono font-semibold">
                        {cur.symbol}
                        {Math.round(40 * cur.rate).toLocaleString()}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Saving Plans + Cash Flow */}
            <div className="hidden md:grid gap-3.5 sm:grid-cols-[0.88fr_1.12fr] items-stretch">
              {/* 3. Saving Plans */}
              <div className="rounded-xl bg-[#17181D] p-4 flex flex-col justify-between gap-2.5 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-medium">Saving Plans</span>
                  <span className="text-[11px] font-mono text-zinc-300">
                    {cur.symbol}
                    {Math.round(750 * cur.rate).toLocaleString()} locked
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-2.5">
                  {savePlans.map((plan) => (
                    <div key={plan.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-100">{plan.name}</span>
                        <span className="text-[11px] font-mono text-zinc-300">{plan.pct}%</span>
                      </div>
                      <div className="mt-1">
                        <SegmentedTicks percentage={plan.pct} tickHeight="1.15rem" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Cash Flow */}
              <div className="rounded-xl bg-[#17181D] p-4 flex flex-col justify-between gap-2.5 border border-white/[0.06]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white">Cash Flow</span>
                  <span className="px-2 py-0.5 rounded-md bg-white text-stone-950 text-[11px] font-mono font-bold tabular-nums">
                    +{cur.symbol}
                    <AnimatedNumber value={cashFlowNetVal} formatOptions={intFormat} /> net
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="rounded-lg bg-[#1E2028] px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[11px] text-zinc-300">Monthly Income</span>
                      <span className="block text-sm font-mono font-semibold text-white tabular-nums">
                        <AnimatedNumber value={incomeVal} prefix={cur.symbol} formatOptions={intFormat} />
                      </span>
                    </div>
                    <SparklineSvg
                      path="M 0,38 C 12,38 18,44 26,42 C 34,40 38,12 48,8 C 55,5 57,20 63,20 C 69,20 73,15 80,18 C 88,22 93,36 100,40"
                      color="#4ADE80"
                      dot={[60, 20]}
                    />
                  </div>

                  <div className="rounded-lg bg-[#1E2028] px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[11px] text-zinc-300">Committed + Spent</span>
                      <span className="block text-sm font-mono font-semibold text-white tabular-nums">
                        <AnimatedNumber value={expensesVal} prefix={cur.symbol} formatOptions={intFormat} />
                      </span>
                    </div>
                    <SparklineSvg
                      path="M 0,30 C 8,30 14,22 24,20 C 34,18 38,36 48,38 C 58,40 64,18 74,18 C 84,18 88,38 100,32"
                      color="#F87171"
                      dot={[74, 18]}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-zinc-300">Cycle Spend Limit</span>
                    <span className="text-xs font-mono font-semibold text-white tabular-nums">
                      <AnimatedNumber value={limitVal} prefix={cur.symbol} formatOptions={intFormat} />
                    </span>
                  </div>
                  <div className="relative mt-1.5 w-full h-4">
                    <div className="absolute inset-0 rounded-md overflow-hidden bg-limit-hatch" />
                    <div
                      className="relative h-full rounded-md bg-expenses-neon transition-all duration-700 ease-out"
                      style={{ width: `${usedLimitPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Interactive Bills + Item Registry shown at >= 1024px) */}
          <div className="hidden lg:flex flex-col gap-3.5">
            {/* 5. Interactive Bills */}
            <div className="rounded-xl bg-[#17181D] p-4 flex flex-col justify-between gap-2 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-medium">Upcoming Overhead</span>
                <span className="text-[11px] font-mono text-[#E5A855]">Click to toggle</span>
              </div>

              <ul className="mt-1 flex flex-col gap-1">
                {bills.map((bill) => {
                  const Icon = BILL_ICONS[bill.icon]
                  return (
                    <li key={bill.id}>
                      <button
                        type="button"
                        onClick={() => toggleBill(bill.id)}
                        aria-pressed={bill.paid}
                        className="w-full flex items-center gap-2.5 min-h-[38px] px-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                      >
                        <span className="w-6 h-6 shrink-0 rounded-md bg-[#232632] flex items-center justify-center text-zinc-200">
                          <Icon className="w-3.5 h-3.5" strokeWidth={1.7} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-white leading-tight">
                            {bill.name}
                          </span>
                          <span className="block text-[11px] text-zinc-400 leading-tight mt-0.5">
                            Due {bill.date}
                          </span>
                        </span>
                        {bill.paid ? (
                          <span className="w-5 h-5 rounded-full bg-[#4ADE80]/20 text-[#86efac] border border-[#4ADE80]/40 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" strokeWidth={2.6} aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-semibold text-white tabular-nums shrink-0">
                            {cur.symbol}
                            {Math.round(bill.amount * cur.rate).toLocaleString()}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* 6. 3-Tier Item Registry */}
            <div className="rounded-xl bg-[#17181D] p-4 flex flex-col justify-between gap-2.5 flex-1 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-medium">Item Registry</span>
                <span className="text-[11px] font-mono text-zinc-400">3 tiers</span>
              </div>

              <div role="tablist" aria-label="Registry priority tiers" className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: 'essentials', label: 'Essentials' },
                    { key: 'future', label: 'Future' },
                    { key: 'wants', label: 'Wants' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tier === t.key}
                    onClick={() => setTier(t.key)}
                    className={cn(
                      'min-h-[32px] px-2 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                      tier === t.key
                        ? 'bg-[#2c2f3b] text-white border border-white/20'
                        : 'bg-[#1a1c24] text-zinc-300 border border-white/10 hover:text-white'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_REGISTRY[tier].map((item) => {
                  const pct = item.saved ? Math.round((item.saved / item.price) * 100) : 0
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg bg-[#1A1C23] p-2 flex items-center gap-2 border border-white/[0.06]"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-8 h-8 rounded-md object-cover shrink-0 bg-[#252830]"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] font-medium text-white leading-tight">
                          {item.name}
                        </span>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="text-[11px] font-mono text-zinc-300">
                            {cur.symbol}
                            {Math.round(item.price * cur.rate).toLocaleString()}
                          </span>
                          {pct > 0 && (
                            <span className="text-[10px] font-mono text-[#86efac]">
                              {pct}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardShowcase

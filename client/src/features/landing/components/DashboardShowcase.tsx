import React, { useState, useEffect, useId } from 'react'
import {
  Home,
  Layers,
  ArrowLeftRight,
  PiggyBank,
  ClipboardList,
  Search,
  Calendar,
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

const CURRENCY_ORDER: DemoCurrency[] = ['USD', 'EUR', 'SOS']

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
  { id: 'gym', name: 'Gym Membership', date: '5 Nov', amount: 40, icon: 'dumbbell', paid: false },
  { id: 'elec', name: 'Electricity & Water', date: '28 Oct', amount: 95, icon: 'zap', paid: true },
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
      name: 'Thermo Flask',
      price: 35,
      saved: 35,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'brewer',
      name: 'Pour-Over Set',
      price: 55,
      saved: 40,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'pillow',
      name: 'Ergo Pillow',
      price: 70,
      image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=240&auto=format&fit=crop&q=80',
    },
  ],
  future: [
    {
      id: 'monitor',
      name: 'Work Monitor',
      price: 280,
      saved: 210,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'keyboard',
      name: 'Mech Keyboard',
      price: 140,
      saved: 70,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'backpack',
      name: 'Commuter Pack',
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
      name: 'Studio Cans',
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
      name: 'Sunglasses',
      price: 95,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=240&auto=format&fit=crop&q=80',
    },
    {
      id: 'camera',
      name: '35mm Film Cam',
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
    <svg viewBox="0 0 100 50" className="w-[5.2rem] h-[2.6rem] overflow-visible" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`fade-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.25" stopColor={color} stopOpacity="0.85" />
          <stop offset="0.75" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path} stroke={`url(#fade-${id})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={dot[0]} cy={dot[1]} r="5.5" fill={color} opacity="0.3" />
      <circle cx={dot[0]} cy={dot[1]} r="2.6" fill={color} />
      <circle cx={dot[0]} cy={dot[1]} r="1.1" fill="#ffffff" />
    </svg>
  )
}

export const DashboardShowcase: React.FC<{ className?: string }> = ({ className }) => {
  const [currency, setCurrency] = useState<DemoCurrency>('USD')
  const [bills, setBills] = useState<DemoBill[]>(INITIAL_BILLS)
  const [tier, setTier] = useState<DemoTier>('future')
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Animate values from 0 -> target on mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 120)
    return () => clearTimeout(timer)
  }, [])

  // Gentle live demo pulse when not hovered: toggles the $40 Gym bill every 4.5s so visitors see live numbers & bars animate
  useEffect(() => {
    if (isHovered) return
    const interval = setInterval(() => {
      setBills((prev) =>
        prev.map((b) => (b.id === 'gym' ? { ...b, paid: !b.paid } : b))
      )
    }, 4500)
    return () => clearInterval(interval)
  }, [isHovered])

  const cur = CURRENCY_MAP[currency]

  const cycleCurrency = () => {
    const idx = CURRENCY_ORDER.indexOf(currency)
    setCurrency(CURRENCY_ORDER[(idx + 1) % CURRENCY_ORDER.length])
  }

  const toggleBill = (id: string) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)))
  }

  // Coherent, logical monthly math (in USD base)
  const baseMonthlyIncome = 3200
  const baseOtherPaidBills = 90 // Mobile $35 + Cloud/Tools $55 already paid
  const baseDailySpentSoFar = 650

  const unpaidTotal = bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0)
  const paidBillsTotal = bills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0) + baseOtherPaidBills

  // Gross balance adjusts when a bill is marked paid
  const baseGrossBalance = 3200 - paidBillsTotal - baseDailySpentSoFar // $2,465 when Elec($95)+Other($90) paid
  const baseTotalSaved = 750 // Emergency Buffer ($450) + Work Monitor ($210) + Winter Travel ($90)
  const baseNetSpendable = baseGrossBalance - baseTotalSaved // $1,715

  const baseTotalExpenses = paidBillsTotal + unpaidTotal + baseDailySpentSoFar // $1,490
  const baseMonthlyLimit = 2450
  const usedLimitPct = mounted ? Math.min(100, Math.round((baseTotalExpenses / baseMonthlyLimit) * 100)) : 0

  // Converted values
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'w-full rounded-[1.5rem] bg-[#111215] text-white border border-stone-300/90 shadow-[0_28px_70px_-15px_rgba(28,25,23,0.32)] overflow-hidden flex select-none font-sans',
        className
      )}
    >
      {/* ================= LEFT SIDEBAR (Matches Real App) ================= */}
      <aside className="hidden lg:flex w-[12.5rem] shrink-0 flex-col justify-between pl-4 pr-3.5 pt-5 pb-4 border-r border-white/[0.04]">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-2.5 h-7 pl-1">
            <div className="w-6 h-6 rounded-md bg-white/10 border border-white/15 flex items-center justify-center font-serif text-xs font-semibold text-white">
              د
            </div>
            <span className="text-[1.05rem] leading-none font-semibold tracking-tight text-white">
              Dakhli
            </span>
          </div>

          {/* Search */}
          <div className="mt-5 relative flex items-center h-8 rounded-[0.65rem] bg-[#1b1b1b] px-2.5 gap-2">
            <Search className="w-3.5 h-3.5 text-[#6f6f6f]" />
            <span className="text-[0.75rem] text-[#777]">Search</span>
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex flex-col gap-1">
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
                    'flex items-center gap-2.5 h-8 px-2.5 rounded-[0.55rem] text-[0.76rem] transition-colors',
                    nav.active
                      ? 'bg-[#1f1f1f] text-white font-medium shadow-xs'
                      : 'text-[#a8a8a8]'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{nav.name}</span>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Bottom User Profile */}
        <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[#16171C] border border-white/[0.05]">
          <div className="w-7 h-7 rounded-full bg-[#22242D] flex items-center justify-center text-[#9ca3af] shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.74rem] font-medium text-white leading-tight truncate">
              Omar K.
            </p>
            <p className="text-[0.64rem] text-[#70727a] leading-tight truncate">
              Payday: 25th
            </p>
          </div>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD WORKSPACE ================= */}
      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col gap-3.5">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white leading-none">
              Hello, Omar!
            </h2>
            <p className="text-[0.68rem] text-[#8d8d8d] mt-1 font-mono">
              Cycle: 25 Oct – 24 Nov • 16 days remaining
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleCurrency}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#1E2028] hover:bg-[#272A35] border border-white/10 text-[0.72rem] font-mono text-white transition-all active:scale-95 cursor-pointer"
              title="Click to switch currency"
            >
              <span className="text-[#E5A855] font-semibold">{cur.code}</span>
              <span className="text-white/50">↻</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#212121] text-[0.72rem] font-medium text-white">
              <Calendar className="w-3.5 h-3.5 text-[#cfcfcf]" />
              <span>November 2026</span>
            </div>
          </div>
        </div>

        {/* Dashboard 2-Column Grid */}
        <div className="grid gap-3 lg:grid-cols-[477fr_236fr] items-stretch">
          {/* LEFT AREA */}
          <div className="flex flex-col gap-3">
            {/* TOP ROW: Liquidity Summary + Overhead Bills */}
            <div className="grid gap-3 sm:grid-cols-[251fr_214fr] items-stretch">
              {/* 1. Liquidity Summary Card */}
              <div className="rounded-[1.15rem] bg-[#17181D] p-4 flex flex-col justify-between gap-3.5 border border-white/[0.04]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.74rem] text-white/90">Liquidity Summary</span>
                    <button
                      type="button"
                      onClick={cycleCurrency}
                      className="px-2 py-0.5 rounded-md bg-[#22242D] hover:bg-[#2B2E3A] border border-white/[0.08] text-[0.65rem] font-mono text-[#E5A855] font-semibold cursor-pointer transition-colors"
                    >
                      {cur.code}
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-1 font-mono tabular-nums">
                    <span className="text-xs text-[#8d8d8d]">{cur.symbol}</span>
                    <span className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-white">
                      <AnimatedNumber value={grossVal} formatOptions={numFormat} />
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.68rem] text-[#979797]">
                    Gross Balance (After Paid Bills)
                  </p>
                </div>

                {/* Total Saved & Net Spendable */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/[0.05]">
                  <div>
                    <div className="text-[0.88rem] font-mono font-medium text-white tabular-nums flex items-center gap-0.5">
                      <span>{cur.symbol}</span>
                      <AnimatedNumber value={savedVal} formatOptions={numFormat} />
                    </div>
                    <p className="text-[0.66rem] text-[#979797]">Total Saved</p>
                  </div>
                  <div>
                    <div className="text-[0.88rem] font-mono font-semibold text-[#aee69a] tabular-nums flex items-center gap-0.5">
                      <span>{cur.symbol}</span>
                      <AnimatedNumber value={netVal} formatOptions={numFormat} />
                    </div>
                    <p className="text-[0.66rem] text-[#979797]">Net Spendable</p>
                  </div>
                </div>

                {/* Active Daily Cap Pill */}
                <div className="border-gradient-highlight rounded-[0.8rem] px-3 py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="block text-[0.72rem] font-medium text-[#aee69a] leading-tight">
                      Active • Daily Cap On Track
                    </span>
                    <p className="text-[0.63rem] text-[#b0b0b0] font-mono truncate mt-0.5">
                      Today: {cur.symbol}
                      {Math.round(18.5 * cur.rate).toLocaleString()} / {cur.symbol}
                      {Math.round(45 * cur.rate).toLocaleString()} cap
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse shrink-0" />
                </div>
              </div>

              {/* 2. Overhead Bills Card */}
              <div className="rounded-[1.15rem] bg-overhead-warm p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.74rem] text-white/95 font-medium">Overhead Bills</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <p className="mt-2 text-[0.74rem] text-white/90">This Cycle</p>

                  <div className="mt-1.5 flex items-start gap-5 font-mono tabular-nums">
                    <div>
                      <div className="text-[1.15rem] leading-tight font-semibold text-white">
                        <AnimatedNumber value={unpaidVal} prefix={cur.symbol} formatOptions={numFormat} />
                      </div>
                      <p className="text-[0.65rem] text-white/75 font-sans">Unpaid</p>
                    </div>
                    <div>
                      <div className="text-[1.15rem] leading-tight font-semibold text-white">
                        <AnimatedNumber value={paidVal} prefix={cur.symbol} formatOptions={numFormat} />
                      </div>
                      <p className="text-[0.65rem] text-white/75 font-sans">Paid</p>
                    </div>
                  </div>
                </div>

                {/* Frosted Quick Items */}
                <div className="bg-quick-items-frosted rounded-[0.8rem] px-3 py-2.5">
                  <h4 className="text-[0.72rem] font-medium text-[#1c1c1c]">Fixed Monthly</h4>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    <li className="flex items-center justify-between text-[0.7rem] text-[#1c1c1c]">
                      <span className="flex items-center gap-1.5">
                        <Home className="w-3 h-3" strokeWidth={1.8} />
                        Apartment Rent
                      </span>
                      <span className="font-mono font-medium">{cur.symbol}{Math.round(550 * cur.rate).toLocaleString()}</span>
                    </li>
                    <li className="flex items-center justify-between text-[0.7rem] text-[#1c1c1c]">
                      <span className="flex items-center gap-1.5">
                        <Wifi className="w-3 h-3" strokeWidth={1.8} />
                        Fiber Internet
                      </span>
                      <span className="font-mono font-medium">{cur.symbol}{Math.round(65 * cur.rate).toLocaleString()}</span>
                    </li>
                    <li className="flex items-center justify-between text-[0.7rem] text-[#1c1c1c]">
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="w-3 h-3" strokeWidth={1.8} />
                        Gym Membership
                      </span>
                      <span className="font-mono font-medium">{cur.symbol}{Math.round(40 * cur.rate).toLocaleString()}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Saving Plan + Cash Flow */}
            <div className="grid gap-3 sm:grid-cols-[197fr_267fr] items-stretch">
              {/* 3. Saving Plan Card */}
              <div className="rounded-[1.15rem] bg-[#17181D] p-4 flex flex-col justify-between gap-3 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-[0.76rem] text-white font-medium">Saving Plans</span>
                  <span className="text-[0.65rem] font-mono text-[#8d8d8d]">
                    {cur.symbol}{Math.round(750 * cur.rate).toLocaleString()} locked
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-2.5">
                  {savePlans.map((plan, idx) => (
                    <React.Fragment key={plan.id}>
                      {idx > 0 && <div className="h-px bg-white/[0.05]" />}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[0.75rem] font-medium text-white truncate">
                            {plan.name}
                          </span>
                          <span className="text-[0.66rem] font-mono text-[#8d8d8d]">
                            {plan.pct}%
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <SegmentedTicks percentage={plan.pct} tickHeight="1.9rem" />
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* 4. Cash Flow Card */}
              <div className="rounded-[1.15rem] bg-[#17181D] p-4 flex flex-col justify-between gap-3 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[0.88rem] font-medium text-white">Cash Flow</h3>
                  <div className="flex items-center gap-1 h-1.5">
                    <span className="block w-5 h-full rounded-full bg-gradient-to-r from-[#A7F3D0] to-[#67E8F9]" />
                    <span className="block w-4 h-full rounded-full bg-[#2C2E38]" />
                  </div>
                </div>

                {/* Income & Expenses with Net Pill */}
                <div className="relative flex flex-col gap-1.5">
                  <div className="h-[3.6rem] rounded-xl bg-[#1E2028] px-3.5 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-[0.68rem] text-[#8E92A0]">Monthly Income</p>
                      <p className="mt-0.5 text-[1.1rem] font-mono font-semibold text-white tabular-nums">
                        <AnimatedNumber value={incomeVal} prefix={cur.symbol} formatOptions={intFormat} />
                      </p>
                    </div>
                    <SparklineSvg
                      path="M 0,38 C 12,38 18,44 26,42 C 34,40 38,12 48,8 C 55,5 57,20 63,20 C 69,20 73,15 80,18 C 88,22 93,36 100,40"
                      color="#4ADE80"
                      dot={[60, 20]}
                    />
                  </div>

                  <div className="h-[3.6rem] rounded-xl bg-[#1E2028] px-3.5 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-[0.68rem] text-[#8E92A0]">Committed + Spent</p>
                      <p className="mt-0.5 text-[1.1rem] font-mono font-semibold text-white tabular-nums">
                        <AnimatedNumber value={expensesVal} prefix={cur.symbol} formatOptions={intFormat} />
                      </p>
                    </div>
                    <SparklineSvg
                      path="M 0,30 C 8,30 14,22 24,20 C 34,18 38,36 48,38 C 58,40 64,18 74,18 C 84,18 88,38 100,32"
                      color="#F87171"
                      dot={[74, 18]}
                    />
                  </div>

                  {/* Floating Net Pill */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-6 px-2.5 rounded-full bg-white text-[#15161A] text-[0.68rem] font-mono font-bold flex items-center justify-center shadow-md tabular-nums">
                    +{cur.symbol}
                    <AnimatedNumber value={cashFlowNetVal} formatOptions={intFormat} />
                  </div>
                </div>

                {/* Expenses Limit Bar */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.72rem] text-[#8E92A0]">Cycle Spend Limit</span>
                    <span className="text-[1rem] font-mono font-semibold text-white tabular-nums">
                      <AnimatedNumber value={limitVal} prefix={cur.symbol} formatOptions={intFormat} />
                    </span>
                  </div>
                  <div className="relative mt-1.5 w-full h-7">
                    <div className="absolute inset-0 rounded-xl overflow-hidden bg-limit-hatch" />
                    <div
                      className="relative h-full rounded-xl bg-expenses-neon transition-all duration-700 ease-out"
                      style={{ width: `${usedLimitPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Upcoming Overhead + Item Registry */}
          <div className="flex flex-col gap-3">
            {/* 5. Upcoming Overhead (Interactive Click-to-Pay) */}
            <div className="rounded-[1.15rem] bg-[#17181D] p-4 flex flex-col justify-between gap-2.5 border border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-[0.78rem] text-white font-medium">Upcoming Overhead</span>
                <span className="text-[0.62rem] font-mono text-[#E5A855]">Click bill to toggle</span>
              </div>

              <ul className="mt-1 flex flex-col gap-2.5">
                {bills.map((bill) => {
                  const Icon = BILL_ICONS[bill.icon]
                  return (
                    <li
                      key={bill.id}
                      onClick={() => toggleBill(bill.id)}
                      className="flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <span className="w-7 h-7 shrink-0 rounded-lg bg-[#222530] flex items-center justify-center text-[#c9c9c9]">
                        <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.76rem] font-medium text-white truncate leading-tight">
                          {bill.name}
                        </p>
                        <p className="text-[0.62rem] text-[#8d8d8d] leading-tight mt-0.5">
                          Due {bill.date}
                        </p>
                      </div>
                      {bill.paid ? (
                        <span className="w-5 h-5 rounded-full bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/40 flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={2.8} />
                        </span>
                      ) : (
                        <span className="text-[0.8rem] font-mono font-semibold text-white tabular-nums">
                          {cur.symbol}
                          {Math.round(bill.amount * cur.rate).toLocaleString()}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* 6. 3-Tier Item Registry */}
            <div className="rounded-[1.15rem] bg-[#17181D] p-4 flex flex-col justify-between gap-2.5 flex-1 border border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-[0.78rem] text-white font-medium">Item Registry</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/40" />
              </div>

              {/* Tier Tabs */}
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { key: 'essentials', label: 'Essentials' },
                    { key: 'future', label: 'Future Needs' },
                    { key: 'wants', label: 'Wants' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTier(t.key)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[0.66rem] font-medium transition-colors cursor-pointer',
                      tier === t.key
                        ? 'bg-[#303030] text-white'
                        : 'text-[#a0a0a0] border border-white/10 hover:text-white'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 4 Registry Item Tiles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {DEMO_REGISTRY[tier].map((item) => {
                  const pct = item.saved ? Math.round((item.saved / item.price) * 100) : 0
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#1E2028] p-2 flex items-center gap-2 border border-white/[0.04]"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[#252830]"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.68rem] font-medium text-white truncate leading-tight">
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[0.62rem] font-mono text-[#9ca3af]">
                            {cur.symbol}
                            {Math.round(item.price * cur.rate).toLocaleString()}
                          </span>
                          {pct > 0 && (
                            <span className="text-[0.58rem] font-mono text-[#aee69a]">
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

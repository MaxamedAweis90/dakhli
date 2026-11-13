import React, { useState } from 'react'

interface Pillar {
  id: string
  index: string
  title: string
  description: string
  formula: string
  summaryMetric: string
  summaryValue: string
  visual: React.ReactNode
}

const PILLARS: Pillar[] = [
  {
    id: 'vault',
    index: '01 / LIQUIDITY',
    title: 'Liquidity reserve vault',
    description:
      'Lock rent, tax reserves, and recurring obligations out of daily view so only uncommitted cash stays visible.',
    formula: 'Net Spendable = Gross Balance - Active Reserves - Due Bills',
    summaryMetric: 'Protected from daily spend',
    summaryValue: '78% Locked · 22% Free',
    visual: (
      <svg viewBox="0 0 420 120" className="w-full h-28" role="img" aria-label="Committed reserves separated from net spendable liquidity">
        <rect x="0" y="16" width="150" height="44" rx="8" fill="#b91c1c" />
        <rect x="160" y="16" width="128" height="44" rx="8" fill="#047857" />
        <rect x="298" y="16" width="122" height="44" rx="8" fill="#fafaf9" />
        <text x="14" y="43" fill="#ffffff" fontSize="13" fontFamily="monospace">Overheads</text>
        <text x="174" y="43" fill="#ffffff" fontSize="13" fontFamily="monospace">Reserves</text>
        <text x="312" y="43" fill="#1c1917" fontSize="13" fontFamily="monospace">Spendable</text>
        <rect x="0" y="84" width="420" height="10" rx="5" fill="#27272a" />
        <rect x="0" y="84" width="278" height="10" rx="5" fill="#047857" />
      </svg>
    ),
  },
  {
    id: 'cycles',
    index: '02 / CADENCE',
    title: 'Payday ledger cycles',
    description:
      'Start every budget window on your actual payday date instead of splitting paychecks across calendar months.',
    formula: 'Cycle = Payday Anchor -> Days Remaining -> Next Allocation',
    summaryMetric: 'Zero calendar-edge drift',
    summaryValue: '25 Oct -> 24 Nov Anchor',
    visual: (
      <svg viewBox="0 0 420 120" className="w-full h-28" role="img" aria-label="Payday-to-payday cycle timeline">
        <line x1="20" y1="54" x2="400" y2="54" stroke="#3f3f46" strokeWidth="4" strokeLinecap="round" />
        <line x1="20" y1="54" x2="265" y2="54" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
        <circle cx="20" cy="54" r="9" fill="#4ade80" />
        <circle cx="265" cy="54" r="9" fill="#fafaf9" />
        <circle cx="400" cy="54" r="9" fill="#52525b" />
        <text x="20" y="28" fill="#a1a1aa" fontSize="12" fontFamily="monospace">Payday Start</text>
        <text x="225" y="28" fill="#ffffff" fontSize="12" fontFamily="monospace">Today · Day 15</text>
        <text x="336" y="88" fill="#a1a1aa" fontSize="12" fontFamily="monospace">Next Cycle</text>
      </svg>
    ),
  },
  {
    id: 'caps',
    index: '03 / BOUNDARIES',
    title: 'Daily spending cap engine',
    description:
      'Assign separate weekday and weekend limits and automatically carry unspent end-of-day surplus into savings.',
    formula: 'Weekday Cap 35/day · Weekend Cap 60/day · EOD Surplus Rolled',
    summaryMetric: 'Deterministic daily bounds',
    summaryValue: 'Mon–Fri 35 · Sat–Sun 60',
    visual: (
      <svg viewBox="0 0 420 120" className="w-full h-28" role="img" aria-label="Weekday and weekend daily spending cap bars">
        {[58, 72, 50, 64, 46, 94, 86].map((h, idx) => (
          <g key={idx}>
            <rect
              x={idx * 58 + 12}
              y={100 - h}
              width="38"
              height={h}
              rx="6"
              fill={idx >= 5 ? '#4ade80' : '#fafaf9'}
            />
            <text
              x={idx * 58 + 24}
              y="116"
              fill="#a1a1aa"
              fontSize="11"
              fontFamily="monospace"
            >
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
            </text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'registry',
    index: '04 / REGISTRY',
    title: 'Three-tier item registry',
    description:
      'Stage upcoming purchases inside Essentials, Planned, and Wants goals so big gear never shocks daily cash.',
    formula: 'Tiered Goal -> Funded 100% -> Purchased Without Liquidity Shock',
    summaryMetric: 'Priority-funded purchases',
    summaryValue: '9 / 12 Ticks Funded (75%)',
    visual: (
      <svg viewBox="0 0 420 120" className="w-full h-28" role="img" aria-label="Segmented saving progress ticks for staged registry items">
        {Array.from({ length: 12 }).map((_, idx) => (
          <rect
            key={idx}
            x={idx * 34 + 6}
            y="24"
            width="24"
            height="62"
            rx="5"
            fill={idx < 9 ? '#4ade80' : '#27272a'}
          />
        ))}
        <text x="6" y="108" fill="#d4d4d8" fontSize="12" fontFamily="monospace">
          Work Monitor · 210 / 280 funded before purchase
        </text>
      </svg>
    ),
  },
]

export const PillarsSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(PILLARS[0].id)
  const active = PILLARS.find((p) => p.id === selectedId) ?? PILLARS[0]

  return (
    <section id="pillars" className="landing-section bg-[#FAFAF9]">
      <div className="wrap">
        <div className="max-w-2xl mb-6 sm:mb-8">
          <span className="block font-mono text-[13px] font-medium text-stone-600 mb-2">
            Core Mechanics
          </span>
          <h2 className="font-serif text-3xl sm:text-[40px] leading-[1.12] font-normal tracking-tight text-stone-900">
            Dakhli cash flow mechanics
          </h2>
          <p className="font-sans text-base text-stone-700 mt-2.5 leading-relaxed">
            Four deterministic modules separate fixed bills from daily pocket cash.
          </p>
        </div>

        {/* Interactive k=5 Split (5 cols module tabs / 7 cols live mechanic preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div
            role="tablist"
            aria-label="Dakhli core mechanics"
            className="lg:col-span-5 flex flex-col justify-between gap-2.5"
          >
            {PILLARS.map((pillar) => {
              const isSelected = pillar.id === active.id
              return (
                <button
                  key={pillar.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(pillar.id)}
                  className={`text-left rounded-xl p-4 transition-colors cursor-pointer min-h-[68px] ${
                    isSelected
                      ? 'bg-stone-900 text-stone-50'
                      : 'bg-white text-stone-900 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span
                    className={`block font-mono text-[11px] uppercase tracking-wider ${
                      isSelected ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    {pillar.index}
                  </span>
                  <span className="block font-sans text-base font-semibold mt-0.5">
                    {pillar.title}
                  </span>
                </button>
              )
            })}
          </div>

          <div
            role="tabpanel"
            data-ui="mechanic-preview"
            className="lg:col-span-7 rounded-2xl bg-[#111215] text-white p-6 sm:p-7 flex flex-col justify-between gap-5 showcase-dark"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="block font-mono text-xs uppercase tracking-wider text-zinc-400">
                  {active.index}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white mt-1">
                  {active.title}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#86efac]">
                {active.summaryValue}
              </span>
            </div>

            <div className="rounded-xl bg-[#17181D] p-4 border border-white/[0.06]">
              {active.visual}
            </div>

            <div className="space-y-2.5">
              <p className="font-sans text-base text-zinc-200 leading-relaxed">
                {active.description}
              </p>
              <span className="block font-mono text-[13px] text-[#E5A855] whitespace-normal break-words">
                {active.formula}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PillarsSection

import React from 'react'

interface Pillar {
  sectionIndex: string
  title: string
  law: string
  summary: string
  detail: string
  formula: string
}

const PILLARS: Pillar[] = [
  {
    sectionIndex: '§ 01 / LIQUIDITY',
    title: 'Liquidity Isolation',
    law: 'Net Spendable ≠ Gross Account Balance',
    summary: 'Never let your bank balance trick your brain into feeling richer than you are.',
    detail:
      'Banking apps show a single total that mixes your rent, emergency buffer, and daily pocket money. Dakhli locks committed reserves out of your sight so you only see what is truly unencumbered today.',
    formula: 'Net Spendable = Gross Balance - Σ(Active Reserve Plans) - Due Overheads',
  },
  {
    sectionIndex: '§ 02 / CADENCE',
    title: 'Payday-Anchored Cycles',
    law: 'Budget Months Align With Cash Inflows',
    summary: 'Your financial month begins when your employer pays you, not on the 1st.',
    detail:
      'Standard budgets break because paychecks land on the 25th or 28th. Dakhli structures spending cycles around your actual payday anchors, preventing in-flight budgets from mutating across calendar edges.',
    formula: 'Cycle: Payday Inflow -> Days Remaining -> Zero-Drift Next Cycle Allocation',
  },
  {
    sectionIndex: '§ 03 / BOUNDARIES',
    title: 'Daily Spending Caps',
    law: 'Deterministic Daily Boundaries with EOD Reconciliation',
    summary: 'Replace vague, abstract monthly limits with a concrete daily cash allowance.',
    detail:
      'Assign distinct daily caps for weekdays versus weekends. At the end of each day, spend under your cap and the surplus rolls forward or logs to daily savings. Spend over, and you face the exact delta.',
    formula: 'Weekday Cap: $35/day | Weekend Cap: $60/day | EOD Under-Cap: Surplus Compounded',
  },
  {
    sectionIndex: '§ 04 / DISCIPLINE',
    title: '3-Tier Synchronized Registry',
    law: 'Essentials • Future Needs • Wants',
    summary: 'Eliminate impulse purchasing by requiring items to be saved for before they exist.',
    detail:
      'Catalog purchases into three deliberate tiers. Items remain zero-impact until actively loaded into a Save Plan. When fully funded, they unlock with zero sudden shock to your daily liquidity.',
    formula: 'Item Status: [In Save Plan] -> Funded: 100% -> Purchased With Zero Net Impact',
  },
]

export const PillarsSection: React.FC = () => {
  return (
    <section id="pillars" className="py-20 border-t border-stone-200 bg-[#FAFAF9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-2">
            Architecture § 02 — The Four Laws
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 text-balance">
            Deterministic cash principles.
            <br />
            Zero black-box algorithms.
          </h2>
          <p className="font-sans text-sm text-stone-600 mt-3 text-pretty leading-relaxed max-w-[60ch]">
            Most budgeting tools give you retroactive pie charts of money you already wasted.
            Dakhli enforces proactive, day-by-day cash discipline before the money leaves your possession.
          </p>
        </div>

        {/* Swiss Continuous Grid */}
        <div className="rounded-2xl border border-stone-200 bg-white grid grid-cols-1 md:grid-cols-2 shadow-xs divide-y md:divide-y-0 md:divide-x divide-stone-200 overflow-hidden">
          {/* Top Row: Law 1 & Law 2 */}
          <div className="flex flex-col justify-between p-6 sm:p-8 border-b md:border-b border-stone-200">
            <div>
              <div className="font-mono text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {PILLARS[0].sectionIndex}
              </div>
              <h3 className="font-serif text-2xl font-normal text-stone-900 tracking-tight mt-2">
                {PILLARS[0].title}
              </h3>
              <p className="font-mono text-xs text-stone-500 mt-0.5">
                {PILLARS[0].law}
              </p>
              <p className="font-sans text-sm font-medium text-stone-800 mt-4 leading-snug">
                {PILLARS[0].summary}
              </p>
              <p className="font-sans text-xs text-stone-600 mt-2 leading-relaxed">
                {PILLARS[0].detail}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 font-mono text-[11px] text-stone-700 truncate">
                <span className="text-stone-400 mr-2">fn:</span>
                {PILLARS[0].formula}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8 border-b md:border-b border-stone-200">
            <div>
              <div className="font-mono text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {PILLARS[1].sectionIndex}
              </div>
              <h3 className="font-serif text-2xl font-normal text-stone-900 tracking-tight mt-2">
                {PILLARS[1].title}
              </h3>
              <p className="font-mono text-xs text-stone-500 mt-0.5">
                {PILLARS[1].law}
              </p>
              <p className="font-sans text-sm font-medium text-stone-800 mt-4 leading-snug">
                {PILLARS[1].summary}
              </p>
              <p className="font-sans text-xs text-stone-600 mt-2 leading-relaxed">
                {PILLARS[1].detail}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 font-mono text-[11px] text-stone-700 truncate">
                <span className="text-stone-400 mr-2">fn:</span>
                {PILLARS[1].formula}
              </div>
            </div>
          </div>

          {/* Bottom Row: Law 3 & Law 4 */}
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="font-mono text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {PILLARS[2].sectionIndex}
              </div>
              <h3 className="font-serif text-2xl font-normal text-stone-900 tracking-tight mt-2">
                {PILLARS[2].title}
              </h3>
              <p className="font-mono text-xs text-stone-500 mt-0.5">
                {PILLARS[2].law}
              </p>
              <p className="font-sans text-sm font-medium text-stone-800 mt-4 leading-snug">
                {PILLARS[2].summary}
              </p>
              <p className="font-sans text-xs text-stone-600 mt-2 leading-relaxed">
                {PILLARS[2].detail}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 font-mono text-[11px] text-stone-700 truncate">
                <span className="text-stone-400 mr-2">fn:</span>
                {PILLARS[2].formula}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="font-mono text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {PILLARS[3].sectionIndex}
              </div>
              <h3 className="font-serif text-2xl font-normal text-stone-900 tracking-tight mt-2">
                {PILLARS[3].title}
              </h3>
              <p className="font-mono text-xs text-stone-500 mt-0.5">
                {PILLARS[3].law}
              </p>
              <p className="font-sans text-sm font-medium text-stone-800 mt-4 leading-snug">
                {PILLARS[3].summary}
              </p>
              <p className="font-sans text-xs text-stone-600 mt-2 leading-relaxed">
                {PILLARS[3].detail}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 font-mono text-[11px] text-stone-700 truncate">
                <span className="text-stone-400 mr-2">fn:</span>
                {PILLARS[3].formula}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PillarsSection

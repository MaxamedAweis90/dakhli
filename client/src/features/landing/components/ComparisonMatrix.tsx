import React from 'react'
import { Check, X } from 'lucide-react'

interface ComparisonRow {
  feature: string
  conventional: string
  dakhli: string
}

const CRITERIA: ComparisonRow[] = [
  {
    feature: 'Bank logins',
    conventional: 'Requires Plaid or Yodlee credentials',
    dakhli: 'Zero bank logins or passwords required',
  },
  {
    feature: 'Posting speed',
    conventional: '24 to 72 hour pending bank delays',
    dakhli: 'Instant deduction from daily balance',
  },
  {
    feature: 'Balance clarity',
    conventional: 'Gross balance mixes rent and spare cash',
    dakhli: 'Isolates Net Spendable liquidity only',
  },
  {
    feature: 'Budget cycle',
    conventional: 'Fixed calendar 1st-to-31st month window',
    dakhli: 'Anchored to your payday schedule',
  },
  {
    feature: 'Business model',
    conventional: 'Affiliate credit cards and sponsored loans',
    dakhli: 'Zero ads and zero financial tracking',
  },
]

export const ComparisonMatrix: React.FC = () => {
  return (
    <section id="comparison" className="landing-section bg-white">
      <div className="wrap">
        <div className="max-w-2xl mb-6">
          <span className="block font-mono text-[13px] font-medium text-stone-600 mb-2">
            Comparison
          </span>
          <h2 className="font-serif text-3xl sm:text-[40px] leading-[1.12] font-normal tracking-tight text-stone-900">
            Dakhli manual ledger comparison
          </h2>
          <p className="font-sans text-base text-stone-700 mt-2.5 leading-relaxed">
            How deterministic cash control compares to bank-scraping personal finance trackers.
          </p>
        </div>

        {/* Visual Clearing-Delay Comparison Panel (~136px visual diagram) */}
        <div
          data-ui="latency-diagram"
          className="rounded-2xl border border-stone-200 bg-stone-50 p-5 mb-6"
        >
          <svg
            viewBox="0 0 880 108"
            className="w-full h-24 sm:h-28"
            role="img"
            aria-label="Clearing delay comparison showing 24 to 72 hour pending holds in bank apps versus 0 millisecond balance updates in Dakhli"
          >
            <text x="0" y="18" fill="#57534e" fontSize="13" fontFamily="monospace">
              BANK-SYNCED TRACKER · 24H TO 72H PENDING HOLD BEFORE UPDATE
            </text>
            <rect x="0" y="28" width="880" height="18" rx="9" fill="#e7e5e4" />
            <rect x="0" y="28" width="590" height="18" rx="9" fill="#be123c" />
            <circle cx="590" cy="37" r="7" fill="#ffffff" stroke="#be123c" strokeWidth="3" />

            <text x="0" y="72" fill="#065f46" fontSize="13" fontFamily="monospace">
              DAKHLI LEDGER · 0MS IMMEDIATE NET DEDUCTION
            </text>
            <rect x="0" y="82" width="880" height="18" rx="9" fill="#e7e5e4" />
            <rect x="0" y="82" width="880" height="18" rx="9" fill="#047857" />
          </svg>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden md:block rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50">
                <th className="py-3.5 px-6 font-mono text-xs uppercase tracking-wider text-stone-700 font-medium w-[24%]">
                  Capability
                </th>
                <th className="py-3.5 px-6 font-mono text-xs uppercase tracking-wider text-stone-700 font-medium w-[38%]">
                  Conventional Tracker
                </th>
                <th className="py-3.5 px-6 font-mono text-xs uppercase tracking-wider text-stone-900 font-semibold bg-emerald-50/70 w-[38%]">
                  Dakhli Ledger
                </th>
              </tr>
            </thead>
            <tbody className="font-sans text-base">
              {CRITERIA.map((item, index) => (
                <tr
                  key={item.feature}
                  className={index % 2 === 1 ? 'bg-stone-50/50' : 'bg-white'}
                >
                  <td className="py-3.5 px-6 font-semibold text-stone-900">
                    {item.feature}
                  </td>
                  <td className="py-3.5 px-6 text-stone-700">
                    <span className="inline-flex items-center gap-2">
                      <X className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
                      <span>{item.conventional}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-stone-900 bg-emerald-50/40">
                    <span className="inline-flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      <span>{item.dakhli}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Clean Ledger Table (flush-left text, zero bordered text-only card shells) */}
        <div className="md:hidden space-y-5 font-sans">
          {CRITERIA.map((item) => (
            <div key={item.feature} className="space-y-1.5">
              <h3 className="text-lg font-semibold text-stone-900">{item.feature}</h3>
              <p className="text-base text-stone-700">
                <span className="font-mono text-xs uppercase tracking-wider text-rose-700 mr-2">
                  Others:
                </span>
                {item.conventional}
              </p>
              <p className="text-base font-medium text-emerald-900">
                <span className="font-mono text-xs uppercase tracking-wider text-emerald-800 mr-2">
                  Dakhli:
                </span>
                {item.dakhli}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ComparisonMatrix

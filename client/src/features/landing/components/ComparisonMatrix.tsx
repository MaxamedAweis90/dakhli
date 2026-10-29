import React from 'react'
import { Check, X, ShieldCheck } from 'lucide-react'

export const ComparisonMatrix: React.FC = () => {
  const criteria = [
    {
      feature: 'Bank Credential Requirement',
      conventional: 'Required (Plaid/Yodlee scraping your bank credentials)',
      dakhli: 'Zero (No bank logins or passwords ever requested)',
      note: 'Your financial data stays strictly on your device and in your database.',
    },
    {
      feature: 'Psychological Awareness',
      conventional: 'Passive (you look at transactions 5 days later)',
      dakhli: 'Deliberate & Proactive (log expenses when they occur)',
      note: 'The deliberate act of recording cash changes spending behavior in real-time.',
    },
    {
      feature: 'Transaction Latency',
      conventional: '24 to 72 hour bank clearing delays',
      dakhli: 'Instant real-time liquidity deduction',
      note: 'No unexpected "pending" charges ruining your weekend balance.',
    },
    {
      feature: 'Balance Reality',
      conventional: 'Shows gross bank balance (includes locked funds)',
      dakhli: 'Calculates Net Spendable liquidity only',
      note: 'Stops you from accidentally spending money set aside for rent and taxes.',
    },
    {
      feature: 'Cadence & Cycles',
      conventional: 'Rigid 1st-to-31st calendar month',
      dakhli: 'Anchored to your actual payday schedule',
      note: 'Aligns budget cycles with when money actually enters your hands.',
    },
    {
      feature: 'Commercial Incentives',
      conventional: 'Full of credit card affiliate ads and sponsored loans',
      dakhli: 'Zero ads, zero affiliate links, zero financial surveillance',
      note: 'Built purely as a functional personal money engine.',
    },
  ]

  return (
    <section id="comparison" className="py-20 border-t border-stone-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-12">
          <div className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-2">
            Audit § 03 — The Anti-Surveillance Model
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 text-balance">
            Why manual discipline beats "automatic" bank scraping.
          </h2>
          <p className="font-sans text-sm text-stone-600 mt-3 text-pretty leading-relaxed max-w-[60ch]">
            Automatic bank tracking sounds convenient until credentials break, transactions arrive
            three days late, and a post-mortem pie chart informs you that you overspent last week.
          </p>
        </div>

        {/* Ledger Table */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-mono text-stone-600">
                  <th className="py-4 px-6 font-semibold w-1/3">Capability</th>
                  <th className="py-4 px-6 font-semibold w-1/3 text-stone-500">
                    Conventional "Smart" Apps
                  </th>
                  <th className="py-4 px-6 font-semibold w-1/3 text-stone-900">
                    Dakhli Engine
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
                {criteria.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 px-6 font-sans font-medium text-stone-900">
                      <div>{item.feature}</div>
                      <div className="text-[11px] font-mono text-stone-400 font-normal mt-0.5">
                        {item.note}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-stone-600 font-sans">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{item.conventional}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-stone-900 font-sans font-medium bg-stone-50/40">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-stone-900 flex-shrink-0 mt-0.5 font-bold" />
                        <span>{item.dakhli}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quiet Assurance Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed: Dakhli has no access to your bank accounts, cards, or personal credit.</span>
          </div>
          <div className="text-xs font-mono text-stone-500">
            Private by design. Deterministic by code.
          </div>
        </div>
      </div>
    </section>
  )
}

export default ComparisonMatrix

import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export const ManifestoSection: React.FC = () => {
  return (
    <section id="manifesto" className="py-24 border-t border-stone-200 bg-[#FAFAF9]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-4">
          Manifesto § 04 — The Discipline Engine
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-normal text-stone-900 tracking-tight text-balance leading-tight">
          Stop waiting for an app to magically save your money.
          <br className="hidden sm:inline" />
          <span> Take command of the numbers yourself.</span>
        </h2>

        <p className="font-sans text-sm sm:text-base text-stone-600 mt-6 max-w-2xl mx-auto leading-relaxed text-pretty">
          Dakhli isn't built to sell you loans, bombard you with affiliate credit cards, or flatter you with
          retroactive charts. It exists to give you absolute mathematical clarity on your spendable cash, every single day.
        </p>

        {/* Action Card */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl border border-stone-200 bg-white text-left max-w-xl mx-auto shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-mono text-stone-500 pb-3 border-b border-stone-100">
              <span>INITIALIZE YOUR INSTANCE</span>
              <span className="text-emerald-700 font-semibold">● READY</span>
            </div>

            <p className="font-sans text-xs text-stone-600 leading-relaxed">
              No credit card. No bank login. No third-party tracking scripts.
              Set your payday anchor, declare your fixed overheads, and see your true spendable liquidity today.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/register"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-stone-900 hover:bg-stone-800 text-stone-50 transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Launch Dakhli Free</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-mono text-stone-700 hover:text-stone-900 hover:bg-stone-50 border border-stone-200 transition-all active:scale-[0.98]"
              >
                Existing User
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ManifestoSection

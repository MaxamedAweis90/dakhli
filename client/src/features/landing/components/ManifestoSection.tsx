import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const SETUP_STEPS = [
  {
    step: '01',
    title: 'Set payday anchor & currency',
    description: 'Choose USD, EUR, or SOS and match budget cycles to your actual pay dates.',
  },
  {
    step: '02',
    title: 'Lock fixed bills & reserves',
    description: 'Isolate rent, recurring overheads, and savings goals before setting pocket cash.',
  },
  {
    step: '03',
    title: 'Spend against your daily cap',
    description: 'Log manual expenses in seconds and roll any unspent end-of-day surplus forward.',
  },
]

export const ManifestoSection: React.FC = () => {
  return (
    <section id="manifesto" className="landing-section bg-[#FAFAF9]">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Closing Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6">
            <div>
              <span className="block font-mono text-[13px] font-medium text-stone-600 mb-2">
                Get Started
              </span>
              <h2 className="font-serif text-3xl sm:text-[40px] leading-[1.12] font-normal text-stone-900 tracking-tight">
                Start tracking with Dakhli
              </h2>
              <p className="font-sans text-base text-stone-700 mt-4 max-w-xl leading-relaxed">
                Manage monthly cash flow without bank scraping or affiliate ads. Set your payday anchor,
                lock fixed reserves, and check your daily allowance in seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link to="/register" className="landing-btn-primary">
                <span>Start free account</span>
                <ArrowRight className="w-4 h-4 btn-arrow shrink-0" aria-hidden="true" />
              </Link>
              <Link to="/login" className="landing-btn-secondary">
                Sign in
              </Link>
            </div>
          </div>

          {/* Right Column: Three-Step Setup Card */}
          <div className="lg:col-span-6 rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-stone-600 pb-4 border-b border-stone-200">
              <span>THREE-STEP WORKSPACE SETUP</span>
              <span className="text-emerald-800 font-semibold">$0 / MO FREE</span>
            </div>

            <ol className="flex flex-col gap-4">
              {SETUP_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="flex items-start gap-3.5 rounded-xl bg-stone-50 border border-stone-200/80 p-3.5"
                >
                  <span className="shrink-0 w-7 h-7 rounded-md bg-stone-900 text-stone-50 font-mono text-xs font-semibold flex items-center justify-center">
                    {item.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans text-sm sm:text-[15px] font-semibold text-stone-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-sans text-sm text-stone-700 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ManifestoSection

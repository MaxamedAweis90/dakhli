import React from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export const LandingFooter: React.FC = () => {
  return (
    <footer className="closing landing-footer bg-white text-stone-700 font-sans py-12 sm:py-16">
      <div className="wrap">
        {/* Top Multi-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-stone-200 items-start">
          {/* Col 1: Brand Lockup & Privacy Summary */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 min-h-[44px] whitespace-nowrap shrink-0 group"
            >
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-lg bg-stone-900 text-stone-50 font-serif text-base font-semibold flex items-center justify-center group-hover:bg-stone-800 transition-colors"
              >
                د
              </span>
              <span className="font-sans text-[17px] font-semibold tracking-tight text-stone-900">
                Dakhli
              </span>
              <span className="h-3.5 w-px bg-stone-300" aria-hidden="true" />
              <span className="font-serif text-sm text-stone-600">دخلي</span>
            </Link>

            <p className="text-sm text-stone-600 leading-relaxed max-w-sm">
              Privacy-first personal finance software engineered for deterministic daily cash control.
              No bank scraping, no affiliate ads.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700">
              <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Zero Bank APIs</span>
            </div>
          </div>

          {/* Col 2: Product Links */}
          <div className="md:col-span-4">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-600 mb-3">
              Product
            </p>
            <nav aria-label="Product navigation" className="flex flex-col items-start">
              <a
                href="#top"
                className="min-h-[40px] inline-flex items-center text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Overview
              </a>
              <a
                href="#simulator"
                className="min-h-[40px] inline-flex items-center text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Spendable Calculator
              </a>
              <a
                href="#pillars"
                className="min-h-[40px] inline-flex items-center text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Core Mechanics
              </a>
              <a
                href="#comparison"
                className="min-h-[40px] inline-flex items-center text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Ledger Comparison
              </a>
            </nav>
          </div>

          {/* Col 3: Account Links */}
          <div className="md:col-span-3">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-600 mb-3">
              Account
            </p>
            <nav aria-label="Account navigation" className="flex flex-col items-start">
              <Link
                to="/register"
                className="min-h-[40px] inline-flex items-center text-sm font-semibold text-stone-900 hover:text-stone-700 transition-colors"
              >
                Start free account
              </Link>
              <Link
                to="/login"
                className="min-h-[40px] inline-flex items-center text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Sign in
              </Link>
              <a
                href="#manifesto"
                className="min-h-[40px] inline-flex items-center text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                Get Started
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] font-mono text-stone-600">
          <span>&copy; 2026 Dakhli. Built for deterministic cash control.</span>
          <span>USD · EUR · SOS · Payday-Anchored Ledger</span>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter

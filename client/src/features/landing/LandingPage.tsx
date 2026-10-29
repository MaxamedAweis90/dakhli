import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, EyeOff, ShieldCheck, Calculator } from 'lucide-react'
import LandingNav from './components/LandingNav'
import DashboardShowcase from './components/DashboardShowcase'
import RealityCheckSimulator from './components/RealityCheckSimulator'
import PillarsSection from './components/PillarsSection'
import ComparisonMatrix from './components/ComparisonMatrix'
import ManifestoSection from './components/ManifestoSection'
import LandingFooter from './components/LandingFooter'
import ScrollToTop from '@/components/shared/ScrollToTop'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 selection:bg-stone-900 selection:text-stone-50 font-sans">
      {/* Top Sticky Header */}
      <LandingNav />

      {/* Notion-Style Hero: Compact Text + CTA + Live Animated Dashboard Above the Fold */}
      <section className="relative pt-7 pb-16 sm:pt-10 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Compact Hero Copy & CTA */}
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.5rem] font-normal tracking-tight text-stone-900 text-balance leading-[1.08]">
              Your bank balance is an illusion.
              <br />
              <span className="italic text-stone-600">Dakhli reveals the truth.</span>
            </h1>

            <p className="font-sans text-sm sm:text-base text-stone-600 mt-3.5 leading-relaxed max-w-xl mx-auto text-pretty">
              Isolate emergency reserves and upcoming overhead bills to see what you can actually
              spend today—100% manual, zero bank credentials, zero surveillance.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-stone-900 hover:bg-stone-800 text-stone-50 transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Start With Clean Numbers</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </Link>

              <a
                href="#simulator"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-mono text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 transition-all active:scale-[0.98]"
              >
                <span>Interactive Calculator</span>
                <span className="text-xs text-stone-400">↓</span>
              </a>
            </div>
          </div>

          {/* Live Animated Dashboard Directly in Hero Viewport (Zero Fake Chrome) */}
          <div className="mt-7 sm:mt-8 max-w-5xl mx-auto">
            <DashboardShowcase />
          </div>

          {/* Quiet Trust Receipts Below Dashboard */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-stone-700" />
              No Bank Logins
            </span>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-stone-700" />
              100% Private Cash Flow
            </span>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
              Zero Data Scraping
            </span>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-stone-700" />
              Deterministic Daily Caps
            </span>
          </div>

          {/* Interactive Reality Check Simulator */}
          <div className="mt-14 sm:mt-18 max-w-4xl mx-auto">
            <RealityCheckSimulator />
          </div>
        </div>
      </section>

      {/* The 4 Deterministic Laws */}
      <PillarsSection />

      {/* The Anti-Surveillance Audit Matrix */}
      <ComparisonMatrix />

      {/* The Closing Discipline Manifesto */}
      <ManifestoSection />

      {/* Understated Light Footer */}
      <LandingFooter />

      {/* Scroll-to-Top Detector & Button */}
      <ScrollToTop />
    </div>
  )
}

export default LandingPage

import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './landing.css'
import LandingNav from './components/LandingNav'
import DashboardShowcase from './components/DashboardShowcase'
import RealityCheckSimulator from './components/RealityCheckSimulator'
import PillarsSection from './components/PillarsSection'
import ComparisonMatrix from './components/ComparisonMatrix'
import ManifestoSection from './components/ManifestoSection'
import LandingFooter from './components/LandingFooter'
import ScrollToTop from '@/components/shared/ScrollToTop'
import { useGoogleOneTap } from '@/features/auth/hooks/useGoogleOneTap'

const HERO_METRICS = [
  {
    value: '0% Bank Logins',
    detail: 'Manual deterministic entry',
  },
  {
    value: 'Payday-Anchored',
    detail: 'Cycles start when income lands',
  },
  {
    value: 'USD · EUR · SOS',
    detail: 'Multi-currency ledger',
  },
  {
    value: '$0 / Month',
    detail: 'Zero ads or loan referrals',
  },
] as const

export const LandingPage: React.FC = () => {
  useGoogleOneTap()

  return (
    <>
      <LandingNav />

      <main
        id="main-content"
        className="landing-main bg-[#FAFAF9] text-stone-900 selection:bg-stone-900 selection:text-stone-50 font-sans"
      >
        {/* Hero Section: Top 2-Column Editorial Header + Full-Width Workspace Preview + 4-Pillar Strip */}
        <section id="top" data-enter className="hero hero-section">
          <div className="wrap">
            {/* 1. Editorial Header Split */}
            <div className="hero-enter grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-8 sm:mb-10">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 font-mono text-xs mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" aria-hidden="true" />
                  <span>PERSONAL CASH FLOW ENGINE · ZERO BANK APIS</span>
                </div>
                <h1 className="font-serif text-[36px] sm:text-[46px] lg:text-[52px] font-normal tracking-tight text-stone-900 leading-[1.06]">
                  Personal finance software for daily cash control
                </h1>
              </div>

              <div className="lg:col-span-5 flex flex-col items-start gap-5">
                <p className="font-sans text-base sm:text-[17px] text-stone-700 leading-relaxed">
                  Separate fixed bills and locked savings reserves from your gross balance—track real spendable cash across USD, EUR, and SOS from $0/month.
                </p>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <Link to="/register" className="landing-btn-primary">
                    <span>Start free account</span>
                    <ArrowRight className="w-4 h-4 btn-arrow shrink-0" aria-hidden="true" />
                  </Link>
                  <a href="#simulator" className="landing-btn-secondary">
                    Try live calculator
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Full-Width Interactive Workspace Frame */}
            <div className="hero-enter-delay">
              <DashboardShowcase />
            </div>

            {/* 3. Bottom 4-Pillar Architectural Metrics Strip */}
            <dl className="mt-6 pt-5 border-t border-stone-200/90 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {HERO_METRICS.map((item) => (
                <div key={item.value}>
                  <dt className="font-mono text-sm font-semibold text-stone-900">{item.value}</dt>
                  <dd className="font-sans text-sm text-stone-600 mt-0.5">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Interactive Net Spendable Calculator */}
        <RealityCheckSimulator />

        {/* Core Mechanics */}
        <PillarsSection />

        {/* Comparison Matrix */}
        <ComparisonMatrix />

        {/* Dedicated Closing Setup Section */}
        <ManifestoSection />
      </main>

      {/* Structured Multi-Column Footer */}
      <LandingFooter />

      <ScrollToTop />
    </>
  )
}

export default LandingPage

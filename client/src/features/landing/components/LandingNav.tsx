import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ArrowRight, LayoutDashboard } from 'lucide-react'

const SECTION_IDS = ['top', 'simulator', 'pillars', 'comparison', 'manifesto'] as const
type SectionId = (typeof SECTION_IDS)[number]

export const LandingNav: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const [activeSection, setActiveSection] = useState<SectionId>('top')

  useEffect(() => {
    const updateActive = () => {
      if (window.scrollY < 240) {
        setActiveSection('top')
        return
      }
      const midpoint = window.scrollY + window.innerHeight * 0.45
      let current: SectionId = 'top'
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= midpoint) {
          current = id
        }
      }
      setActiveSection(current)
    }

    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    return () => window.removeEventListener('scroll', updateActive)
  }, [])

  return (
    <header className="nav landing-nav">
      <div className="wrap h-full grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        {/* Left Cell: Vertically Centered Brand Lockup */}
        <div className="justify-self-start flex items-center">
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
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="h-3.5 w-px bg-stone-300" aria-hidden="true" />
              <span className="font-serif text-sm text-stone-600">دخلي</span>
            </span>
          </Link>
        </div>

        {/* Center Cell: Optically Centered Navigation Links */}
        <nav aria-label="Primary" className="hidden lg:flex items-center justify-center gap-7 font-sans">
          <a
            href="#top"
            data-active={activeSection === 'top'}
            className="landing-nav-link whitespace-nowrap"
          >
            Overview
          </a>
          <a
            href="#simulator"
            data-active={activeSection === 'simulator'}
            className="landing-nav-link whitespace-nowrap"
          >
            Calculator
          </a>
          <a
            href="#pillars"
            data-active={activeSection === 'pillars'}
            className="landing-nav-link whitespace-nowrap"
          >
            Mechanics
          </a>
          <a
            href="#comparison"
            data-active={activeSection === 'comparison'}
            className="landing-nav-link whitespace-nowrap"
          >
            Comparison
          </a>
          <a
            href="#manifesto"
            data-active={activeSection === 'manifesto'}
            className="landing-nav-link whitespace-nowrap"
          >
            Get Started
          </a>
        </nav>

        {/* Right Cell: Right-Aligned Account Actions */}
        <div className="justify-self-end flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <Link to="/" className="landing-btn-primary">
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="landing-nav-link hidden sm:inline-flex px-2 whitespace-nowrap"
              >
                Sign in
              </Link>
              <Link to="/register" className="landing-btn-primary">
                <span>Start free account</span>
                <ArrowRight className="w-4 h-4 btn-arrow hidden sm:inline shrink-0" aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default LandingNav

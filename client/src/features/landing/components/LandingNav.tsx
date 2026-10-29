import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ArrowRight, LayoutDashboard } from 'lucide-react'

export const LandingNav: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-[#FAFAF9]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Lockup */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center font-serif text-stone-50 text-sm font-semibold shadow-sm group-hover:bg-stone-800 transition-colors">
            د
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-stone-900 font-sans">
                DAKHLI
              </span>
              <span className="text-xs font-serif text-stone-500 hidden sm:inline">
                دخلي
              </span>
            </div>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider -mt-0.5 hidden sm:inline">
              Cash Flow Engine
            </span>
          </div>
        </Link>

        {/* Quiet Editorial Anchors */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono uppercase tracking-wider text-stone-500">
          <a href="#simulator" className="hover:text-stone-900 transition-colors">
            01 / Simulator
          </a>
          <a href="#pillars" className="hover:text-stone-900 transition-colors">
            02 / Mechanics
          </a>
          <a href="#comparison" className="hover:text-stone-900 transition-colors">
            03 / Audit
          </a>
          <a href="#manifesto" className="hover:text-stone-900 transition-colors">
            04 / Manifesto
          </a>
        </nav>

        {/* Solid Tactile Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-stone-900 hover:bg-stone-800 text-stone-50 transition-all shadow-sm active:scale-[0.98]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-mono text-stone-600 hover:text-stone-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-stone-900 hover:bg-stone-800 text-stone-50 transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Launch Dakhli</span>
                <ArrowRight className="w-3 h-3 text-stone-400" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default LandingNav

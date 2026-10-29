import React from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-stone-200 bg-white py-12 text-stone-500 text-xs font-mono">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand Meta */}
        <div className="flex flex-col gap-2 max-w-sm">
          <div className="flex items-center gap-2 text-stone-900 font-bold tracking-tight text-sm font-sans">
            <span>DAKHLI</span>
            <span className="font-serif text-stone-600 font-normal">دخلي</span>
            <span className="text-[11px] font-mono text-stone-400 font-normal">
              — Cash Flow Engine
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
            Privacy-first, manual personal finance engineered for deterministic control.
            No bank surveillance. No black-box algorithms. Just real numbers.
          </p>
        </div>

        {/* Links & Guarantees */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-1.5 text-stone-700">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Bank APIs</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">•</span>
          <Link to="/login" className="hover:text-stone-900 transition-colors">
            Sign In
          </Link>
          <span className="text-stone-300 hidden sm:inline">•</span>
          <Link to="/register" className="hover:text-stone-900 transition-colors">
            Register
          </Link>
          <span className="text-stone-300 hidden sm:inline">•</span>
          <a href="#simulator" className="hover:text-stone-900 transition-colors">
            Simulator
          </a>
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-stone-400">
          <span>&copy; {new Date().getFullYear()} Dakhli Engine. Built for discipline.</span>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter

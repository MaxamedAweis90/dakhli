import React from 'react'
import { motion } from 'motion/react'
import type { CurrencyCode, CurrencyConfig } from '../types/settings.types'
import { cn } from '@/lib/utils'

export interface AnimatedCurrencySwitcherProps {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  disabled?: boolean
  className?: string
}

const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'SOS', symbol: 'Sh.So.', label: 'SOS (Sh.So.)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
]

export const AnimatedCurrencySwitcher: React.FC<AnimatedCurrencySwitcherProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Currency Switcher"
      className={cn(
        'relative flex items-center bg-[#171922] border border-white/[0.06] p-1 rounded-xl select-none',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {CURRENCIES.map((cur) => {
        const isSelected = value === cur.code

        return (
          <button
            key={cur.code}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(cur.code)}
            className={cn(
              'relative z-10 flex-1 py-2 sm:py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer outline-none',
              isSelected ? 'text-white' : 'text-slate-400 hover:text-white'
            )}
          >
            {/* Animated Active Pill Indicator */}
            {isSelected && (
              <motion.div
                layoutId="currency-active-indicator"
                className="absolute inset-0 z-0 bg-[#252834] border border-white/10 rounded-lg shadow-sm"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 32,
                }}
              />
            )}

            {/* Label and Symbol */}
            <span className="relative z-10 flex items-center gap-1.5 leading-none">
              <span className={cn('tracking-tight font-semibold', isSelected && 'text-white')}>
                {cur.code}
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  isSelected ? 'text-[#E5A855]' : 'text-slate-500'
                )}
              >
                {cur.symbol}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default AnimatedCurrencySwitcher

import React from 'react'
import {
  useAnimatedNumber,
  formatLocalizedNumber,
  type UseAnimatedNumberOptions,
} from '@/hooks/useAnimatedNumber'
import { usePrivacyStore, getDynamicBullets } from '@/stores/privacyStore'
import { cn } from '@/lib/utils'

export interface AnimatedNumberProps {
  value: number
  currency?: 'USD' | 'SOS' | 'EUR' | string
  decimals?: number
  duration?: number
  stiffness?: number
  damping?: number
  mass?: number
  prefix?: string
  suffix?: string
  className?: string
  includeSymbol?: boolean
  formatOptions?: Intl.NumberFormatOptions
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  currency,
  decimals,
  duration,
  stiffness = 200,
  damping = 25,
  mass = 1,
  prefix = '',
  suffix = '',
  className,
  includeSymbol,
  formatOptions,
}) => {
  const isMasked = usePrivacyStore((state) => state.isMasked)

  const derivedDecimals =
    decimals !== undefined
      ? decimals
      : formatOptions?.maximumFractionDigits !== undefined
      ? formatOptions.maximumFractionDigits
      : undefined

  const formatted = useAnimatedNumber(value, {
    currency,
    decimals: derivedDecimals,
    duration,
    stiffness,
    damping,
    mass,
    includeSymbol,
    prefix,
    suffix,
  })

  if (isMasked) {
    const curUpper = currency ? currency.toUpperCase() : undefined
    const shouldIncludeSymbol =
      includeSymbol !== undefined ? includeSymbol : !prefix && !!curUpper

    let sym = ''
    if (shouldIncludeSymbol && curUpper) {
      if (curUpper === 'SOS') sym = 'Sh.So. '
      else if (curUpper === 'EUR') sym = '€'
      else sym = '$'
    }

    const bullets = getDynamicBullets(value)
    return (
      <span
        className={cn(
          'font-mono tabular-nums tracking-wider select-none inline-block',
          className
        )}
      >
        {prefix}{sym}{bullets}{suffix}
      </span>
    )
  }

  return (
    <span className={cn('font-mono tabular-nums inline-block', className)}>
      {formatted}
    </span>
  )
}

export { useAnimatedNumber, formatLocalizedNumber }
export type { UseAnimatedNumberOptions }
export default AnimatedNumber

import React from 'react'
import {
  useAnimatedNumber,
  formatLocalizedNumber,
  type UseAnimatedNumberOptions,
} from '@/hooks/useAnimatedNumber'
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

  return (
    <span className={cn('font-mono tabular-nums inline-block', className)}>
      {formatted}
    </span>
  )
}

export { useAnimatedNumber, formatLocalizedNumber }
export type { UseAnimatedNumberOptions }
export default AnimatedNumber

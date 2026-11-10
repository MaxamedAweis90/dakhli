import { useEffect, useRef, useState } from 'react'
import { useMotionValue, useSpring } from 'motion/react'

export interface UseAnimatedNumberOptions {
  /** Target currency code: USD, SOS, EUR, etc. */
  currency?: 'USD' | 'SOS' | 'EUR' | string
  /** Number of decimal places. Defaults to 2 (or 0 for SOS unless specified) */
  decimals?: number
  /** Duration in seconds (for animation reference or fallback) */
  duration?: number
  /** Mechanical spring stiffness. Default: 200 */
  stiffness?: number
  /** Mechanical spring damping. Default: 25 */
  damping?: number
  /** Spring mass. Default: 1 */
  mass?: number
  /** Whether to prepend the currency symbol. Defaults to true if currency is provided and prefix is empty */
  includeSymbol?: boolean
  /** Custom prefix to prepend (e.g. '$', '+', '-') */
  prefix?: string
  /** Custom suffix to append (e.g. '%', '/day') */
  suffix?: string
}

/**
 * Format a number according to currency and decimals rules:
 * - USD / EUR default to 2 decimal places with $ / €
 * - SOS defaults to integer (0 decimals) with Sh.So., or uses explicit decimals
 * - Fixed decimal precision to enforce tabular layout stability
 */
export function formatLocalizedNumber(
  val: number,
  currency?: string,
  decimals?: number,
  includeSymbol?: boolean,
  prefix: string = '',
  suffix: string = ''
): string {
  const num = Number.isFinite(val) ? val : 0
  const curUpper = currency ? currency.toUpperCase() : undefined
  const isSOS = curUpper === 'SOS'
  const targetDecimals = decimals !== undefined ? decimals : isSOS ? 0 : 2

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: targetDecimals,
    maximumFractionDigits: targetDecimals,
  }).format(num)

  const shouldIncludeSymbol =
    includeSymbol !== undefined ? includeSymbol : !prefix && !!curUpper

  let sym = ''
  if (shouldIncludeSymbol && curUpper) {
    if (curUpper === 'SOS') sym = 'Sh.So. '
    else if (curUpper === 'EUR') sym = '€'
    else sym = '$'
  }

  return `${prefix}${sym}${formatted}${suffix}`
}

/**
 * Hook to animate a numeric value smoothly with mechanical spring physics.
 * Accepts value, currency, and decimals.
 * Handles rapid successive updates without queue buildup or jump.
 */
export function useAnimatedNumber(
  value: number,
  options?: UseAnimatedNumberOptions
): string {
  const stiffness = options?.stiffness ?? 200
  const damping = options?.damping ?? 25
  const mass = options?.mass ?? 1

  const initialVal = Number.isFinite(value) ? value : 0
  const motionVal = useMotionValue(initialVal)
  const spring = useSpring(motionVal, {
    stiffness,
    damping,
    mass,
    restDelta: 0.0001,
  })

  const [displayNumber, setDisplayNumber] = useState(initialVal)
  const isMounted = useRef(false)
  const targetRef = useRef(initialVal)
  targetRef.current = initialVal

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    motionVal.set(initialVal)
  }, [initialVal, motionVal])

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest: number) => {
      if (Math.abs(latest - targetRef.current) < 0.0005) {
        setDisplayNumber(targetRef.current)
      } else {
        setDisplayNumber(latest)
      }
    })
    return () => unsubscribe()
  }, [spring])

  return formatLocalizedNumber(
    displayNumber,
    options?.currency,
    options?.decimals,
    options?.includeSymbol,
    options?.prefix,
    options?.suffix
  )
}

/**
 * Hook to retrieve the raw animated number (numeric value).
 */
export function useAnimatedValue(
  value: number,
  options?: { stiffness?: number; damping?: number; mass?: number }
): number {
  const stiffness = options?.stiffness ?? 200
  const damping = options?.damping ?? 25
  const mass = options?.mass ?? 1

  const initialVal = Number.isFinite(value) ? value : 0
  const motionVal = useMotionValue(initialVal)
  const spring = useSpring(motionVal, {
    stiffness,
    damping,
    mass,
    restDelta: 0.0001,
  })

  const [displayNumber, setDisplayNumber] = useState(initialVal)
  const isMounted = useRef(false)
  const targetRef = useRef(initialVal)
  targetRef.current = initialVal

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    motionVal.set(initialVal)
  }, [initialVal, motionVal])

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest: number) => {
      if (Math.abs(latest - targetRef.current) < 0.0005) {
        setDisplayNumber(targetRef.current)
      } else {
        setDisplayNumber(latest)
      }
    })
    return () => unsubscribe()
  }, [spring])

  return displayNumber
}

export default useAnimatedNumber


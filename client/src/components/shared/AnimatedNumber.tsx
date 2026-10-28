import React, { useEffect, useRef, useState } from 'react'

export interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  formatOptions?: Intl.NumberFormatOptions
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 650,
  className,
  formatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
}) => {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevValueRef.current = value
      setDisplayValue(value)
      return
    }

    const startValue = prevValueRef.current
    const endValue = value
    prevValueRef.current = value

    if (startValue === endValue) return

    const startTime = performance.now()
    let animationFrameId: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic curve for natural deceleration
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * ease

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick)
      } else {
        setDisplayValue(endValue)
      }
    }

    animationFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameId)
  }, [value, duration])

  const formatted = new Intl.NumberFormat('en-US', formatOptions).format(displayValue)

  return <span className={className}>{formatted}</span>
}

export default AnimatedNumber

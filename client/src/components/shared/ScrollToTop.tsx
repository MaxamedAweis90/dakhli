import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
      className={cn(
        'fixed bottom-6 right-6 z-50 w-11 h-11 rounded-xl bg-stone-900 text-stone-50 border border-stone-800 shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-stone-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 cursor-pointer',
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      )}
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  )
}

export default ScrollToTop


import React, { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LayoutGroup } from 'motion/react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SearchPalette } from './SearchPalette'
import { OnboardingModal } from '@/features/onboarding/components/OnboardingModal'
import { usePrivacyHotkey } from '@/hooks/usePrivacyHotkey'

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  usePrivacyHotkey()

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    el.scrollTop = 0
    setIsScrolled(false)
  }, [location.pathname])

  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrolled = e.currentTarget.scrollTop > 20
    setIsScrolled((prev) => (prev === scrolled ? prev : scrolled))
  }

  return (
    <LayoutGroup id="search-flow">
      <div className="w-screen h-screen overflow-hidden bg-[#111215] text-white flex">
        {/* Full-screen animated search overlay */}
        <SearchPalette />

        {/* Welcome Onboarding Stepper for New Users */}
        <OnboardingModal />

        {/* Left rail (desktop) */}
        <Sidebar />

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <main
            ref={mainRef}
            onScroll={handleMainScroll}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-6 lg:px-0 lg:pr-[1.25rem] lg:pb-[1.25rem] relative"
          >
            <Header isScrolled={isScrolled} />

            {children || <Outlet />}
          </main>
        </div>
      </div>
    </LayoutGroup>
  )
}

export default AppShell

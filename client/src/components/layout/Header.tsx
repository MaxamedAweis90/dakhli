import React, { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  ChevronDown,
  LogOut,
  Plus,
  Search,
  Settings,
  User as UserIcon,
} from '@/components/shared/icons'
import { Calculator, ChevronLeft, Eye, EyeOff, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usePrivacyStore } from '@/stores/privacyStore'
import { useSearchStore } from '@/stores/searchStore'
import {
  useOverheadsStore,
  getRealCurrentMonth,
  getMaxFutureMonth,
} from '@/stores/overheadsStore'
import { MonthNavigator } from '@/components/shared/ui/MonthNavigator'
import { CalculatorModal } from '@/components/calculator/CalculatorModal'
import { LazyImage } from '@/components/shared/LazyImage'
import { SplashScreen } from '@/components/shared/SplashScreen'
import { NAV_ITEMS } from './navItems'
import { cn } from '@/lib/utils'

const ROUTE_TITLES: Record<string, string> = {
  '/overheads': 'Overhead Bills',
  '/daily': 'Daily Spending & Cap',
  '/save-plans': 'Save Plans',
  '/items': 'Registered Items',
  '/settings': 'Settings',
  '/profile': 'Profile Settings',
}

export interface HeaderProps {
  isScrolled?: boolean
}

export const Header: React.FC<HeaderProps> = ({ isScrolled = false }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearSession } = useAuthStore()
  const { isMasked, togglePrivacy } = usePrivacyStore()
  const { openSearch } = useSearchStore()
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isToolsExpanded, setIsToolsExpanded] = useState(false)

  const {
    currentMonth,
    prevMonth,
    nextMonth,
    jumpToCurrentMonth,
    isAtCreationMonth,
    isAtFutureLimit,
  } = useOverheadsStore()

  useEffect(() => {
    setIsDrawerOpen(false)
    setIsProfileMenuOpen(false)
    setIsToolsExpanded(false)
  }, [location.pathname])

  useEffect(() => {
    if (isScrolled) {
      setIsToolsExpanded(false)
    }
  }, [isScrolled])

  useEffect(() => {
    if (!isDrawerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false)
        setIsProfileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  const realCurrentMonth = getRealCurrentMonth()
  const userCreatedAtMonth = user?.createdAt ? user.createdAt.slice(0, 7) : realCurrentMonth
  const maxFutureMonth = getMaxFutureMonth(realCurrentMonth, 3)

  const isPrevDisabled = isAtCreationMonth(userCreatedAtMonth)
  const isNextDisabled = isAtFutureLimit(maxFutureMonth)

  const [yStr, mStr] = currentMonth.split('-')
  const dateObj = new Date(Number(yStr), Number(mStr) - 1, 1)
  const cycleLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isDifferentFromNow = currentMonth !== realCurrentMonth

  const rawName = user?.name || (user?.email ? user.email.split('@')[0] : 'Anna')
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const displayEmail = user?.email || 'user@dakhli.app'
  const isMonthAware = ['/overheads', '/overhead'].includes(location.pathname)
  const isSettings = location.pathname === '/settings'
  const isCurrentDormant = Boolean(user?.dormantCycles?.includes(currentMonth))
  const showCalAndEye = !isMonthAware || isScrolled || isToolsExpanded
  const title =
    location.pathname === '/' ? `Hello, ${displayName}!` : (ROUTE_TITLES[location.pathname] ?? 'Overview')

  const handleMobileSignOut = () => {
    setIsProfileMenuOpen(false)
    setIsDrawerOpen(false)
    setIsLoggingOut(true)
    setTimeout(() => {
      clearSession()
      navigate('/login', { replace: true })
    }, 600)
  }

  if (isLoggingOut) {
    return <SplashScreen message="Signing out..." />
  }

  return (
    <>
      {/* ================= DESKTOP HEADER (1024px+ — UNCHANGED) ================= */}
      {/* Floating Action Controls: Ask AI + Date (+ Save Baseline on settings), sticky at top-0 */}
      <div className="hidden lg:flex sticky top-0 z-30 pointer-events-none items-center justify-end lg:h-[4.75rem] lg:px-0 bg-transparent lg:-mb-[4.75rem]">
        <div className="pointer-events-auto flex items-center gap-[0.75rem]">
          {/* Top-Right Calculator Icon Button (to left of calendar) */}
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            title="Open Calculator"
            aria-label="Open Calculator"
            className="flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full bg-[#212121] hover:bg-[#2c2f38] text-[#cfcfcf] hover:text-white transition-all shadow-[0_2px_12px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95 border border-white/[0.04]"
          >
            <Calculator className="w-[0.95rem] h-[0.95rem]" />
          </button>

          {/* Top-Right Privacy Shroud Toggle Button (directly to left of calendar) */}
          <button
            type="button"
            onClick={togglePrivacy}
            title={isMasked ? 'Show balances (H)' : 'Hide balances (H)'}
            aria-label={isMasked ? 'Show balances' : 'Hide balances'}
            className={cn(
              'flex items-center justify-center w-[2.2rem] h-[2.2rem] rounded-full transition-all shadow-[0_2px_12px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95 border',
              isMasked
                ? 'bg-[#252833] hover:bg-[#2c3040] text-amber-400 border-amber-500/30'
                : 'bg-[#212121] hover:bg-[#2c2f38] text-slate-400 hover:text-white border-white/[0.04]'
            )}
          >
            {isMasked ? (
              <EyeOff className="w-[0.95rem] h-[0.95rem]" />
            ) : (
              <Eye className="w-[0.95rem] h-[0.95rem]" />
            )}
          </button>

          {/* Top-Right Fast-Switch Date pill button */}
          <button
            type="button"
            onClick={jumpToCurrentMonth}
            title={isDifferentFromNow ? 'Click to jump to current month' : (isCurrentDormant ? 'Dormant Cycle' : 'Active Cycle')}
            className={cn(
              'flex items-center gap-[0.5rem] h-[2.2rem] px-[1rem] rounded-full text-[0.78rem] font-medium shadow-[0_2px_12px_rgba(0,0,0,0.5)] transition-all',
              isCurrentDormant
                ? 'bg-[#1E2028] text-slate-400 border border-white/5 cursor-pointer active:scale-95'
                : isDifferentFromNow
                ? 'bg-[#252833] hover:bg-[#2e3240] text-amber-300 border border-amber-500/30 cursor-pointer active:scale-95'
                : 'bg-[#212121] text-white cursor-default'
            )}
          >
            <Calendar className="w-[0.9rem] h-[0.9rem] text-[#cfcfcf]" />
            <span>{cycleLabel}</span>
            {isCurrentDormant && (
              <span className="text-slate-400 font-mono text-[9px] bg-white/5 px-1 py-0.2 rounded border border-white/5 uppercase">
                DORMANT
              </span>
            )}
          </button>

          {/* + Save Baseline Button on Settings route */}
          {isSettings && (
            <button
              type="submit"
              form="settings-baseline-form"
              className="flex items-center gap-[0.35rem] h-[2.2rem] px-[1.15rem] rounded-full bg-[#E5A855] hover:bg-[#d89740] active:scale-[0.98] text-[#121316] font-semibold text-[0.825rem] transition-all shadow-[0_2px_12px_rgba(229,168,85,0.25)] cursor-pointer"
            >
              <Plus className="w-[0.875rem] h-[0.875rem] stroke-[2.5]" />
              <span>Save Baseline</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Title: in natural document flow, scrolls with screen to top */}
      <div className="hidden lg:flex items-center lg:h-[4.75rem] lg:px-0 lg:pr-[22rem]">
        {isMonthAware ? (
          <MonthNavigator
            currentMonth={currentMonth}
            onPrev={() => prevMonth(userCreatedAtMonth)}
            onNext={() => nextMonth(maxFutureMonth)}
            isPrevDisabled={isPrevDisabled}
            isNextDisabled={isNextDisabled}
          />
        ) : (
          <h1 className="text-[1.5rem] font-semibold leading-none tracking-[-0.015em] text-white">
            {title}
          </h1>
        )}
      </div>

      {/* ================= MOBILE & TABLET STICKY HEADER (< 1024px) ================= */}
      <header className="lg:hidden sticky top-0 z-30 -mx-4 px-4 h-14 bg-[#111215]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between gap-2 mb-3.5">
        {/* Top-Left Title <-> + Dakhli Scroll Swap */}
        <div className="relative flex items-center min-w-0 flex-1 h-9 overflow-hidden">
          <div
            data-testid="mobile-header-title"
            className={cn(
              'flex items-center min-w-0 w-full transition-all duration-200 ease-out',
              isScrolled
                ? 'opacity-0 -translate-y-2.5 pointer-events-none'
                : 'opacity-100 translate-y-0'
            )}
            aria-hidden={isScrolled}
          >
            {isMonthAware ? (
              <MonthNavigator
                currentMonth={currentMonth}
                onPrev={() => prevMonth(userCreatedAtMonth)}
                onNext={() => nextMonth(maxFutureMonth)}
                isPrevDisabled={isPrevDisabled}
                isNextDisabled={isNextDisabled}
                hideControls={isMonthAware && !isScrolled && isToolsExpanded}
                className="gap-2 [&>div>h1]:text-[1.15rem] [&>div>h1]:truncate"
              />
            ) : (
              <h1 className="text-[1.2rem] font-semibold leading-none tracking-[-0.015em] text-white truncate">
                {title}
              </h1>
            )}
          </div>

          <div
            data-testid="mobile-header-logo"
            className={cn(
              'absolute inset-0 flex items-center gap-[0.625rem] transition-all duration-200 ease-out',
              isScrolled
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2.5 pointer-events-none'
            )}
            aria-hidden={!isScrolled}
          >
            <svg
              viewBox="0 0 16 16"
              className="w-[1.05rem] h-[1.05rem] text-white shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M8 1.5v13M1.5 8h13" />
            </svg>
            <span className="text-[1.15rem] leading-none font-medium tracking-[-0.015em] text-white">
              Dakhli
            </span>
          </div>
        </div>

        {/* Top-Right Compact Controls + Expander (on /overheads) + Burger Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsToolsExpanded((prev) => !prev)}
            data-testid="mobile-tools-expander"
            aria-label={isToolsExpanded ? 'Show month controls' : 'Show calculator and privacy controls'}
            aria-expanded={isToolsExpanded}
            className={cn(
              'flex items-center justify-center h-8 rounded-full bg-[#1b1b1b] hover:bg-[#252525] text-[#cfcfcf] hover:text-white border border-white/[0.06] cursor-pointer transition-all duration-300 ease-out overflow-hidden shrink-0',
              isMonthAware && !isScrolled
                ? 'w-8 opacity-100 scale-100 active:scale-95'
                : 'w-0 opacity-0 scale-75 pointer-events-none border-0 p-0 -mr-2'
            )}
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 transition-transform duration-300 ease-out',
                isToolsExpanded && 'rotate-180'
              )}
            />
          </button>

          <div
            data-testid="mobile-tools-tray"
            aria-hidden={!showCalAndEye}
            className={cn(
              'flex items-center gap-2 transition-all duration-300 ease-out overflow-hidden',
              showCalAndEye
                ? 'max-w-[5.25rem] opacity-100 translate-x-0 pointer-events-auto'
                : 'max-w-0 opacity-0 translate-x-4 pointer-events-none -mr-2'
            )}
          >
            <button
              type="button"
              onClick={() => setIsCalculatorOpen(true)}
              title="Open Calculator"
              aria-label="Open Calculator"
              className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-[#1b1b1b] hover:bg-[#252525] text-[#cfcfcf] hover:text-white transition-colors border border-white/[0.06] cursor-pointer active:scale-95"
            >
              <Calculator className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={togglePrivacy}
              title={isMasked ? 'Show balances (H)' : 'Hide balances (H)'}
              aria-label={isMasked ? 'Show balances' : 'Hide balances'}
              className={cn(
                'flex items-center justify-center w-8 h-8 shrink-0 rounded-full transition-colors border cursor-pointer active:scale-95',
                isMasked
                  ? 'bg-[#252833] text-amber-400 border-amber-500/30'
                  : 'bg-[#1b1b1b] hover:bg-[#252525] text-slate-400 hover:text-white border-white/[0.06]'
              )}
            >
              {isMasked ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={jumpToCurrentMonth}
            title={isDifferentFromNow ? 'Click to jump to current month' : (isCurrentDormant ? 'Dormant Cycle' : 'Active Cycle')}
            className={cn(
              'hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors border',
              isCurrentDormant
                ? 'bg-[#1E2028] text-slate-400 border-white/5 cursor-pointer'
                : isDifferentFromNow
                ? 'bg-[#252833] text-amber-300 border-amber-500/30 cursor-pointer'
                : 'bg-[#1b1b1b] text-white border-white/[0.06] cursor-default'
            )}
          >
            <Calendar className="w-3.5 h-3.5 text-[#cfcfcf]" />
            <span>{cycleLabel}</span>
          </button>

          {isSettings && (
            <button
              type="submit"
              form="settings-baseline-form"
              className="flex items-center gap-1 h-8 px-3 rounded-full bg-[#E5A855] hover:bg-[#d89740] text-[#121316] font-semibold text-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
            data-testid="mobile-menu-button"
            className="flex items-center justify-center w-9 h-9 rounded-[0.65rem] bg-[#1b1b1b] hover:bg-[#242424] text-white border border-white/[0.06] transition-colors cursor-pointer active:scale-95"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================= MOBILE & TABLET RIGHT-SIDE DRAWER (< 1024px) ================= */}
      {/* Backdrop Overlay */}
      <div
        data-testid="mobile-drawer-backdrop"
        onClick={() => {
          setIsDrawerOpen(false)
          setIsProfileMenuOpen(false)
        }}
        aria-hidden={!isDrawerOpen}
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] transition-opacity duration-200',
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Full-Height Right-Side Navigation Drawer */}
      <aside
        data-testid="mobile-nav-drawer"
        aria-label="Navigation menu"
        aria-hidden={!isDrawerOpen}
        className={cn(
          'lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[18.5rem] max-w-[86vw] h-full bg-[#111215] border-l border-white/[0.08] shadow-[-16px_0_40px_rgba(0,0,0,0.7)] flex flex-col justify-between p-4 transition-transform duration-200 ease-out select-none',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
      >
        <div>
          {/* Drawer Header: Brand + Close Button */}
          <div className="flex items-center justify-between h-9 pl-1">
            <div className="flex items-center gap-[0.625rem]">
              <svg
                viewBox="0 0 16 16"
                className="w-[1.1rem] h-[1.1rem] text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M8 1.5v13M1.5 8h13" />
              </svg>
              <span className="text-[1.2rem] leading-none font-medium tracking-[-0.015em] text-white">
                Dakhli
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false)
                setIsProfileMenuOpen(false)
              }}
              aria-label="Close navigation menu"
              data-testid="mobile-drawer-close"
              className="flex items-center justify-center w-8 h-8 rounded-[0.6rem] bg-[#1b1b1b] hover:bg-[#242424] text-[#c2c2c2] hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(false)
              openSearch()
            }}
            data-testid="mobile-drawer-search"
            className="mt-5 w-full relative flex items-center h-[2.4rem] rounded-[0.75rem] bg-[#1b1b1b] hover:bg-[#202020] cursor-pointer px-[0.875rem] select-none transition-colors border border-white/[0.04]"
          >
            <Search className="w-[0.9rem] h-[0.9rem] text-[#70727a] mr-[0.55rem] flex-shrink-0" />
            <span className="text-[0.8125rem] text-[#70727a] font-normal flex-1 text-left">
              Search
            </span>
            <kbd className="text-[0.65rem] font-mono font-medium text-[#70727a] bg-[#242424] px-1.5 py-0.5 rounded border border-white/[0.06]">
              ⌘K
            </kbd>
          </button>

          {/* Navigation Links (All 5 NAV_ITEMS) */}
          <nav className="mt-5 flex flex-col gap-1.5" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsDrawerOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-[0.65rem] h-[2.5rem] px-[0.875rem] rounded-[0.75rem] text-[0.84rem] transition-colors',
                      isActive
                        ? 'bg-[#1f1f1f] text-white font-medium shadow-sm'
                        : 'text-[#c2c2c2] hover:bg-[#1b1b1b] hover:text-white font-normal'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'w-[1rem] h-[1rem] transition-colors',
                          isActive ? 'text-white' : 'text-[#8e909a]',
                          isActive && item.to === '/' && 'fill-current'
                        )}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Bottom User Avatar Card + Dropdown inside Drawer */}
        <div className="relative pt-3 border-t border-white/[0.06]">
          <button
            type="button"
            aria-label="User profile menu"
            data-testid="mobile-profile-menu-button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-[#1a1b20] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-[0.65rem] min-w-0">
              {user?.avatar ? (
                <LazyImage
                  src={user.avatar}
                  alt={displayName}
                  containerClassName="w-[2.2rem] h-[2.2rem] rounded-full flex-shrink-0 border border-white/10"
                  className="w-full h-full rounded-full object-cover"
                  fallbackIcon={<UserIcon className="w-[1.05rem] h-[1.05rem] text-[#8e909a]" />}
                />
              ) : (
                <div
                  aria-label="User placeholder avatar"
                  className="w-[2.2rem] h-[2.2rem] rounded-full bg-[#1e2027] border border-white/10 flex items-center justify-center flex-shrink-0 text-[#8e909a] group-hover:text-white group-hover:border-white/20 transition-colors"
                >
                  <UserIcon className="w-[1.05rem] h-[1.05rem] text-[#8e909a] group-hover:text-white transition-colors" />
                </div>
              )}
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-[0.825rem] font-medium leading-tight text-white truncate">
                  {displayName}
                </span>
                <span className="text-[0.7rem] text-[#70727a] leading-tight truncate">
                  {displayEmail}
                </span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-[0.85rem] h-[0.85rem] text-[#70727a] group-hover:text-white transition-all duration-200 flex-shrink-0',
                isProfileMenuOpen && 'rotate-180 text-white'
              )}
            />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-full bg-[#13151B] border border-white/[0.08] rounded-xl py-1.5 px-1 shadow-2xl z-50 backdrop-blur-md">
              <NavLink
                to="/settings"
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  setIsDrawerOpen(false)
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 w-full px-2.5 py-2 text-xs font-mono rounded-lg transition-colors cursor-pointer group',
                    isActive
                      ? 'bg-[#1A1D26] text-white font-medium'
                      : 'text-slate-300 hover:text-white hover:bg-[#1A1D26]'
                  )
                }
              >
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                <span>Settings</span>
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  setIsDrawerOpen(false)
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 w-full px-2.5 py-2 text-xs font-mono rounded-lg transition-colors cursor-pointer group',
                    isActive
                      ? 'bg-[#1A1D26] text-white font-medium'
                      : 'text-slate-300 hover:text-white hover:bg-[#1A1D26]'
                  )
                }
              >
                <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                <span>Profile Settings</span>
              </NavLink>
              <div className="border-t border-white/5 my-1" />
              <button
                type="button"
                onClick={handleMobileSignOut}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Mobile/Desktop Calculator Modal */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </>
  )
}

export default Header

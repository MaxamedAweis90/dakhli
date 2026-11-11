import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, LogOut, ChevronDown, User as UserIcon, Settings } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'
import { useSearchStore } from '@/stores/searchStore'
import { SplashScreen } from '@/components/shared/SplashScreen'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './navItems'

export const Sidebar: React.FC = () => {
  const { user, clearSession } = useAuthStore()
  const { isOpen, openSearch } = useSearchStore()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const displayEmail = user?.email || 'user@dakhli.app'

  const handleSignOut = () => {
    setIsMenuOpen(false)
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
    <aside className="hidden lg:flex w-[13.5rem] xl:w-[14.5rem] h-full flex-shrink-0 flex-col justify-between select-none pl-[1.1rem] pr-[1.25rem] pt-[1.5rem] pb-[1.25rem]">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-[0.625rem] h-[2rem] pl-[0.125rem]">
          <svg viewBox="0 0 16 16" className="w-[1.125rem] h-[1.125rem] text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M8 1.5v13M1.5 8h13" />
          </svg>
          <span className="text-[1.25rem] leading-none font-medium tracking-[-0.015em] text-white">Dakhli</span>
        </div>

        {/* Search */}
        {!isOpen ? (
          <motion.div
            layoutId="sidebar-search-bar"
            onClick={openSearch}
            className="mt-[1.75rem] relative flex items-center h-[2.35rem] rounded-[0.75rem] bg-[#1b1b1b] cursor-pointer px-[0.875rem] select-none hover:bg-[#202020] transition-colors"
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 32,
            }}
          >
            <Search className="w-[0.95rem] h-[0.95rem] text-[#6f6f6f] flex-shrink-0" />
            <span className="ml-[0.625rem] text-[0.825rem] text-[#777]">Search</span>
          </motion.div>
        ) : (
          <div className="mt-[1.75rem] h-[2.35rem]" aria-hidden="true" />
        )}

        {/* Navigation */}
        <nav className="mt-[1.75rem] flex flex-col gap-[0.35rem]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-[0.75rem] h-[2.35rem] pl-[0.75rem] pr-3 rounded-[0.625rem] text-[0.825rem] transition-colors',
                    isActive
                      ? 'bg-[#1f1f1f] text-white font-medium shadow-sm'
                      : 'text-[#c2c2c2] hover:bg-[#1b1b1b] hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('w-[1rem] h-[1rem]', isActive && item.to === '/' && 'fill-current')} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Profile matching setting.png */}
      <div className="relative pt-2">
        <button
          type="button"
          aria-label="User profile menu"
          data-testid="profile-menu-button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex items-center justify-between w-full p-1.5 -ml-1 rounded-xl hover:bg-[#1a1b20] transition-colors text-left group cursor-pointer"
        >
          <div className="flex items-center gap-[0.65rem] min-w-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-[2.2rem] h-[2.2rem] rounded-full object-cover flex-shrink-0 border border-white/10"
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
              isMenuOpen && 'rotate-180 text-white'
            )}
          />
        </button>

        {/* Dropdown Menu for Logout / Account */}
        {isMenuOpen && (
          <div
            className="absolute bottom-full mb-2 left-0 w-full bg-[#13151B] border border-white/[0.08] rounded-xl py-1.5 px-1 shadow-2xl z-50 backdrop-blur-md"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <NavLink
              to="/settings"
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar


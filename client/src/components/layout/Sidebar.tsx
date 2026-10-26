import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Search, LogOut, ChevronDown } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './navItems'

export const Sidebar: React.FC = () => {
  const { user, clearSession } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const displayName = user?.name || 'Anna Watson'
  const displayEmail = user?.email || 'arinwatson@...'

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
        <div className="mt-[1.75rem] relative flex items-center h-[2.35rem] rounded-[0.75rem] bg-[#1b1b1b]">
          <Search className="absolute left-[0.875rem] w-[0.95rem] h-[0.95rem] text-[#6f6f6f]" />
          <input
            type="text"
            readOnly
            placeholder="Search"
            aria-label="Search"
            className="w-full h-full bg-transparent pl-[2.4rem] pr-3 text-[0.825rem] text-white placeholder-[#777] outline-none cursor-pointer"
          />
        </div>

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
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex items-center justify-between w-full p-1.5 -ml-1 rounded-xl hover:bg-[#1a1b20] transition-colors text-left group cursor-pointer"
        >
          <div className="flex items-center gap-[0.65rem] min-w-0">
            <img
              src="/images/avatar.png"
              alt={displayName}
              className="w-[2.2rem] h-[2.2rem] rounded-full object-cover flex-shrink-0 border border-white/10"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
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
            className="absolute bottom-full mb-2 left-0 w-full bg-[#1b1c22] border border-white/10 rounded-xl p-1.5 shadow-xl z-50 backdrop-blur-md"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => {
                clearSession()
                setIsMenuOpen(false)
              }}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar


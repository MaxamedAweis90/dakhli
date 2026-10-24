import React from 'react'
import { NavLink } from 'react-router-dom'
import { Search, LogOut } from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './navItems'

export const Sidebar: React.FC = () => {
  const { user, clearSession } = useAuthStore()
  const initial = (user?.email?.[0] ?? 'A').toUpperCase()

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

      {/* Avatar (sign-out appears on hover) */}
      <div className="group flex items-center gap-[0.75rem] pl-[0.25rem]">
        <div
          title={user?.email ?? 'Anna'}
          className="w-[2.25rem] h-[2.25rem] rounded-full flex items-center justify-center text-[0.875rem] font-semibold text-[#2b2118] bg-gradient-to-br from-[#f3c9a6] to-[#d9a07a] flex-shrink-0"
        >
          {initial}
        </div>
        <button
          type="button"
          onClick={clearSession}
          title="Sign out"
          aria-label="Sign out"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[#8a8a8a] hover:text-white cursor-pointer"
        >
          <LogOut className="w-[1rem] h-[1rem]" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  CalendarCheck,
  PiggyBank,
  PackageCheck,
  Settings,
  Search,
  LogOut,
  ChevronDown,
} from '@/components/shared/icons'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Overheads', to: '/overheads', icon: Receipt },
  { name: 'Daily Check-Off', to: '/daily', icon: CalendarCheck },
  { name: 'Save Plans', to: '/save-plans', icon: PiggyBank },
  { name: 'Item Registry', to: '/items', icon: PackageCheck },
  { name: 'Settings', to: '/settings', icon: Settings },
]

export const Sidebar: React.FC = () => {
  const { user, clearSession } = useAuthStore()

  const displayName = user?.email ? user.email.split('@')[0] : 'Anna Watson'
  const displayEmail = user?.email || 'ann.watson@dakhli.app'

  return (
    <aside className="w-64 h-full bg-[#111215] flex flex-col flex-shrink-0 select-none p-6 justify-between">
      <div>
        {/* Clean Brand Mark: + Dakhli */}
        <div className="flex items-center space-x-2 mb-7 px-1">
          <span className="text-white font-light text-2xl leading-none select-none">+</span>
          <span className="text-xl font-bold tracking-tight text-white font-sans">Dakhli</span>
        </div>

        {/* Search Pill: Compact rounded-full */}
        <div className="mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder="Search"
              className="w-full pl-11 pr-4 py-2 bg-[#171922] text-slate-300 placeholder-slate-500 text-sm rounded-full border border-white/5 focus:outline-none transition-colors cursor-pointer"
            />
          </div>
        </div>

        {/* Navigation List: gap-2 vertical stack */}
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-[#1A1D26] text-white shadow-sm font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-[#1A1D26]/40'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400'
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

      {/* Bottom Profile: Circular avatar, name, and vertical chevron */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#171922] transition-colors group cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-700/80 border border-white/10 flex items-center justify-center text-slate-200 text-xs font-semibold uppercase flex-shrink-0">
              AW
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate capitalize">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearSession()
            }}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg"
          >
            <ChevronDown className="w-4 h-4 group-hover:hidden" />
            <LogOut className="w-4 h-4 hidden group-hover:block" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

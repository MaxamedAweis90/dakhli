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
  Sparkles,
  LogOut,
  User as UserIcon,
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

  const displayName = user?.email ? user.email.split('@')[0] : 'User'
  const displayEmail = user?.email || 'user@dakhli.app'

  return (
    <aside className="w-64 h-screen bg-canvas border-r border-surface-subtle/70 flex flex-col flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
          <Sparkles className="w-4 h-4 fill-brand/20" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">Dakhli</span>
      </div>

      {/* Quick Search Pill */}
      <div className="px-4 py-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            readOnly
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-surface-card/60 hover:bg-surface-card border border-surface-subtle/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'text-white bg-surface-card border border-surface-subtle/90 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-surface-elevated/40'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span className="tracking-wide">{item.name}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Sidebar Footer: User profile pill */}
      <div className="p-3 border-t border-surface-subtle/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-surface-card/40 border border-surface-subtle/40 hover:bg-surface-card/70 transition-colors">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-surface-elevated border border-surface-subtle flex items-center justify-center text-slate-300 text-xs font-semibold uppercase flex-shrink-0">
              {displayName.slice(0, 2) || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate capitalize">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={() => clearSession()}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-status-danger hover:bg-surface-elevated rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

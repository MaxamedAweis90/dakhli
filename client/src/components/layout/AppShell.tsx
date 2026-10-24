import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { NAV_ITEMS } from './navItems'
import { cn } from '@/lib/utils'

export const AppShell: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#111215] text-white flex">
      {/* Left rail (desktop) */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 lg:px-0 lg:pr-[1.25rem] lg:pb-[1.25rem] relative">
          <Header />

          {/* Compact navigation for tablet / mobile */}
          <nav className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                    isActive ? 'bg-[#252525] text-white' : 'text-[#bdbdbd] bg-[#181818] hover:text-white'
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell

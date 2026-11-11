import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutGroup } from 'motion/react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SearchPalette } from './SearchPalette'
import { NAV_ITEMS } from './navItems'
import { Search } from '@/components/shared/icons'
import { useSearchStore } from '@/stores/searchStore'
import { usePrivacyHotkey } from '@/hooks/usePrivacyHotkey'
import { cn } from '@/lib/utils'

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { openSearch } = useSearchStore()
  usePrivacyHotkey()

  return (
    <LayoutGroup id="search-flow">
      <div className="w-screen h-screen overflow-hidden bg-[#111215] text-white flex">
        {/* Full-screen animated search overlay */}
        <SearchPalette />

        {/* Left rail (desktop) */}
        <Sidebar />

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-6 lg:px-0 lg:pr-[1.25rem] lg:pb-[1.25rem] relative">
            <Header />

            {/* Compact navigation for tablet / mobile */}
            <nav className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
              <button
                type="button"
                onClick={openSearch}
                aria-label="Search"
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-[#bdbdbd] bg-[#181818] hover:text-white hover:bg-[#222] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3 h-3 text-[#70727a]" />
                <span>Search</span>
              </button>
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

            {children || <Outlet />}
          </main>
        </div>
      </div>
    </LayoutGroup>
  )
}

export default AppShell

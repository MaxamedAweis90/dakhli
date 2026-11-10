import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  X,
  Home,
  Layers,
  ArrowLeftRight,
  PiggyBank,
  ClipboardList,
  Settings,
  Receipt,
  TrendingUp,
  Calendar,
  Wallet,
} from '@/components/shared/icons'
import { useSearchStore } from '@/stores/searchStore'
import { cn } from '@/lib/utils'

export interface SearchItem {
  id: string
  title: string
  to?: string
  isComingSoon?: boolean
  icon: React.ComponentType<{ className?: string }>
  keywords?: string[]
}

const SEARCH_ITEMS: SearchItem[] = [
  // Routes
  {
    id: 'dashboard',
    title: 'Dashboard',
    to: '/',
    icon: Home,
    keywords: ['home', 'overview', 'summary', 'stats', 'balance'],
  },
  {
    id: 'overheads',
    title: 'Overheads',
    to: '/overheads',
    icon: Layers,
    keywords: ['bills', 'recurring', 'fixed', 'utilities', 'rent', 'subscriptions'],
  },
  {
    id: 'daily',
    title: 'Daily Check-Off',
    to: '/daily',
    icon: ArrowLeftRight,
    keywords: ['daily', 'cap', 'spending', 'today', 'checkoff', 'budget'],
  },
  {
    id: 'save-plans',
    title: 'Save Plans',
    to: '/save-plans',
    icon: PiggyBank,
    keywords: ['savings', 'goals', 'reserve', 'target', 'funds'],
  },
  {
    id: 'items',
    title: 'Item Registry',
    to: '/items',
    icon: ClipboardList,
    keywords: ['registry', 'items', 'products', 'inventory', 'assets'],
  },
  {
    id: 'settings',
    title: 'Settings',
    to: '/settings',
    icon: Settings,
    keywords: ['preferences', 'baseline', 'currency', 'profile', 'config'],
  },

  // Reports (Coming soon)
  {
    id: 'report-expense',
    title: 'Monthly Expense Report',
    isComingSoon: true,
    icon: Receipt,
    keywords: ['report', 'monthly', 'expense', 'breakdown', 'cashflow', 'spending'],
  },
  {
    id: 'report-savings',
    title: 'Savings Velocity Report',
    isComingSoon: true,
    icon: TrendingUp,
    keywords: ['report', 'savings', 'velocity', 'projections', 'growth'],
  },
  {
    id: 'report-daily-audit',
    title: 'Daily Cap vs Actuals Report',
    isComingSoon: true,
    icon: Calendar,
    keywords: ['report', 'daily', 'variance', 'audit', 'cap'],
  },
  {
    id: 'report-annual',
    title: 'Annual Financial Report',
    isComingSoon: true,
    icon: Wallet,
    keywords: ['report', 'annual', 'yearly', 'tax', 'summary', 'audit'],
  },
]

interface SearchPaletteOverlayProps {
  onClose: () => void
}

const SearchPaletteOverlay: React.FC<SearchPaletteOverlayProps> = ({ onClose }) => {
  const [query, setQuery] = useState('')
  const [prevQuery, setPrevQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Reset index when query changes
  if (query !== prevQuery) {
    setPrevQuery(query)
    setSelectedIndex(0)
  }

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return []

    return SEARCH_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed)
      const matchPath = item.to?.toLowerCase().includes(trimmed)
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(trimmed))
      return matchTitle || matchPath || matchKeywords
    })
  }, [query])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSelectItem = (item: SearchItem) => {
    if (item.isComingSoon) {
      return
    }
    if (item.to) {
      navigate(item.to)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    if (filteredItems.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        handleSelectItem(selected)
      }
    }
  }

  return (
    <motion.div
      data-testid="search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#111215] flex flex-col items-center justify-start pt-[12vh] sm:pt-[15vh] px-6 pb-6 cursor-pointer"
    >
      {/* Top right X button to close / ESC */}
      <button
        type="button"
        data-testid="search-close-button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close search (ESC)"
        className="absolute top-6 right-6 sm:top-8 sm:right-8 p-2 text-[#777] hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main search container */}
      <div
        className="w-full max-w-2xl sm:max-w-3xl flex flex-col items-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Search Bar from Sidebar */}
        <motion.div
          layoutId="sidebar-search-bar"
          className="w-full relative flex items-center h-[3.25rem] rounded-[1rem] bg-[#1b1b1b] px-4"
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 32,
          }}
        >
          <Search className="w-5 h-5 text-[#6f6f6f] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search routes and reports..."
            className="w-full h-full bg-transparent pl-3 pr-3 text-base text-white placeholder-[#666] outline-none"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="p-1 text-[#777] hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* Suggestions list - ONLY shown when typed */}
        {query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="w-full mt-3 bg-[#181818] rounded-xl overflow-hidden border border-[#222]"
          >
            {filteredItems.length === 0 ? (
              <div className="py-5 px-4 text-center text-sm text-[#777]">
                No results found
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-0.5">
                {filteredItems.map((item, index) => {
                  const isSelected = index === selectedIndex
                  const Icon = item.icon

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-[#252525] text-white'
                          : 'text-[#aaa] hover:bg-[#202020] hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 text-[#777] flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{item.title}</span>
                      </div>
                      {item.isComingSoon ? (
                        <span className="text-xs text-[#666] flex-shrink-0">Coming soon</span>
                      ) : (
                        <span className="text-xs text-[#555] font-mono flex-shrink-0">{item.to}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export const SearchPalette: React.FC = () => {
  const { isOpen, closeSearch, toggleSearch, openSearch } = useSearchStore()

  // Global ESC and Cmd+K / Ctrl+K / '/' listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleSearch()
        return
      }

      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        closeSearch()
        return
      }

      if (
        e.key === '/' &&
        !isOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        openSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openSearch, closeSearch, toggleSearch])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && <SearchPaletteOverlay onClose={closeSearch} />}
    </AnimatePresence>
  )
}

export default SearchPalette

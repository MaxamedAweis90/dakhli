import {
  Home,
  Layers,
  ArrowLeftRight,
  PiggyBank,
  ClipboardList,
  Settings,
} from '@/components/shared/icons'

export interface NavItem {
  name: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', to: '/', icon: Home },
  { name: 'Overheads', to: '/overheads', icon: Layers },
  { name: 'Daily Check-Off', to: '/daily', icon: ArrowLeftRight },
  { name: 'Save Plans', to: '/save-plans', icon: PiggyBank },
  { name: 'Item Registry', to: '/items', icon: ClipboardList },
  { name: 'Settings', to: '/settings', icon: Settings },
]

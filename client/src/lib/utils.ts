import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options?: { maximumFractionDigits?: number; convert?: boolean }
): string {
  const code = (currency in CURRENCY_CONFIGS ? currency : 'USD') as CurrencyCode
  const config = CURRENCY_CONFIGS[code]
  const rate = options?.convert === false ? 1 : (config.rate ?? 1)
  const val = (Number.isFinite(amount) ? amount : 0) * rate
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(val)
  return `${config.symbol}${formatted}`
}


import { create } from 'zustand'

const STORAGE_KEY = 'dakhli_privacy_mode'

/**
 * Calculates a magnitude-proportional bullet string based on the underlying number value.
 * Prevents small $5 figures from looking like large balances or large portfolios from shrinking.
 *
 * Sizing rules:
 * - $0 or 1-9: 3 bullets (•••)
 * - 10 - 99: 4 bullets (••••)
 * - 100 - 999: 4 bullets (••••)
 * - 1,000 - 9,999: 5 bullets (•••••)
 * - 10,000 - 99,999: 6 bullets (••••••)
 * - 100,000 - 999,999: 7 bullets (•••••••)
 * - 1,000,000+: 8 bullets (••••••••)
 */
export function getDynamicBullets(value?: number | string): string {
  if (value === undefined || value === null) return '••••'

  let numVal: number
  if (typeof value === 'number') {
    numVal = Math.abs(value)
  } else {
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
    numVal = isNaN(parsed) ? 0 : Math.abs(parsed)
  }

  if (numVal === 0) return '•••'
  const digits = Math.floor(Math.log10(numVal)) + 1
  const count = Math.max(3, Math.min(8, digits + (digits >= 4 ? (digits >= 7 ? 2 : 1) : 1)))
  return '•'.repeat(count)
}

interface PrivacyState {
  isMasked: boolean
  togglePrivacy: () => void
  setMasked: (val: boolean) => void
}

export const usePrivacyStore = create<PrivacyState>((set) => {
  const initialMasked =
    typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY) === 'true'
      : false

  return {
    isMasked: initialMasked,
    togglePrivacy: () =>
      set((state) => {
        const next = !state.isMasked
        try {
          localStorage.setItem(STORAGE_KEY, String(next))
        } catch {
          // Ignore localStorage errors
        }
        return { isMasked: next }
      }),
    setMasked: (val: boolean) => {
      try {
        localStorage.setItem(STORAGE_KEY, String(val))
      } catch {
        // Ignore localStorage errors
      }
      set({ isMasked: val })
    },
  }
})

export default usePrivacyStore


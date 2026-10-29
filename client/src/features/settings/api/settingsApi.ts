import { api } from '@/lib/api'
import type {
  FinancialBaseline,
  UpdateBaselinePayload,
  CurrencyCode,
} from '../types/settings.types'

const PREFERENCES_STORAGE_KEY = 'dakhli_settings_preferences'

export interface BaselineData {
  grossBalance?: number
  totalSaved?: number
  netSpendableBalance?: number
  baseMonthlyIncome?: number
  monthlyIncome?: number
  paydayAnchor?: number
  paydayAnchorDay?: number
  currency?: string
  updatedAt?: string
}

export interface BaselineApiResponse {
  success: boolean
  data?: BaselineData
}

export const getStoredPreferences = () => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PREFERENCES_STORAGE_KEY) : null
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return {
    overheadAutoGenerate: true,
    defaultDailyCap: 30.0,
    warningThreshold: 80,
    currency: 'USD' as CurrencyCode,
  }
}

export const saveStoredPreferences = (prefs: Partial<{
  overheadAutoGenerate: boolean
  defaultDailyCap: number
  warningThreshold: number
  currency: CurrencyCode
}>) => {
  try {
    const current = getStoredPreferences()
    const updated = { ...current, ...prefs }
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export const settingsApi = {
  getBaseline: async (): Promise<FinancialBaseline> => {
    const storedPrefs = getStoredPreferences()
    const res = (await api.get('/baseline')) as BaselineApiResponse

    const data: BaselineData = res?.data || {}
    const rawCurrency = data.currency || storedPrefs.currency || 'USD'
    const currency = (['USD', 'SOS', 'EUR'].includes(rawCurrency)
      ? rawCurrency
      : 'USD') as CurrencyCode

    return {
      grossBalance: data.grossBalance ?? 0,
      totalSaved: data.totalSaved,
      netSpendableBalance: data.netSpendableBalance,
      monthlyIncome: data.baseMonthlyIncome ?? data.monthlyIncome ?? 0,
      paydayAnchorDay: data.paydayAnchor ?? data.paydayAnchorDay ?? 25,
      currency,
      overheadAutoGenerate: storedPrefs.overheadAutoGenerate ?? true,
      defaultDailyCap: storedPrefs.defaultDailyCap ?? 30.0,
      warningThreshold: storedPrefs.warningThreshold ?? 80,
      updatedAt: data.updatedAt,
    }
  },

  updateBaseline: async (payload: UpdateBaselinePayload): Promise<FinancialBaseline> => {
    // 1. Persist local UI preferences
    saveStoredPreferences({
      ...(payload.overheadAutoGenerate !== undefined && {
        overheadAutoGenerate: payload.overheadAutoGenerate,
      }),
      ...(payload.defaultDailyCap !== undefined && {
        defaultDailyCap: payload.defaultDailyCap,
      }),
      ...(payload.warningThreshold !== undefined && {
        warningThreshold: payload.warningThreshold,
      }),
      ...(payload.currency !== undefined && { currency: payload.currency }),
    })

    // 2. Persist financial baseline to backend API
    const res = (await api.put('/baseline', {
      ...(payload.grossBalance !== undefined && { grossBalance: payload.grossBalance }),
      ...(payload.monthlyIncome !== undefined && {
        baseMonthlyIncome: payload.monthlyIncome,
        monthlyIncome: payload.monthlyIncome,
      }),
      ...(payload.paydayAnchorDay !== undefined && {
        paydayAnchor: payload.paydayAnchorDay,
        paydayAnchorDay: payload.paydayAnchorDay,
      }),
      ...(payload.currency !== undefined && { currency: payload.currency }),
    })) as BaselineApiResponse

    const data: BaselineData = res?.data || {}
    const currentPrefs = getStoredPreferences()
    const rawCurrency = data.currency || payload.currency || currentPrefs.currency || 'USD'
    const currency = (['USD', 'SOS', 'EUR'].includes(rawCurrency)
      ? rawCurrency
      : 'USD') as CurrencyCode

    return {
      grossBalance: data.grossBalance ?? payload.grossBalance ?? 0,
      monthlyIncome:
        data.baseMonthlyIncome ?? data.monthlyIncome ?? payload.monthlyIncome ?? 0,
      paydayAnchorDay:
        data.paydayAnchor ?? data.paydayAnchorDay ?? payload.paydayAnchorDay ?? 25,
      currency,
      overheadAutoGenerate: currentPrefs.overheadAutoGenerate ?? true,
      defaultDailyCap: currentPrefs.defaultDailyCap ?? 30.0,
      warningThreshold: currentPrefs.warningThreshold ?? 80,
      updatedAt: data.updatedAt,
    }
  },
}

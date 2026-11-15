import { api } from '@/lib/api'
import type {
  FinancialBaseline,
  UpdateBaselinePayload,
  CurrencyCode,
  UserPreferences,
  UpdatePreferencesPayload,
} from '../types/settings.types'

export const PREFERENCES_STORAGE_KEY = 'dakhli_settings_preferences'

export interface BaselineData {
  grossBalance?: number
  totalSaved?: number
  netSpendableBalance?: number
  baseMonthlyIncome?: number
  monthlyIncome?: number
  paydayAnchor?: number
  paydayAnchorDay?: number
  currency?: string
  overheadAutoGenerate?: boolean
  defaultDailyCap?: number
  warningThreshold?: number
  updatedAt?: string
}

export interface BaselineApiResponse {
  success: boolean
  data?: BaselineData
}

export interface StoredPreferences {
  overheadAutoGenerate: boolean
  defaultDailyCap: number
  warningThreshold: number
  currency: CurrencyCode
  maskBalancesOnStartup: boolean
  compactLedgerDensity: boolean
  carryOverDailySurplus: boolean
}

const DEFAULT_STORED_PREFERENCES: StoredPreferences = {
  overheadAutoGenerate: true,
  defaultDailyCap: 30.0,
  warningThreshold: 80,
  currency: 'USD',
  maskBalancesOnStartup: false,
  compactLedgerDensity: false,
  carryOverDailySurplus: false,
}

export const getStoredPreferences = (): StoredPreferences => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PREFERENCES_STORAGE_KEY) : null
    if (raw) {
      return {
        ...DEFAULT_STORED_PREFERENCES,
        ...JSON.parse(raw),
      }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_STORED_PREFERENCES }
}

export const saveStoredPreferences = (prefs: Partial<StoredPreferences>) => {
  try {
    const current = getStoredPreferences()
    const updated = { ...current, ...prefs }
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

const normalizeCurrency = (rawCurrency?: string): CurrencyCode => {
  return (['USD', 'SOS', 'EUR'].includes(rawCurrency || '')
    ? rawCurrency
    : 'USD') as CurrencyCode
}

export const settingsApi = {
  getBaseline: async (): Promise<FinancialBaseline> => {
    const storedPrefs = getStoredPreferences()
    const res = (await api.get('/baseline')) as BaselineApiResponse

    const data: BaselineData = res?.data || {}
    const currency = normalizeCurrency(data.currency || storedPrefs.currency)

    return {
      grossBalance: data.grossBalance ?? 0,
      totalSaved: data.totalSaved,
      netSpendableBalance: data.netSpendableBalance,
      monthlyIncome: data.baseMonthlyIncome ?? data.monthlyIncome ?? 0,
      paydayAnchorDay: data.paydayAnchor ?? data.paydayAnchorDay ?? 25,
      currency,
      overheadAutoGenerate: data.overheadAutoGenerate ?? storedPrefs.overheadAutoGenerate ?? true,
      defaultDailyCap: data.defaultDailyCap ?? storedPrefs.defaultDailyCap ?? 30.0,
      warningThreshold: data.warningThreshold ?? storedPrefs.warningThreshold ?? 80,
      updatedAt: data.updatedAt,
    }
  },

  updateBaseline: async (payload: UpdateBaselinePayload): Promise<FinancialBaseline> => {
    // 1. Sync local storage copy
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

    // 2. Persist financial baseline & cycle rules to backend API
    const res = (await api.patch('/baseline', {
      ...(payload.grossBalance !== undefined && { grossBalance: payload.grossBalance }),
      ...(payload.monthlyIncome !== undefined && {
        baseMonthlyIncome: payload.monthlyIncome,
        monthlyIncome: payload.monthlyIncome,
      }),
      ...(payload.paydayAnchorDay !== undefined && {
        paydayAnchor: payload.paydayAnchorDay,
        paydayAnchorDay: payload.paydayAnchorDay,
      }),
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
    })) as BaselineApiResponse

    const data: BaselineData = res?.data || {}
    const currentPrefs = getStoredPreferences()
    const currency = normalizeCurrency(data.currency || payload.currency || currentPrefs.currency)

    return {
      grossBalance: data.grossBalance ?? payload.grossBalance ?? 0,
      monthlyIncome:
        data.baseMonthlyIncome ?? data.monthlyIncome ?? payload.monthlyIncome ?? 0,
      paydayAnchorDay:
        data.paydayAnchor ?? data.paydayAnchorDay ?? payload.paydayAnchorDay ?? 25,
      currency,
      overheadAutoGenerate:
        data.overheadAutoGenerate ?? payload.overheadAutoGenerate ?? currentPrefs.overheadAutoGenerate ?? true,
      defaultDailyCap:
        data.defaultDailyCap ?? payload.defaultDailyCap ?? currentPrefs.defaultDailyCap ?? 30.0,
      warningThreshold:
        data.warningThreshold ?? payload.warningThreshold ?? currentPrefs.warningThreshold ?? 80,
      updatedAt: data.updatedAt,
    }
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const storedPrefs = getStoredPreferences()
    try {
      const res = (await api.get('/users/preferences')) as {
        success: boolean
        data?: Partial<UserPreferences>
      }
      const data = res?.data || {}
      const normalized: UserPreferences = {
        currency: normalizeCurrency(data.currency || storedPrefs.currency),
        maskBalancesOnStartup:
          data.maskBalancesOnStartup ?? storedPrefs.maskBalancesOnStartup ?? false,
        compactLedgerDensity:
          data.compactLedgerDensity ?? storedPrefs.compactLedgerDensity ?? false,
        carryOverDailySurplus:
          data.carryOverDailySurplus ?? storedPrefs.carryOverDailySurplus ?? false,
      }
      saveStoredPreferences(normalized)
      return normalized
    } catch {
      return {
        currency: normalizeCurrency(storedPrefs.currency),
        maskBalancesOnStartup: Boolean(storedPrefs.maskBalancesOnStartup),
        compactLedgerDensity: Boolean(storedPrefs.compactLedgerDensity),
        carryOverDailySurplus: Boolean(storedPrefs.carryOverDailySurplus),
      }
    }
  },

  updatePreferences: async (payload: UpdatePreferencesPayload): Promise<UserPreferences> => {
    saveStoredPreferences(payload)

    const res = (await api.patch('/users/preferences', payload)) as {
      success: boolean
      data?: Partial<UserPreferences>
    }
    const data = res?.data || {}
    const currentPrefs = getStoredPreferences()

    const normalized: UserPreferences = {
      currency: normalizeCurrency(data.currency || payload.currency || currentPrefs.currency),
      maskBalancesOnStartup:
        data.maskBalancesOnStartup ?? payload.maskBalancesOnStartup ?? currentPrefs.maskBalancesOnStartup,
      compactLedgerDensity:
        data.compactLedgerDensity ?? payload.compactLedgerDensity ?? currentPrefs.compactLedgerDensity,
      carryOverDailySurplus:
        data.carryOverDailySurplus ?? payload.carryOverDailySurplus ?? currentPrefs.carryOverDailySurplus,
    }
    saveStoredPreferences(normalized)
    return normalized
  },

  exportFinancialArchive: async (): Promise<Record<string, unknown>> => {
    try {
      const res = (await api.get('/users/export')) as {
        success: boolean
        data?: Record<string, unknown>
      }
      if (res?.data) {
        return res.data
      }
    } catch {
      // Fallback aggregation if backend archive endpoint is unreachable
    }

    const [baseline, overheads, dailyLogs, savePlans, items] = await Promise.allSettled([
      api.get('/baseline'),
      api.get('/overheads'),
      api.get('/daily/logs'),
      api.get('/save-plans'),
      api.get('/items'),
    ])

    const unwrap = (result: PromiseSettledResult<unknown>) =>
      result.status === 'fulfilled' ? (result.value as { data?: unknown })?.data ?? result.value : null

    return {
      exportedAt: new Date().toISOString(),
      baseline: unwrap(baseline),
      preferences: getStoredPreferences(),
      overheadBills: unwrap(overheads),
      dailyLogs: unwrap(dailyLogs),
      savePlans: unwrap(savePlans),
      registeredItems: unwrap(items),
    }
  },
}

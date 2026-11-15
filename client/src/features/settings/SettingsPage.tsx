import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Check, ChevronDown, Loader2, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/primitives/ConfirmDialog'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { useSettingsUiStore } from '@/stores/settingsUiStore'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/types/api'
import { settingsApi, saveStoredPreferences } from './api/settingsApi'
import { useBaseline, useUserPreferences } from './hooks/useBaseline'
import type { CurrencyCode, UserPreferences } from './types/settings.types'

interface FinanceFormState {
  grossBalance: number
  baseMonthlyIncome: number
  paydayAnchor: number
  autoGenerateOverhead: boolean
  defaultDailyCap: number
  warningThreshold: number
}

const DEFAULT_FINANCE_STATE: FinanceFormState = {
  grossBalance: 0,
  baseMonthlyIncome: 0,
  paydayAnchor: 1,
  autoGenerateOverhead: true,
  defaultDailyCap: 30.0,
  warningThreshold: 80,
}

const DEFAULT_PREFERENCES_STATE: UserPreferences = {
  currency: 'USD',
  maskBalancesOnStartup: false,
  compactLedgerDensity: false,
  carryOverDailySurplus: false,
}

const CURRENCY_OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'SOS', label: 'SOS (Sh.So.)' },
  { code: 'EUR', label: 'EUR (€)' },
]

const formatAmount = (num: number): string =>
  num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const getDayWithSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

const resolveCurrencySymbol = (currency: CurrencyCode): string => {
  switch (currency) {
    case 'SOS':
      return 'Sh.So.'
    case 'EUR':
      return '€'
    default:
      return '$'
  }
}

interface TactileSwitchProps {
  checked: boolean
  onChange: () => void
  ariaLabel: string
  testId?: string
}

const TactileSwitch: React.FC<TactileSwitchProps> = ({
  checked,
  onChange,
  ariaLabel,
  testId,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    data-testid={testId}
    onClick={onChange}
    className={cn(
      'w-[3.1rem] h-[1.75rem] rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative flex-shrink-0 flex items-center',
      checked ? 'bg-[#F5C469]' : 'bg-[#2A2D37]'
    )}
  >
    <span
      className={cn(
        'w-[1.45rem] h-[1.45rem] rounded-full bg-white flex items-center justify-center shadow-md transform transition-transform duration-200 ease-in-out',
        checked ? 'translate-x-[1.35rem]' : 'translate-x-0'
      )}
    >
      {checked && <Check className="w-3 h-3 text-[#0D0E12] stroke-[3]" />}
    </span>
  </button>
)

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { clearSession } = useAuthStore()
  const { grossBalance, totalSaved, currency: storeCurrency, setLiquidity, setCurrency } =
    useLiquidityStore()
  const { baseline, updateBaseline, isUpdating: isUpdatingBaseline } = useBaseline()
  const {
    preferences,
    updatePreferences,
    isUpdating: isUpdatingPreferences,
  } = useUserPreferences()

  const {
    activeTab,
    setActiveTab,
    setFinanceDirty,
    setPreferencesDirty,
    setIsSaving,
  } = useSettingsUiStore()

  // ---------------- Finance Baseline Form State ----------------
  const [initialFinance, setInitialFinance] = useState<FinanceFormState>(() => ({
    ...DEFAULT_FINANCE_STATE,
    grossBalance: grossBalance ?? 0,
  }))
  const [financeForm, setFinanceForm] = useState<FinanceFormState>(initialFinance)

  const [grossInput, setGrossInput] = useState(formatAmount(initialFinance.grossBalance))
  const [incomeInput, setIncomeInput] = useState(formatAmount(initialFinance.baseMonthlyIncome))
  const [dailyCapInput, setDailyCapInput] = useState(formatAmount(initialFinance.defaultDailyCap))

  // ---------------- Preferences Form State ----------------
  const [initialPrefs, setInitialPrefs] = useState<UserPreferences>(() => ({
    ...DEFAULT_PREFERENCES_STATE,
    currency: (['USD', 'SOS', 'EUR'].includes(storeCurrency)
      ? storeCurrency
      : 'USD') as CurrencyCode,
  }))
  const [prefsForm, setPrefsForm] = useState<UserPreferences>(initialPrefs)

  // ---------------- Toast, Export & Deactivate Modal State ----------------
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const toastTimerRef = useRef<number | null>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
  const [deactivateConfirmation, setDeactivateConfirmation] = useState('')
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastVariant(variant)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Cleanup shared store flags on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
      setFinanceDirty(false)
      setPreferencesDirty(false)
      setIsSaving(false)
    }
  }, [setFinanceDirty, setPreferencesDirty, setIsSaving])

  // Hydrate Finance Baseline state when backend baseline resolves
  useEffect(() => {
    if (baseline) {
      const loaded: FinanceFormState = {
        grossBalance: baseline.grossBalance,
        baseMonthlyIncome: baseline.monthlyIncome,
        paydayAnchor: baseline.paydayAnchorDay,
        autoGenerateOverhead: baseline.overheadAutoGenerate,
        defaultDailyCap: baseline.defaultDailyCap,
        warningThreshold: baseline.warningThreshold ?? 80,
      }
      setInitialFinance(loaded)
      setFinanceForm(loaded)
      setGrossInput(formatAmount(loaded.grossBalance))
      setIncomeInput(formatAmount(loaded.baseMonthlyIncome))
      setDailyCapInput(formatAmount(loaded.defaultDailyCap))
    }
  }, [baseline])

  // Hydrate Preferences state when backend preferences resolve
  useEffect(() => {
    if (preferences) {
      const loaded: UserPreferences = {
        currency: preferences.currency,
        maskBalancesOnStartup: preferences.maskBalancesOnStartup,
        compactLedgerDensity: preferences.compactLedgerDensity,
        carryOverDailySurplus: preferences.carryOverDailySurplus,
      }
      setInitialPrefs(loaded)
      setPrefsForm(loaded)
    }
  }, [preferences])

  // Track dirty state per tab
  const isFinanceDirty = useMemo(
    () =>
      financeForm.grossBalance !== initialFinance.grossBalance ||
      financeForm.baseMonthlyIncome !== initialFinance.baseMonthlyIncome ||
      financeForm.paydayAnchor !== initialFinance.paydayAnchor ||
      financeForm.autoGenerateOverhead !== initialFinance.autoGenerateOverhead ||
      financeForm.defaultDailyCap !== initialFinance.defaultDailyCap ||
      financeForm.warningThreshold !== initialFinance.warningThreshold,
    [financeForm, initialFinance]
  )

  const isPreferencesDirty = useMemo(
    () =>
      prefsForm.currency !== initialPrefs.currency ||
      prefsForm.maskBalancesOnStartup !== initialPrefs.maskBalancesOnStartup ||
      prefsForm.compactLedgerDensity !== initialPrefs.compactLedgerDensity ||
      prefsForm.carryOverDailySurplus !== initialPrefs.carryOverDailySurplus,
    [prefsForm, initialPrefs]
  )

  useEffect(() => {
    setFinanceDirty(isFinanceDirty)
  }, [isFinanceDirty, setFinanceDirty])

  useEffect(() => {
    setPreferencesDirty(isPreferencesDirty)
  }, [isPreferencesDirty, setPreferencesDirty])

  useEffect(() => {
    setIsSaving(isUpdatingBaseline || isUpdatingPreferences)
  }, [isUpdatingBaseline, isUpdatingPreferences, setIsSaving])

  const isAnyDirty = isFinanceDirty || isPreferencesDirty

  // React Router navigation blocker for unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isAnyDirty && currentLocation.pathname !== nextLocation.pathname
  )

  // Native beforeunload listener for browser close/refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAnyDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAnyDirty])

  const currencySymbol = useMemo(
    () => resolveCurrencySymbol(prefsForm.currency),
    [prefsForm.currency]
  )

  // Save Tab 1: Finance Baseline
  const handleSaveBaseline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isFinanceDirty || isUpdatingBaseline) return

    try {
      await updateBaseline({
        grossBalance: financeForm.grossBalance,
        monthlyIncome: financeForm.baseMonthlyIncome,
        paydayAnchorDay: financeForm.paydayAnchor,
        overheadAutoGenerate: financeForm.autoGenerateOverhead,
        defaultDailyCap: financeForm.defaultDailyCap,
        warningThreshold: financeForm.warningThreshold,
      })

      setInitialFinance({ ...financeForm })
      showToast('Baseline updated', 'success')
    } catch {
      saveStoredPreferences({
        overheadAutoGenerate: financeForm.autoGenerateOverhead,
        defaultDailyCap: financeForm.defaultDailyCap,
        warningThreshold: financeForm.warningThreshold,
      })
      setLiquidity({
        grossBalance: financeForm.grossBalance,
        totalSaved: totalSaved || 0,
        currency: prefsForm.currency,
      })
      setInitialFinance({ ...financeForm })
      showToast('Baseline updated', 'success')
    }
  }

  // Save Tab 2: Preferences
  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isPreferencesDirty || isUpdatingPreferences) return

    try {
      await updatePreferences({
        currency: prefsForm.currency,
        maskBalancesOnStartup: prefsForm.maskBalancesOnStartup,
        compactLedgerDensity: prefsForm.compactLedgerDensity,
        carryOverDailySurplus: prefsForm.carryOverDailySurplus,
      })

      setInitialPrefs({ ...prefsForm })
      showToast('Preferences saved', 'success')
    } catch {
      saveStoredPreferences({
        currency: prefsForm.currency,
        maskBalancesOnStartup: prefsForm.maskBalancesOnStartup,
        compactLedgerDensity: prefsForm.compactLedgerDensity,
        carryOverDailySurplus: prefsForm.carryOverDailySurplus,
      })
      setCurrency(prefsForm.currency)
      setInitialPrefs({ ...prefsForm })
      showToast('Preferences saved', 'success')
    }
  }

  // Finance Input Handlers
  const handleGrossChange = (val: string) => {
    setGrossInput(val)
    const cleanNum = parseFloat(val.replace(/[^0-9.]/g, ''))
    if (!isNaN(cleanNum)) {
      setFinanceForm((prev) => ({ ...prev, grossBalance: cleanNum }))
    }
  }
  const handleGrossBlur = () => {
    setGrossInput(formatAmount(financeForm.grossBalance))
  }

  const handleIncomeChange = (val: string) => {
    setIncomeInput(val)
    const cleanNum = parseFloat(val.replace(/[^0-9.]/g, ''))
    if (!isNaN(cleanNum)) {
      setFinanceForm((prev) => ({ ...prev, baseMonthlyIncome: cleanNum }))
    }
  }
  const handleIncomeBlur = () => {
    setIncomeInput(formatAmount(financeForm.baseMonthlyIncome))
  }

  const handleDailyCapChange = (val: string) => {
    setDailyCapInput(val)
    const cleanNum = parseFloat(val.replace(/[^0-9.]/g, ''))
    if (!isNaN(cleanNum)) {
      setFinanceForm((prev) => ({ ...prev, defaultDailyCap: cleanNum }))
    }
  }
  const handleDailyCapBlur = () => {
    setDailyCapInput(formatAmount(financeForm.defaultDailyCap))
  }

  // Export JSON Snapshot
  const handleExportJson = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const archive = await settingsApi.exportFinancialArchive()
      const jsonString = JSON.stringify(archive, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const dateStr = new Date().toISOString().slice(0, 10)

      const link = document.createElement('a')
      link.href = url
      link.download = `dakhli-financial-archive-${dateStr}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast('Financial archive exported', 'success')
    } catch {
      showToast('Failed to export financial archive', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // Execute 60-Day Account Soft-Deactivation
  const handleExecuteDeactivate = async () => {
    if (deactivateConfirmation !== 'DEACTIVATE') return

    setIsDeactivating(true)
    setDeactivateError(null)

    try {
      await authApi.deactivateAccount()
      setIsDeactivateModalOpen(false)
      setFinanceDirty(false)
      setPreferencesDirty(false)
      clearSession()
      navigate('/login', {
        replace: true,
        state: {
          deactivatedNotice:
            'Your account has been deactivated. You can restore your data anytime within the 60-day grace period.',
        },
      })
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setDeactivateError(apiErr?.message || 'Failed to deactivate account.')
      setIsDeactivating(false)
    }
  }

  return (
    <div className="flex flex-col pb-12 select-none">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-7 border-b border-white/[0.05] -mt-2 lg:-mt-3 mb-6 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          data-testid="tab-finance-baseline"
          className={cn(
            'pb-3 text-[0.875rem] font-medium transition-colors relative cursor-pointer',
            activeTab === 'finance' ? 'text-white' : 'text-[#7e8088] hover:text-white'
          )}
        >
          Finance Baseline
          {activeTab === 'finance' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F5C469] rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          data-testid="tab-preferences"
          className={cn(
            'pb-3 text-[0.875rem] font-medium transition-colors relative cursor-pointer',
            activeTab === 'preferences' ? 'text-white' : 'text-[#7e8088] hover:text-white'
          )}
        >
          Preferences
          {activeTab === 'preferences' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F5C469] rounded-full" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: FINANCE BASELINE ================= */}
      {activeTab === 'finance' && (
        <form
          id="settings-baseline-form"
          onSubmit={handleSaveBaseline}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
        >
          {/* Left Card: Financial Baseline */}
          <div className="bg-[#13151B] border border-white/[0.05] rounded-2xl p-6 lg:p-7 flex flex-col justify-between">
            <div>
              <h2 className="text-[1.125rem] font-semibold text-white tracking-tight mb-6">
                Financial Baseline
              </h2>

              <div className="flex flex-col gap-5">
                {/* Starting Gross Balance */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.825rem] text-slate-300 font-medium">
                    Starting Gross Balance
                  </label>
                  <div className="bg-[#1A1D26] border border-white/[0.06] focus-within:border-[#F5C469]/50 rounded-xl h-[3.4rem] px-4 flex items-center gap-3 transition-colors">
                    <span className="text-slate-400 text-sm font-mono leading-none shrink-0">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      value={grossInput}
                      onChange={(e) => handleGrossChange(e.target.value)}
                      onBlur={handleGrossBlur}
                      placeholder="0.00"
                      className="w-full bg-transparent text-[1.35rem] font-semibold font-mono text-white tracking-tight tabular-nums outline-none"
                    />
                  </div>
                </div>

                {/* Base Monthly Income */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.825rem] text-slate-300 font-medium">
                    Base Monthly Income
                  </label>
                  <div className="bg-[#1A1D26] border border-white/[0.06] focus-within:border-[#F5C469]/50 rounded-xl h-[3.4rem] px-4 flex items-center gap-3 transition-colors">
                    <span className="text-slate-400 text-sm font-mono leading-none shrink-0">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      value={incomeInput}
                      onChange={(e) => handleIncomeChange(e.target.value)}
                      onBlur={handleIncomeBlur}
                      placeholder="0.00"
                      className="w-full bg-transparent text-[1.35rem] font-semibold font-mono text-white tracking-tight tabular-nums outline-none"
                    />
                  </div>
                </div>

                {/* Payday Anchor Day (1st - 31st) */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="payday-anchor-select"
                    className="text-[0.825rem] text-slate-300 font-medium"
                  >
                    Payday Anchor Day
                  </label>
                  <div className="flex items-center gap-3.5">
                    <div className="relative bg-[#1A1D26] border border-white/[0.06] focus-within:border-[#F5C469]/50 rounded-xl h-[2.85rem] min-w-[5.75rem] flex items-center transition-colors">
                      <select
                        id="payday-anchor-select"
                        value={financeForm.paydayAnchor}
                        onChange={(e) =>
                          setFinanceForm((prev) => ({
                            ...prev,
                            paydayAnchor: Number(e.target.value),
                          }))
                        }
                        className="w-full h-full bg-transparent pl-3.5 pr-8 text-[0.95rem] font-mono tabular-nums font-semibold text-white outline-none appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day} className="bg-[#13151B] text-white">
                            {getDayWithSuffix(day)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" />
                    </div>
                    <span className="text-slate-400 text-[0.85rem] font-normal">
                      of the month
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Cycle Rules & Thresholds */}
          <div className="bg-[#13151B] border border-white/[0.05] rounded-2xl p-6 lg:p-7 flex flex-col justify-between">
            <div>
              <h2 className="text-[1.125rem] font-semibold text-white tracking-tight mb-6">
                Cycle Rules &amp; Thresholds
              </h2>

              <div className="flex flex-col gap-6">
                {/* Auto-generate toggle */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[0.85rem] text-slate-200 leading-snug max-w-[300px]">
                    Auto-generate monthly overhead records on payday anchor
                  </span>
                  <TactileSwitch
                    checked={financeForm.autoGenerateOverhead}
                    ariaLabel="Auto-generate monthly overhead records on payday anchor"
                    onChange={() =>
                      setFinanceForm((prev) => ({
                        ...prev,
                        autoGenerateOverhead: !prev.autoGenerateOverhead,
                      }))
                    }
                  />
                </div>

                {/* Default Daily Cap */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.825rem] text-slate-300 font-medium">
                    Default Daily Cap
                  </label>
                  <div className="bg-[#1A1D26] border border-white/[0.06] focus-within:border-[#F5C469]/50 rounded-xl h-[3.4rem] px-4 flex items-center gap-3 transition-colors">
                    <span className="text-slate-400 text-sm font-mono leading-none shrink-0">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      value={dailyCapInput}
                      onChange={(e) => handleDailyCapChange(e.target.value)}
                      onBlur={handleDailyCapBlur}
                      placeholder="30.00"
                      className="w-full bg-transparent text-[1.35rem] font-semibold font-mono text-white tracking-tight tabular-nums outline-none"
                    />
                  </div>
                </div>

                {/* Over-budget warning threshold */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="warning-threshold-range"
                      className="text-[0.825rem] text-slate-300 font-medium"
                    >
                      Over-budget warning threshold
                    </label>
                    <span className="text-xs font-mono tabular-nums tracking-tight text-slate-300">
                      {financeForm.warningThreshold}%
                    </span>
                  </div>
                  <div className="relative py-3 flex items-center">
                    <input
                      id="warning-threshold-range"
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={financeForm.warningThreshold}
                      onChange={(e) =>
                        setFinanceForm((prev) => ({
                          ...prev,
                          warningThreshold: Number(e.target.value),
                        }))
                      }
                      className="w-full h-1.5 bg-[#2A2D37] rounded-lg appearance-none cursor-pointer accent-[#F5C469]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= TAB 2: PREFERENCES ================= */}
      {activeTab === 'preferences' && (
        <form
          id="settings-preferences-form"
          onSubmit={handleSavePreferences}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
        >
          {/* Left Card: Localization & Interface */}
          <div className="bg-[#13151B] border border-white/[0.05] rounded-2xl p-6 lg:p-7 flex flex-col justify-between">
            <div>
              <h2 className="text-[1.125rem] font-semibold text-white tracking-tight mb-6">
                Localization &amp; Interface
              </h2>

              <div className="flex flex-col gap-6">
                {/* Primary Display Currency */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-[0.825rem] text-slate-300 font-medium">
                    Primary Display Currency
                  </label>
                  <div
                    role="radiogroup"
                    aria-label="Primary Display Currency"
                    className="grid grid-cols-3 bg-[#1A1D26] border border-white/[0.06] p-1 rounded-xl gap-1"
                  >
                    {CURRENCY_OPTIONS.map((option) => {
                      const isSelected = prefsForm.currency === option.code
                      return (
                        <button
                          key={option.code}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() =>
                            setPrefsForm((prev) => ({ ...prev, currency: option.code }))
                          }
                          className={cn(
                            'py-2 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-mono whitespace-nowrap transition-colors cursor-pointer flex items-center justify-center',
                            isSelected
                              ? 'bg-[#252936] text-white font-semibold'
                              : 'text-slate-400 hover:text-slate-200'
                          )}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Privacy Shroud Default */}
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/[0.04]">
                  <div className="flex flex-col gap-0.5 pr-2">
                    <span className="text-[0.85rem] text-white font-medium">
                      Privacy Shroud Default
                    </span>
                    <span className="text-xs text-slate-400 leading-snug">
                      Mask financial figures automatically on startup
                    </span>
                  </div>
                  <TactileSwitch
                    checked={prefsForm.maskBalancesOnStartup}
                    ariaLabel="Mask financial figures automatically on startup"
                    onChange={() =>
                      setPrefsForm((prev) => ({
                        ...prev,
                        maskBalancesOnStartup: !prev.maskBalancesOnStartup,
                      }))
                    }
                  />
                </div>

                {/* Compact Ledger Density */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.04]">
                  <div className="flex flex-col gap-0.5 pr-2">
                    <span className="text-[0.85rem] text-white font-medium">
                      Compact Ledger Density
                    </span>
                    <span className="text-xs text-slate-400 leading-snug">
                      Use compact row spacing in Overhead &amp; Daily tables
                    </span>
                  </div>
                  <TactileSwitch
                    checked={prefsForm.compactLedgerDensity}
                    ariaLabel="Use compact row spacing in Overhead and Daily tables"
                    onChange={() =>
                      setPrefsForm((prev) => ({
                        ...prev,
                        compactLedgerDensity: !prev.compactLedgerDensity,
                      }))
                    }
                  />
                </div>

                {/* Cycle Roll-Over Behavior */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.04]">
                  <div className="flex flex-col gap-0.5 pr-2">
                    <span className="text-[0.85rem] text-white font-medium">
                      Cycle Roll-Over Behavior
                    </span>
                    <span className="text-xs text-slate-400 leading-snug">
                      Carry unspent daily cap surplus into next day&apos;s limit
                    </span>
                  </div>
                  <TactileSwitch
                    checked={prefsForm.carryOverDailySurplus}
                    ariaLabel="Carry unspent daily cap surplus into next day's limit"
                    onChange={() =>
                      setPrefsForm((prev) => ({
                        ...prev,
                        carryOverDailySurplus: !prev.carryOverDailySurplus,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Data Portability & Account Lifecycle */}
          <div className="bg-[#13151B] border border-white/[0.05] rounded-2xl p-6 lg:p-7 flex flex-col justify-between">
            <div>
              <h2 className="text-[1.125rem] font-semibold text-white tracking-tight mb-6">
                Data Portability &amp; Account Lifecycle
              </h2>

              {/* Local Ledger Backup (Non-Destructive) */}
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Export Financial Archive
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Download a complete JSON snapshot of your baseline, overhead bills, daily logs, and save plans.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={isExporting}
                    className="bg-[#1A1D26] border border-white/10 hover:border-white/20 text-xs font-mono text-slate-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <span>Export JSON</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/5 my-5" />

              {/* 60-Day Account Soft-Delete & Restoration */}
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-medium text-rose-400">
                    Deactivate Account (60-Day Grace Period)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Temporarily freeze your account for up to 60 days. All recurring overhead bills and baseline savings deductions pause automatically. Log back in anytime within 60 days to restore everything intact.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeactivateConfirmation('')
                      setDeactivateError(null)
                      setIsDeactivateModalOpen(true)
                    }}
                    className="border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-mono text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Minimal Bottom-Right Slate Toast */}
      {toastMessage && (
        <div
          role="status"
          data-testid="settings-toast"
          className="fixed bottom-6 right-6 z-50 bg-[#1A1D26] border border-white/10 text-slate-200 px-4 py-3 rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              toastVariant === 'error' ? 'bg-rose-400' : 'bg-emerald-400'
            )}
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unsaved Changes Navigation Blocker Confirmation Dialog */}
      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Unsaved Changes"
        message="You have unsaved changes in your settings. Leaving this page will discard all edits made here. Are you sure you want to discard them?"
        confirmText="Discard & Leave"
        cancelText="Stay on Page"
        variant="warning"
      />

      {/* 60-Day Soft Account Deactivation Typed Confirmation Modal */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1D26] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsDeactivateModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-rose-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <h3 className="text-sm font-semibold font-mono tracking-wide">
                Confirm Account Deactivation
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This will immediately log you out and freeze your account for up to 60 days before permanent deletion. To proceed, type{' '}
              <strong className="text-rose-400 font-mono">DEACTIVATE</strong> below.
            </p>

            {deactivateError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{deactivateError}</span>
              </div>
            )}

            <div className="space-y-1.5 mb-5">
              <input
                type="text"
                autoFocus
                value={deactivateConfirmation}
                onChange={(e) => setDeactivateConfirmation(e.target.value)}
                placeholder="Type DEACTIVATE"
                className="w-full bg-[#13151B] border border-rose-500/30 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-slate-600 outline-none focus:border-rose-500/60 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                disabled={isDeactivating}
                className="px-3.5 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeactivate}
                disabled={deactivateConfirmation !== 'DEACTIVATE' || isDeactivating}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-mono text-xs rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <span>Confirm Deactivation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage

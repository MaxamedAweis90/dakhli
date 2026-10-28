import React, { useState, useEffect, useMemo } from 'react'
import { useBlocker } from 'react-router-dom'
import { ConfirmDialog } from '@/components/primitives/ConfirmDialog'
import { Check, RefreshCw } from '@/components/shared/icons'
import { useLiquidityStore } from '@/stores/liquidityStore'
import { queryClient } from '@/lib/query-client'
import { cn } from '@/lib/utils'
import type { CurrencyCode } from './types/settings.types'
import { useBaseline } from './hooks/useBaseline'

interface SettingsFormState {
  grossBalance: number
  baseMonthlyIncome: number
  paydayAnchor: number
  currency: CurrencyCode
  autoGenerateOverhead: boolean
  defaultDailyCap: number
  warningThreshold: number
}

const DEFAULT_INITIAL_STATE: SettingsFormState = {
  grossBalance: 260375.03,
  baseMonthlyIncome: 8385.0,
  paydayAnchor: 25,
  currency: 'USD',
  autoGenerateOverhead: true,
  defaultDailyCap: 30.0,
  warningThreshold: 80,
}

// Helper to format currency numbers with commas and two decimals
const formatAmount = (num: number): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Helper to format payday day suffix (1st, 2nd, 3rd, 25th)
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

export const SettingsPage: React.FC = () => {
  const { grossBalance, totalSaved, setLiquidity, setCurrency } = useLiquidityStore()
  const { baseline, updateBaseline, isUpdating } = useBaseline()

  // Baseline data state
  const [initialState, setInitialState] = useState<SettingsFormState>(() => {
    return {
      ...DEFAULT_INITIAL_STATE,
      grossBalance: grossBalance || DEFAULT_INITIAL_STATE.grossBalance,
    }
  })

  // Form field state
  const [formState, setFormState] = useState<SettingsFormState>(initialState)
  const [activeTab, setActiveTab] = useState<'finance' | 'preferences'>('finance')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  // Local text input buffers for smooth typing
  const [grossInput, setGrossInput] = useState(formatAmount(initialState.grossBalance))
  const [incomeInput, setIncomeInput] = useState(formatAmount(initialState.baseMonthlyIncome))
  const [paydayInput, setPaydayInput] = useState(getDayWithSuffix(initialState.paydayAnchor))
  const [dailyCapInput, setDailyCapInput] = useState(formatAmount(initialState.defaultDailyCap))

  // Fetch live baseline from backend on mount
  useEffect(() => {
    if (baseline) {
      const loaded: SettingsFormState = {
        grossBalance: baseline.grossBalance,
        baseMonthlyIncome: baseline.monthlyIncome,
        paydayAnchor: baseline.paydayAnchorDay,
        currency: baseline.currency,
        autoGenerateOverhead: baseline.overheadAutoGenerate,
        defaultDailyCap: baseline.defaultDailyCap,
        warningThreshold: baseline.warningThreshold ?? 80,
      }
      setInitialState(loaded)
      setFormState(loaded)
      setGrossInput(formatAmount(loaded.grossBalance))
      setIncomeInput(formatAmount(loaded.baseMonthlyIncome))
      setPaydayInput(getDayWithSuffix(loaded.paydayAnchor))
      setDailyCapInput(formatAmount(loaded.defaultDailyCap))
    }
  }, [baseline])

  // Calculate dirty state
  const isDirty = useMemo(() => {
    return (
      formState.grossBalance !== initialState.grossBalance ||
      formState.baseMonthlyIncome !== initialState.baseMonthlyIncome ||
      formState.paydayAnchor !== initialState.paydayAnchor ||
      formState.currency !== initialState.currency ||
      formState.autoGenerateOverhead !== initialState.autoGenerateOverhead ||
      formState.defaultDailyCap !== initialState.defaultDailyCap ||
      formState.warningThreshold !== initialState.warningThreshold
    )
  }, [formState, initialState])

  // React Router navigation blocker for unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  )

  // Native beforeunload listener for browser close/refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Currency symbol resolution
  const currencySymbol = useMemo(() => {
    switch (formState.currency) {
      case 'SOS':
        return 'Sh.So.'
      case 'EUR':
        return '€'
      default:
        return '$'
    }
  }, [formState.currency])

  // Handle saving baseline
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaveSuccess(false)

    try {
      await updateBaseline({
        grossBalance: formState.grossBalance,
        monthlyIncome: formState.baseMonthlyIncome,
        paydayAnchorDay: formState.paydayAnchor,
        currency: formState.currency,
        overheadAutoGenerate: formState.autoGenerateOverhead,
        defaultDailyCap: formState.defaultDailyCap,
        warningThreshold: formState.warningThreshold,
      })

      // Update initial reference state to clear isDirty
      setInitialState({ ...formState })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      // Gracefully update local state even if offline
      setLiquidity({
        grossBalance: formState.grossBalance,
        totalSaved: totalSaved || 0,
        currency: formState.currency,
      })
      setCurrency(formState.currency)
      setInitialState({ ...formState })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  // Handle Gross Balance input parsing & blur
  const handleGrossChange = (val: string) => {
    setGrossInput(val)
    const cleanNum = parseFloat(val.replace(/[^0-9.]/g, ''))
    if (!isNaN(cleanNum)) {
      setFormState((prev) => ({ ...prev, grossBalance: cleanNum }))
    }
  }
  const handleGrossBlur = () => {
    setGrossInput(formatAmount(formState.grossBalance))
  }

  // Handle Base Monthly Income input parsing & blur
  const handleIncomeChange = (val: string) => {
    setIncomeInput(val)
    const cleanNum = parseFloat(val.replace(/[^0-9.]/g, ''))
    if (!isNaN(cleanNum)) {
      setFormState((prev) => ({ ...prev, baseMonthlyIncome: cleanNum }))
    }
  }
  const handleIncomeBlur = () => {
    setIncomeInput(formatAmount(formState.baseMonthlyIncome))
  }

  // Handle Payday Anchor input parsing & blur
  const handlePaydayChange = (val: string) => {
    setPaydayInput(val)
    const digitsOnly = val.replace(/\D/g, '')
    const parsed = parseInt(digitsOnly, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
      setFormState((prev) => ({ ...prev, paydayAnchor: parsed }))
    }
  }
  const handlePaydayBlur = () => {
    setPaydayInput(getDayWithSuffix(formState.paydayAnchor))
  }

  // Handle Daily Cap input parsing & blur
  const handleDailyCapChange = (val: string) => {
    setDailyCapInput(val)
    const cleanNum = parseFloat(val.replace(/[^0-9.]/g, ''))
    if (!isNaN(cleanNum)) {
      setFormState((prev) => ({ ...prev, defaultDailyCap: cleanNum }))
    }
  }
  const handleDailyCapBlur = () => {
    setDailyCapInput(formatAmount(formState.defaultDailyCap))
  }

  // Reset all baseline data
  const handleConfirmReset = () => {
    const resetValues: SettingsFormState = {
      ...DEFAULT_INITIAL_STATE,
      grossBalance: 0,
      baseMonthlyIncome: 0,
      paydayAnchor: 1,
    }
    setFormState(resetValues)
    setGrossInput(formatAmount(0))
    setIncomeInput(formatAmount(0))
    setPaydayInput(getDayWithSuffix(1))
    setIsResetDialogOpen(false)
  }

  // Reset Cache
  const handleResetCache = () => {
    queryClient.clear()
    setFormState({ ...initialState })
    setGrossInput(formatAmount(initialState.grossBalance))
    setIncomeInput(formatAmount(initialState.baseMonthlyIncome))
    setPaydayInput(getDayWithSuffix(initialState.paydayAnchor))
    setDailyCapInput(formatAmount(initialState.defaultDailyCap))
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  return (
    <div className="flex flex-col pb-12 select-none">
      {/* Sub-Navigation Tabs matching setting.png */}
      <div className="flex items-center gap-7 border-b border-white/[0.04] -mt-2 lg:-mt-3 mb-6 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={cn(
            'pb-3 text-[0.875rem] font-medium transition-colors relative cursor-pointer',
            activeTab === 'finance' ? 'text-white' : 'text-[#7e8088] hover:text-white'
          )}
        >
          Finance Baseline
          {activeTab === 'finance' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#E5A855] rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={cn(
            'pb-3 text-[0.875rem] font-medium transition-colors relative cursor-pointer',
            activeTab === 'preferences' ? 'text-white' : 'text-[#7e8088] hover:text-white'
          )}
        >
          Preferences
          {activeTab === 'preferences' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#E5A855] rounded-full" />
          )}
        </button>
      </div>

      {/* Floating Status Notification */}
      {isUpdating && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-2 bg-[#1A1C22] border border-[#E5A855]/40 text-[#E5A855] px-4 py-2.5 rounded-full shadow-2xl text-xs font-semibold animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Saving baseline...</span>
        </div>
      )}
      {saveSuccess && !isUpdating && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-2 bg-[#1A1C22] border border-[#E5A855]/40 text-[#E5A855] px-4 py-2.5 rounded-full shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Baseline saved successfully</span>
        </div>
      )}


      {/* Main Form enclosing both Cards */}
      <form id="settings-baseline-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* ================= COLUMN 1: Financial Baseline ================= */}
        <div className="bg-[#16181F] border border-white/[0.04] rounded-[22px] p-6 lg:p-7 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div>
            <h2 className="text-[1.125rem] font-semibold text-white tracking-tight mb-6">
              Financial Baseline
            </h2>

            <div className="flex flex-col gap-5">
              {/* Field 1: Starting Gross Balance */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.825rem] text-slate-300 font-medium">
                  Starting Gross Balance
                </label>
                <div className="bg-[#1D2028] border border-white/[0.04] focus-within:border-[#E5A855]/50 rounded-xl h-[3.4rem] px-4 flex items-center gap-3 transition-colors">
                  <span className="text-slate-400 text-base font-light leading-none">{currencySymbol}</span>
                  <input
                    type="text"
                    value={grossInput}
                    onChange={(e) => handleGrossChange(e.target.value)}
                    onBlur={handleGrossBlur}
                    placeholder="0.00"
                    className="w-full bg-transparent text-[1.4rem] font-bold text-white tracking-tight tabular-nums outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Base Monthly Income */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.825rem] text-slate-300 font-medium">
                  Base Monthly Income
                </label>
                <div className="bg-[#1D2028] border border-white/[0.04] focus-within:border-[#E5A855]/50 rounded-xl h-[3.4rem] px-4 flex items-center gap-3 transition-colors">
                  <span className="text-slate-400 text-base font-light leading-none">{currencySymbol}</span>
                  <input
                    type="text"
                    value={incomeInput}
                    onChange={(e) => handleIncomeChange(e.target.value)}
                    onBlur={handleIncomeBlur}
                    placeholder="0.00"
                    className="w-full bg-transparent text-[1.4rem] font-bold text-white tracking-tight tabular-nums outline-none"
                  />
                </div>
              </div>

              {/* Field 3: Payday Anchor Day */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.825rem] text-slate-300 font-medium">
                  Payday Anchor Day
                </label>
                <div className="flex items-center gap-3.5">
                  <div className="bg-[#1D2028] border border-white/[0.04] focus-within:border-[#E5A855]/50 rounded-xl h-[2.85rem] px-3.5 min-w-[5.25rem] max-w-[6.5rem] flex items-center justify-center transition-colors">
                    <input
                      type="text"
                      value={paydayInput}
                      onChange={(e) => handlePaydayChange(e.target.value)}
                      onBlur={handlePaydayBlur}
                      placeholder="25th"
                      className="w-full bg-transparent text-[0.95rem] font-semibold text-white text-center outline-none"
                    />
                  </div>
                  <span className="text-slate-400 text-[0.85rem] font-normal">
                    of the month
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: System Preferences ================= */}
        <div className="bg-[#16181F] border border-white/[0.04] rounded-[22px] p-6 lg:p-7 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.3)] min-h-[28rem]">
          <div>
            <h2 className="text-[1.125rem] font-semibold text-white tracking-tight mb-6">
              System Preferences
            </h2>

            <div className="flex flex-col gap-6">
              {/* Field 1: Auto-generate toggle with checkmark knob */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.85rem] text-slate-200 leading-snug max-w-[280px]">
                  Auto-generate monthly overhead records on payday anchor
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formState.autoGenerateOverhead}
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      autoGenerateOverhead: !prev.autoGenerateOverhead,
                    }))
                  }
                  className={cn(
                    'w-[3.1rem] h-[1.75rem] rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative flex-shrink-0 flex items-center',
                    formState.autoGenerateOverhead ? 'bg-[#E5A855]' : 'bg-[#2A2D37]'
                  )}
                >
                  <span
                    className={cn(
                      'w-[1.45rem] h-[1.45rem] rounded-full bg-white flex items-center justify-center shadow-md transform transition-transform duration-200 ease-in-out',
                      formState.autoGenerateOverhead ? 'translate-x-[1.35rem]' : 'translate-x-0'
                    )}
                  >
                    {formState.autoGenerateOverhead && (
                      <Check className="w-3 h-3 text-[#E5A855] stroke-[3]" />
                    )}
                  </span>
                </button>
              </div>

              {/* Field 2: Default Daily Cap */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.825rem] text-slate-300 font-medium">
                  Default Daily Cap
                </label>
                <div className="bg-[#1D2028] border border-white/[0.04] focus-within:border-[#E5A855]/50 rounded-xl h-[3.4rem] px-4 flex items-center gap-3 transition-colors">
                  <span className="text-slate-400 text-base font-light leading-none">{currencySymbol}</span>
                  <input
                    type="text"
                    value={dailyCapInput}
                    onChange={(e) => handleDailyCapChange(e.target.value)}
                    onBlur={handleDailyCapBlur}
                    placeholder="30.00"
                    className="w-full bg-transparent text-[1.4rem] font-bold text-white tracking-tight tabular-nums outline-none"
                  />
                </div>
              </div>

              {/* Field 3: Over-budget warning threshold */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[0.825rem] text-slate-300 font-medium">
                    Over-budget warning threshold
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {formState.warningThreshold}%
                  </span>
                </div>
                <div className="relative py-3 flex items-center">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={formState.warningThreshold}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        warningThreshold: Number(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-[#2A2D37] rounded-lg appearance-none cursor-pointer accent-[#E5A855]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={() => setIsResetDialogOpen(true)}
              className="text-[0.825rem] text-[#E25C5C] hover:text-red-400 hover:underline transition-colors font-medium cursor-pointer"
            >
              Reset All Month Baseline Data
            </button>
            <button
              type="button"
              onClick={handleResetCache}
              className="bg-[#20232B] hover:bg-[#282B35] border border-white/[0.08] text-white text-[0.8rem] font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Cache</span>
            </button>
          </div>
        </div>
      </form>

      {/* Unsaved Changes Navigation Blocker Confirmation Dialog */}
      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Unsaved Changes"
        message="You have unsaved changes in your settings. Leaving this page will discard all edits made to the baseline. Are you sure you want to discard them?"
        confirmText="Discard & Leave"
        cancelText="Stay on Page"
        variant="warning"
      />

      {/* Reset All Month Baseline Data Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Baseline Data"
        message="Are you sure you want to reset all monthly baseline values? Gross Balance and Income will be set to zero."
        confirmText="Reset Baseline"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default SettingsPage

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User as UserIcon,
  Camera,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Trash2,
  AlertCircle,
  Wallet,
  Calendar,
  ShieldCheck,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { uploadApi, validateImageFile } from '@/features/items/api/uploadApi'
import { useBaseline } from '@/features/settings/hooks/useBaseline'
import { CURRENCY_CONFIGS, type CurrencyCode } from '@/features/settings/types/settings.types'

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'DA'
}

export const OnboardingModal: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const { baseline, updateBaseline } = useBaseline()

  // Modal visibility: open if user is verified and not yet onboarded
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Identity & Avatar
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarImgFailed, setAvatarImgFailed] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2: Financial Baseline
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [grossBalance, setGrossBalance] = useState<string>('0')
  const [monthlyIncome, setMonthlyIncome] = useState<string>('0')

  // Step 3: Spending Cap & Discipline
  const [defaultDailyCap, setDefaultDailyCap] = useState<string>('30')
  const [paydayAnchorDay, setPaydayAnchorDay] = useState<string>('25')

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Sync initial values from user and baseline on mount
  useEffect(() => {
    if (user && user.isVerified !== false && !user.isOnboarded) {
      setIsOpen(true)
      setName(user.name || '')
      setAvatar(user.avatar || null)
    } else {
      setIsOpen(false)
    }
  }, [user])

  useEffect(() => {
    if (baseline) {
      if (baseline.currency) {
        setCurrency(baseline.currency)
      }
      if (baseline.grossBalance !== undefined) {
        setGrossBalance(String(baseline.grossBalance))
      }
      if (baseline.monthlyIncome !== undefined) {
        setMonthlyIncome(String(baseline.monthlyIncome))
      }
      if (baseline.defaultDailyCap !== undefined) {
        setDefaultDailyCap(String(baseline.defaultDailyCap))
      }
      if (baseline.paydayAnchorDay !== undefined) {
        setPaydayAnchorDay(String(baseline.paydayAnchorDay))
      }
    }
  }, [baseline])

  // Avatar Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file, { isAvatar: true })
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid avatar image.')
      return
    }

    setIsUploadingAvatar(true)
    setAvatarError(null)

    try {
      const uploadRes = await uploadApi.uploadAvatar(file)
      const newAvatarUrl = uploadRes.imageUrl
      setAvatar(newAvatarUrl)
      setAvatarImgFailed(false)
      if (uploadRes.user) {
        updateUser(uploadRes.user)
      }
    } catch (err: any) {
      setAvatarError(err?.message || 'Failed to upload photo. Please try again.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar(null)
    setAvatarImgFailed(false)
  }

  // Complete Onboarding Handler
  const handleComplete = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const cleanName = name.trim() || user?.name || 'User'
      const parsedGross = parseFloat(grossBalance) || 0
      const parsedIncome = parseFloat(monthlyIncome) || 0
      const parsedDailyCap = parseFloat(defaultDailyCap) || 30
      const parsedPayday = Math.max(1, Math.min(31, parseInt(paydayAnchorDay, 10) || 25))

      // 1. Persist profile info with isOnboarded = true
      const updatedUser = await authApi.updateProfile({
        name: cleanName,
        avatar: avatar,
        isOnboarded: true,
      })

      // 2. Persist financial baseline & preferences
      await updateBaseline({
        currency,
        grossBalance: parsedGross,
        monthlyIncome: parsedIncome,
        defaultDailyCap: parsedDailyCap,
        paydayAnchorDay: parsedPayday,
      })

      // 3. Update auth store
      updateUser({
        ...updatedUser,
        name: cleanName,
        avatar: avatar,
        isOnboarded: true,
      })

      // Close modal smoothly
      setIsOpen(false)
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to save your setup. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Skip / Dismiss Handler
  const handleSkip = async () => {
    setIsSubmitting(true)
    try {
      const updatedUser = await authApi.updateProfile({
        isOnboarded: true,
      })
      updateUser({
        ...updatedUser,
        isOnboarded: true,
      })
      setIsOpen(false)
    } catch {
      // Even if network fails, close locally to let the user proceed
      updateUser({ isOnboarded: true })
      setIsOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const currencySymbol = CURRENCY_CONFIGS[currency]?.symbol || '$'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-14 px-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -45, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -25, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-[#13151B] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 relative text-white my-auto sm:my-0"
        >
          {/* Top Bar: Stepper & Skip */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Step {step} of 3
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-medium text-slate-300">
                {step === 1 && 'Identity & Profile'}
                {step === 2 && 'Financial Baseline'}
                {step === 3 && 'Daily Spending Cap'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
              title="Skip onboarding for now"
            >
              <span>Skip for now</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stepper Progress Bars */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                step >= 1 ? 'bg-amber-400/90' : 'bg-white/10'
              }`}
            />
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                step >= 2 ? 'bg-amber-400/90' : 'bg-white/10'
              }`}
            />
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                step >= 3 ? 'bg-amber-400/90' : 'bg-white/10'
              }`}
            />
          </div>

          {/* Error Banner */}
          {submitError && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ================= STEP 1: IDENTITY & AVATAR ================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium tracking-tight text-white">
                  Welcome to Dakhli
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Let's personalize your account identity and profile photo.
                </p>
              </div>

              {/* Avatar Uploader Section */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-[#1A1D26]/70 border border-white/5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group w-16 h-16 rounded-full bg-[#13151B] border border-white/15 hover:border-amber-400/50 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden shadow-inner"
                  title="Click to upload profile photo"
                >
                  {avatar && !avatarImgFailed ? (
                    <img
                      src={avatar}
                      alt={name || 'Avatar'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarImgFailed(true)}
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <span className="text-base font-mono font-medium text-slate-300 select-none">
                      {getInitials(name, user?.email)}
                    </span>
                  )}

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    <span>Profile Photo</span>
                    {user?.authProvider === 'GOOGLE' && avatar?.includes('googleusercontent') && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    JPG, PNG or WebP under 2MB.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-white text-xs font-mono rounded-lg border border-white/10 transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3 h-3 text-slate-400" />
                          <span>{avatar ? 'Change photo' : 'Upload photo'}</span>
                        </>
                      )}
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="px-2.5 py-1.5 hover:bg-white/5 active:scale-95 text-slate-400 hover:text-red-400 text-xs font-mono rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {avatarError && (
                <p className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{avatarError}</span>
                </p>
              )}

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono">Display Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400/50 outline-none transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!name.trim() || isUploadingAvatar}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-400/10 active:scale-95"
                >
                  <span>Next: Financial Baseline</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: FINANCIAL BASELINE ================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium tracking-tight text-white">
                  Starting Financial Baseline
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure your primary currency, cash starting balance, and monthly income.
                </p>
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono">Base Currency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['USD', 'EUR', 'SOS'] as CurrencyCode[]).map((code) => {
                    const cfg = CURRENCY_CONFIGS[code]
                    const isSelected = currency === code
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCurrency(code)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400/10 border-amber-400/40 text-amber-300 font-medium'
                            : 'bg-[#1A1D26] border-white/5 text-slate-400 hover:border-white/15 hover:text-white'
                        }`}
                      >
                        <span className="font-semibold">{cfg.symbol}</span>
                        <span>{code}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Starting Balance Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono">
                  Starting Balance (Total Cash / Bank)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-amber-400">
                    {currencySymbol}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={grossBalance}
                    onChange={(e) => setGrossBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1A1D26] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-amber-400/50 outline-none transition-colors"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Total available liquidity across all your accounts today.
                </p>
              </div>

              {/* Monthly Base Income Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono">
                  Expected Monthly Income / Salary
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-amber-400">
                    {currencySymbol}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#1A1D26] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-amber-400/50 outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Recurring income expected each monthly cycle.
                </p>
              </div>

              {/* Navigation Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/10 active:scale-95"
                >
                  <span>Next: Daily Cap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SPENDING DISCIPLINE & PAYDAY ================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium tracking-tight text-white">
                  Spending Discipline &amp; Payday
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Define your daily allowance and the anchor day when your cycle resets.
                </p>
              </div>

              {/* Daily Spendable Cap */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono">
                  Daily Spendable Allowed (Daily Cap)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-amber-400">
                    {currencySymbol}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={defaultDailyCap}
                    onChange={(e) => setDefaultDailyCap(e.target.value)}
                    placeholder="30.00"
                    className="w-full bg-[#1A1D26] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-amber-400/50 outline-none transition-colors"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Target daily expenditure threshold. Dakhli alerts you if daily spend exceeds this amount.
                </p>
              </div>

              {/* Payday Anchor Day */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono">
                  Payday Anchor Day (1 – 31)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paydayAnchorDay}
                    onChange={(e) => setPaydayAnchorDay(e.target.value)}
                    placeholder="25"
                    className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-amber-400/50 outline-none transition-colors"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  The day of the month your income arrives and your monthly cycle resets.
                </p>
              </div>

              {/* Navigation Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Completing Setup...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Complete &amp; Enter Portal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default OnboardingModal


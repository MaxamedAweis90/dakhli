import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from './hooks/useAuth'
import { AlertCircle, Loader2 } from '@/components/shared/icons'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/types/api'

interface LocationState {
  email?: string
  name?: string
  deletionScheduledAt?: string
  restorationToken?: string
}

export const AccountDeactivatedPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, clearSession } = useAuthStore()
  const { restoreAccount, restoreAccountMutation } = useAuth()

  // Read state from route or sessionStorage
  const cachedData = useMemo<LocationState | null>(() => {
    try {
      const stored = sessionStorage.getItem('dakhli_restoration')
      if (stored) {
        return JSON.parse(stored) as LocationState
      }
    } catch {
      // ignore JSON parse error
    }
    return null
  }, [])

  const stateData = (location.state as LocationState) || cachedData || {}
  const targetEmail = stateData.email || user?.email || ''
  const deletionScheduledAt =
    stateData.deletionScheduledAt ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const restorationToken = stateData.restorationToken

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [currentTime, setCurrentTime] = useState<number>(Date.now())

  // Keep countdown updated every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Calculate remaining time
  const { days, hours, isExpired, formattedDate } = useMemo(() => {
    const targetDate = new Date(deletionScheduledAt)
    const diffMs = targetDate.getTime() - currentTime

    if (diffMs <= 0) {
      return {
        days: 0,
        hours: 0,
        isExpired: true,
        formattedDate: targetDate.toUTCString(),
      }
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
    const d = Math.floor(totalHours / 24)
    const h = totalHours % 24

    return {
      days: d,
      hours: h,
      isExpired: false,
      formattedDate: targetDate.toUTCString(),
    }
  }, [deletionScheduledAt, currentTime])

  // If user is authenticated and not deactivated, send to dashboard
  if (isAuthenticated && user && !user.isDeactivated) {
    return <Navigate to="/dashboard" replace />
  }

  // If no email or context exists and unauthenticated, route to login
  if (!isAuthenticated && !targetEmail && !restorationToken) {
    return <Navigate to="/login" replace />
  }

  const handleRestore = async () => {
    setErrorMessage(null)
    try {
      await restoreAccount(restorationToken)
      try {
        sessionStorage.removeItem('dakhli_restoration')
      } catch {
        // ignore
      }
      setShowToast(true)
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1000)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setErrorMessage(
        apiErr?.message || 'Failed to restore account. Please contact support or try logging in again.'
      )
    }
  }

  const handleSignOut = () => {
    try {
      sessionStorage.removeItem('dakhli_restoration')
    } catch {
      // ignore
    }
    clearSession()
    navigate('/login', { replace: true })
  }

  const isRestoring = restoreAccountMutation.isPending

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0D0E12] text-white flex items-center justify-center p-4 select-none relative">
      {/* Main Card Container */}
      <div className="w-full max-w-[420px] bg-[#13151B] border border-white/[0.05] rounded-2xl p-7 sm:p-9 shadow-2xl relative transition-all duration-200">
        {/* Top Brand & System Tag */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-[#E5A855]/15 border border-[#E5A855]/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-3 h-3 text-[#E5A855]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
            DAKHLI // LIFECYCLE INTERCEPT
          </span>
        </div>

        {/* Heading & Subtext */}
        <div className="mb-2">
          <h1 className="text-xl font-medium text-white tracking-tight mt-1">
            Account in Dormant State
          </h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This account was deactivated and is scheduled for permanent data deletion.
            All recurring overhead bills and savings cuts are currently frozen.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Information Surface (#1A1D26) */}
        <div className="bg-[#1A1D26] border border-white/[0.07] rounded-lg p-5 my-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">STATUS</span>
            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 font-mono text-xs px-2 py-0.5 rounded">
              DEACTIVATION GRACE PERIOD
            </span>
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Scheduled Deletion
            </span>
            <span className="font-mono text-xs text-white break-words">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Grace Remaining
            </span>
            <span
              className={cn(
                'font-mono text-xs tabular-nums font-semibold',
                isExpired ? 'text-red-400' : 'text-amber-300'
              )}
            >
              {isExpired ? '0d 0h (Expired)' : `${days}d ${hours}h remaining to restore`}
            </span>
          </div>

          <div className="text-xs text-slate-400 pt-3 border-t border-white/5 leading-relaxed">
            Restoring your account recovers all historical logs, items, and baseline parameters exactly as you left them.
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleRestore}
          disabled={isRestoring || isExpired}
          className="w-full bg-white text-[#0D0E12] font-mono text-xs font-semibold py-2.5 rounded-lg hover:bg-slate-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {isRestoring ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D0E12]" />
              <span>Restoring Account...</span>
            </>
          ) : (
            <span>Restore Account</span>
          )}
        </button>

        {/* Secondary CTA */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isRestoring}
          className="w-full text-slate-400 hover:text-white font-mono text-xs py-2 mt-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          Sign Out &amp; Keep Deactivated
        </button>
      </div>

      {/* Minimalist Bottom-Right Slate Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1D26] border border-white/10 text-slate-200 px-4 py-3 rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Account restored. Recurring ledger active.</span>
        </div>
      )}
    </div>
  )
}

export default AccountDeactivatedPage


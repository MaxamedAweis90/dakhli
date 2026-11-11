import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/features/auth/api/authApi'
import {
  User as UserIcon,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
} from '@/components/shared/icons'
import type { ApiError } from '@/types/api'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateUser, clearSession } = useAuthStore()

  // Identity Form State
  const initialName = user?.name || ''
  const [name, setName] = useState(initialName)
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Deactivation Modal State
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
  const [deactivateConfirmation, setDeactivateConfirmation] = useState('')
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  // Save Name Handler
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === initialName || trimmed.length < 2) return

    setIsUpdatingName(true)
    setNameError(null)
    setNameSuccess(null)

    try {
      const updatedUser = await authApi.updateProfile({ name: trimmed })
      updateUser(updatedUser)
      setNameSuccess('Display name updated successfully.')
      setTimeout(() => setNameSuccess(null), 3000)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setNameError(apiErr?.message || 'Failed to update name.')
    } finally {
      setIsUpdatingName(false)
    }
  }

  // Update Password Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!currentPassword) {
      setPasswordError('Current password is required.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setIsUpdatingPassword(true)

    try {
      const res = await authApi.updatePassword({
        currentPassword,
        newPassword,
      })
      setPasswordSuccess(res.message || 'Master password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(null), 4000)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setPasswordError(apiErr?.message || 'Failed to update password.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Deactivate Account Execution
  const handleExecuteDeactivate = async () => {
    if (deactivateConfirmation !== 'DEACTIVATE') return

    setIsDeactivating(true)
    setDeactivateError(null)

    try {
      await authApi.deactivateAccount()
      clearSession()
      navigate('/login', {
        replace: true,
        state: {
          deactivatedNotice:
            'Your account has been deactivated. You can restore your data anytime within the 30-day grace period.',
        },
      })
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setDeactivateError(apiErr?.message || 'Failed to deactivate account.')
      setIsDeactivating(false)
    }
  }

  const isGoogleUser = user?.authProvider === 'GOOGLE'
  const isNameDirty = name.trim() !== initialName && name.trim().length >= 2

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Header Strip */}
      <div>
        <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
          SETTINGS // IDENTITY &amp; ACCESS
        </span>
        <h1 className="text-2xl font-medium text-white tracking-tight mt-1">
          Profile Settings
        </h1>
      </div>

      {/* ================= CARD 1: Identity & Credentials ================= */}
      <div className="bg-[#13151B] border border-white/5 rounded-xl p-6">
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-slate-400" />
          <span>Identity &amp; Credentials</span>
        </h2>

        {nameSuccess && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{nameSuccess}</span>
          </div>
        )}

        {nameError && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{nameError}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Display Name */}
          <form onSubmit={handleSaveName} className="space-y-1.5">
            <label className="text-xs text-slate-400 font-mono">Display Name</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="bg-[#1A1D26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/30 outline-none w-full max-w-md transition-colors"
              />
              <button
                type="submit"
                disabled={!isNameDirty || isUpdatingName}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-mono rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
              >
                {isUpdatingName ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
          </form>

          {/* Email Address with Inline Verification Badge */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-mono">Registered Email</label>
            <div className="flex items-center gap-3 max-w-md">
              <div className="bg-[#1A1D26] border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono select-all flex-1 truncate">
                {user?.email || 'N/A'}
              </div>
              {user?.isVerified ? (
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-mono text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <NavLink
                  to="/verify-email"
                  state={{ email: user?.email }}
                  className="text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 font-mono text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  UNVERIFIED — Verify &rarr;
                </NavLink>
              )}
            </div>
          </div>

          {/* Authentication Provider */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-mono">
              Authentication Method
            </label>
            <div className="flex items-center gap-2 max-w-md p-3 rounded-lg bg-[#1A1D26] border border-white/5">
              {isGoogleUser ? (
                <>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span className="text-xs font-mono text-slate-300">
                    Linked to Google Identity (OAuth 2.0)
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-mono text-slate-300">
                    Email &amp; Master Password
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CARD 2: Security & Password Management ================= */}
      <div className="bg-[#13151B] border border-white/5 rounded-xl p-6">
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>Security &amp; Password Management</span>
        </h2>

        {isGoogleUser ? (
          <div className="bg-[#1A1D26] border border-white/5 rounded-lg p-4 text-xs font-mono text-slate-400 leading-relaxed">
            Your account is authenticated exclusively through Google OAuth. Password
            changes are managed directly via your Google Account.
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            {passwordSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono">
                Current Master Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-[#1A1D26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-white/30 outline-none w-full transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono">
                New Master Password (Min 8 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-[#1A1D26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-white/30 outline-none w-full transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono">
                Confirm New Master Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-[#1A1D26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-white/30 outline-none w-full transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword || !currentPassword || !newPassword}
              className="bg-white/10 hover:bg-white/15 active:scale-95 text-white font-mono text-xs px-4 py-2.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ================= CARD 3: Danger Zone ================= */}
      <div className="bg-[#13151B] border border-rose-500/20 rounded-xl p-6">
        <h2 className="text-sm font-medium text-rose-400 font-mono mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Danger Zone // Deactivate Account</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mb-4">
          Deactivating your account puts your profile into a 30-day dormant state. All
          recurring overhead bills and baseline savings deductions will be completely
          frozen during this period. You can restore your account with all financial
          records intact by logging back in within 30 days.
        </p>

        <button
          type="button"
          onClick={() => {
            setDeactivateConfirmation('')
            setDeactivateError(null)
            setIsDeactivateModalOpen(true)
          }}
          className="border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 active:scale-95 text-xs font-mono px-4 py-2 rounded-lg transition-all cursor-pointer"
        >
          Deactivate Account...
        </button>
      </div>

      {/* ================= Safety Confirmation Modal ================= */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1D26] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsDeactivateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3 text-rose-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <h3 className="text-sm font-semibold font-mono tracking-wide">
                Confirm Account Deactivation
              </h3>
            </div>

            {/* Warning Message */}
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This will immediately log you out and schedule your data for permanent
              deletion in 30 days. To proceed, type{' '}
              <strong className="text-rose-400 font-mono">DEACTIVATE</strong> below.
            </p>

            {deactivateError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{deactivateError}</span>
              </div>
            )}

            {/* Safety Confirmation Input */}
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

            {/* Action Buttons */}
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

export default ProfilePage

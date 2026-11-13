import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { uploadApi, validateImageFile } from '@/features/items/api/uploadApi'
import {
  User as UserIcon,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  X,
  Camera,
  Trash2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import type { ApiError } from '@/types/api'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateUser, clearSession } = useAuthStore()

  // ----------------------------------------------------
  // Identity Form State (Name & Avatar)
  // ----------------------------------------------------
  const initialName = user?.name || ''
  const [name, setName] = useState(initialName)
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null)
  const [avatarImgFailed, setAvatarImgFailed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Synchronize initialName when user profile hydrates
  useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }
  }, [user?.name])

  // Reset img error if avatar changes
  useEffect(() => {
    setAvatarImgFailed(false)
  }, [user?.avatar])

  // ----------------------------------------------------
  // Password Management State (Two-Step with OTP)
  // ----------------------------------------------------
  const [passwordStep, setPasswordStep] = useState<'INPUT' | 'OTP'>('INPUT')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // ----------------------------------------------------
  // Deactivation Modal State
  // ----------------------------------------------------
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
  const [deactivateConfirmation, setDeactivateConfirmation] = useState('')
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  // ----------------------------------------------------
  // Save Name Handler
  // ----------------------------------------------------
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === user?.name || trimmed.length < 2) return

    setIsUpdatingName(true)
    setNameError(null)
    setNameSuccess(null)

    try {
      const updatedUser = await authApi.updateProfile({ name: trimmed })
      updateUser(updatedUser)
      setNameSuccess('Display name updated successfully.')
      setTimeout(() => setNameSuccess(null), 3500)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setNameError(apiErr?.message || 'Failed to update name.')
    } finally {
      setIsUpdatingName(false)
    }
  }

  // ----------------------------------------------------
  // Avatar Upload / Remove Handlers
  // ----------------------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Strict pre-upload avatar validation (Max 2MB, JPEG/PNG/WebP)
    const validation = validateImageFile(file, { isAvatar: true })
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid avatar image.')
      return
    }

    setIsUploadingAvatar(true)
    setAvatarError(null)
    setAvatarSuccess(null)

    try {
      // 1. Upload to dedicated 'avatars/' folder in dakhli-item-assets and persist to profile
      const uploadRes = await uploadApi.uploadAvatar(file)
      if (uploadRes.user) {
        updateUser(uploadRes.user)
      } else {
        const updatedUser = await authApi.updateProfile({ avatar: uploadRes.imageUrl })
        updateUser(updatedUser)
      }
      setAvatarSuccess('Avatar updated successfully.')
      setTimeout(() => setAvatarSuccess(null), 3500)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setAvatarError(apiErr?.message || 'Failed to upload avatar image.')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    setAvatarError(null)
    setAvatarSuccess(null)

    try {
      const updatedUser = await authApi.updateProfile({ avatar: null })
      updateUser(updatedUser)
      setAvatarSuccess('Avatar removed.')
      setTimeout(() => setAvatarSuccess(null), 3000)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setAvatarError(apiErr?.message || 'Failed to remove avatar.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // ----------------------------------------------------
  // Step 1: Request Password OTP Handler
  // ----------------------------------------------------
  const handleRequestPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    const userHasPassword = Boolean(user?.hasPassword)

    if (userHasPassword && !currentPassword) {
      setPasswordError('Current password is required.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setIsRequestingOtp(true)

    try {
      const res = await authApi.requestPasswordOtp(userHasPassword ? currentPassword : undefined)
      setPasswordSuccess(res.message || 'Authorization code sent to your email.')
      setPasswordStep('OTP')
      setResendCooldown(60)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setPasswordError(apiErr?.message || 'Failed to dispatch verification code.')
    } finally {
      setIsRequestingOtp(false)
    }
  }

  // ----------------------------------------------------
  // Step 2: Confirm OTP & Apply New Password
  // ----------------------------------------------------
  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    const cleanOtp = otpCode.trim()
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setPasswordError('Please enter a valid 6-digit numeric authorization code.')
      return
    }

    setIsUpdatingPassword(true)

    try {
      const res = await authApi.updatePassword({
        currentPassword: user?.hasPassword ? currentPassword : undefined,
        newPassword,
        otp: cleanOtp,
      })

      if (res.user) {
        updateUser(res.user)
      } else {
        updateUser({ hasPassword: true })
      }

      setPasswordSuccess(
        res.message || 'Password updated successfully. A confirmation email has been sent.'
      )
      // Reset form
      setPasswordStep('INPUT')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setOtpCode('')
      setTimeout(() => setPasswordSuccess(null), 5000)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setPasswordError(apiErr?.message || 'Invalid or expired authorization code.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // Resend OTP from within OTP Step
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isRequestingOtp) return
    setPasswordError(null)
    setIsRequestingOtp(true)

    try {
      const res = await authApi.requestPasswordOtp(user?.hasPassword ? currentPassword : undefined)
      setPasswordSuccess(res.message || 'Fresh authorization code sent to your email.')
      setResendCooldown(60)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      setPasswordError(apiErr?.message || 'Failed to resend authorization code.')
    } finally {
      setIsRequestingOtp(false)
    }
  }

  // ----------------------------------------------------
  // Deactivate Account Execution
  // ----------------------------------------------------
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
  const hasPassword = Boolean(user?.hasPassword)
  const isNameDirty = name.trim() !== (user?.name || '') && name.trim().length >= 2

  // Get Initials for Avatar Fallback
  const getInitials = (userName?: string, userEmail?: string): string => {
    if (userName && userName.trim()) {
      const parts = userName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return userName.trim().slice(0, 2).toUpperCase()
    }
    if (userEmail) {
      return userEmail.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Clean Header */}
      <div>
        <h1 className="text-xl font-medium text-white tracking-tight">
          Profile Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your account identity, profile photo, and password.
        </p>
      </div>

      {/* ================= CARD 1: Identity & User Info (Avatar & Details) ================= */}
      <div className="bg-[#13151B] border border-white/5 rounded-xl p-6">
        <h2 className="text-sm font-medium text-white mb-5 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-slate-400" />
          <span>Identity &amp; Profile</span>
        </h2>

        {avatarSuccess && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{avatarSuccess}</span>
          </div>
        )}

        {avatarError && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{avatarError}</span>
          </div>
        )}

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

        {/* --- Avatar & Media Section --- */}
        <div className="flex items-center gap-5 pb-6 mb-6 border-b border-white/5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group w-16 h-16 rounded-full bg-[#1A1D26] border border-white/10 hover:border-white/25 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden shadow-inner"
            title="Click to change avatar photo"
          >
            {user?.avatar && !avatarImgFailed ? (
              <img
                src={user.avatar}
                alt={user.name || 'Avatar'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarImgFailed(true)}
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <span className="text-base font-mono font-medium text-slate-300 select-none">
                {getInitials(user?.name, user?.email)}
              </span>
            )}

            {/* Subtle Hover Action Overlay */}
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Profile Photo</span>
              {isGoogleUser && user?.avatar && user.avatar.includes('googleusercontent') && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  Google Account
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
                    <span>{user?.avatar ? 'Change photo' : 'Upload photo'}</span>
                  </>
                )}
              </button>

              {user?.avatar && (
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

        {/* --- Form Fields --- */}
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
                className="px-3.5 py-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-mono rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
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
                    Linked to Google Identity
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-mono text-slate-300">
                    Email &amp; Password
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CARD 2: Password ================= */}
      <div className="bg-[#13151B] border border-white/5 rounded-xl p-6">
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>Password</span>
        </h2>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {/* STEP 1: Password Input Form */}
        {passwordStep === 'INPUT' ? (
          <form onSubmit={handleRequestPasswordOtp} className="space-y-4 max-w-md">
            {hasPassword && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-[#1A1D26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-white/30 outline-none w-full transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono">
                New Password
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
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-[#1A1D26] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-white/30 outline-none w-full transition-colors"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={
                  isRequestingOtp ||
                  (hasPassword && !currentPassword) ||
                  !newPassword ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                className="bg-white/10 hover:bg-white/15 active:scale-95 text-white font-mono text-xs px-4 py-2.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: OTP Verification Form */
          <form onSubmit={handleConfirmPasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono">
                Verification Code (Sent to {user?.email})
              </label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="bg-[#1A1D26] border border-white/10 rounded-lg px-3 py-2 text-base text-white font-mono tracking-[0.4em] text-center focus:border-white/30 outline-none w-full transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isUpdatingPassword || otpCode.trim().length !== 6}
                className="bg-white/15 hover:bg-white/20 active:scale-95 text-white font-mono text-xs px-4 py-2.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Confirm Password</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isRequestingOtp}
                className="px-3 py-2.5 border border-white/10 hover:bg-white/5 active:scale-95 text-slate-300 hover:text-white text-xs font-mono rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                {isRequestingOtp ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                </span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPasswordStep('INPUT')
                  setOtpCode('')
                  setPasswordError(null)
                }}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>
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
import { api } from '@/lib/api'
import type { ApiResponse } from '@/types/api'
import type {
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '../types/auth.types'

export type { User, AuthResponse, LoginPayload, RegisterPayload }
export type LoginDto = LoginPayload
export type RegisterDto = RegisterPayload

export interface AuthResponseData {
  token: string
  user: {
    id?: string
    _id?: string
    email: string
    name?: string
    authProvider?: 'LOCAL' | 'GOOGLE'
    isVerified?: boolean
    isDeactivated?: boolean
    createdAt?: string
  }
}

export interface MeResponseData {
  user: {
    id?: string
    _id?: string
    email: string
    name?: string
    authProvider?: 'LOCAL' | 'GOOGLE'
    isVerified?: boolean
    isDeactivated?: boolean
    createdAt?: string
  }
  balance?: unknown
}

export interface CheckEmailResponseData {
  available: boolean
  message: string
  authProvider?: string
  isGoogleAccount?: boolean
}

export interface DeactivatedAccountResponse {
  isDeactivated: true
  email: string
  name: string
  deletionScheduledAt: string
  restorationToken: string
}

export type AuthResult = AuthResponse | DeactivatedAccountResponse

export const isDeactivatedResponse = (
  res: AuthResult
): res is DeactivatedAccountResponse => {
  return 'isDeactivated' in res && res.isDeactivated === true
}

export const authApi = {
  /**
   * Log in user with email & password
   */
  login: async (credentials: LoginDto): Promise<AuthResult> => {
    const res = (await api.post('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    })) as any

    if (res?.isDeactivated || res?.data?.isDeactivated) {
      const data = res.data?.isDeactivated ? res.data : res
      return {
        isDeactivated: true,
        email: data.email,
        name: data.name,
        deletionScheduledAt: data.deletionScheduledAt,
        restorationToken: data.restorationToken,
      }
    }

    if (!res.data?.token || !res.data?.user) {
      throw new Error('Invalid login response from server.')
    }

    const rawUser = res.data.user
    return {
      token: res.data.token,
      user: {
        id: (rawUser.id || rawUser._id) as string,
        email: rawUser.email,
        name: rawUser.name,
        authProvider: rawUser.authProvider,
        isVerified: rawUser.isVerified,
        isDeactivated: rawUser.isDeactivated,
        createdAt: rawUser.createdAt,
      },
    }
  },

  /**
   * Register new user account with default baseline financial figures
   */
  register: async (payload: RegisterDto): Promise<AuthResponse> => {
    const res = (await api.post('/auth/register', {
      name: payload.name?.trim() || payload.email.split('@')[0],
      email: payload.email.trim(),
      password: payload.password,
      initialBalance: payload.initialBalance ?? 260375.03,
      baseMonthlyIncome: payload.baseMonthlyIncome ?? 8385.0,
      paydayAnchor: payload.paydayAnchor ?? 25,
    })) as ApiResponse<AuthResponseData>

    if (!res.data?.token || !res.data?.user) {
      throw new Error('Invalid registration response from server.')
    }

    const rawUser = res.data.user
    return {
      token: res.data.token,
      user: {
        id: (rawUser.id || rawUser._id) as string,
        email: rawUser.email,
        name: rawUser.name,
        authProvider: rawUser.authProvider,
        isVerified: rawUser.isVerified,
        isDeactivated: rawUser.isDeactivated,
        createdAt: rawUser.createdAt,
      },
    }
  },

  /**
   * Pre-flight check to verify if email is available for registration
   * POST /api/auth/check-email
   */
  checkEmail: async (email: string): Promise<CheckEmailResponseData> => {
    const res = (await api.post('/auth/check-email', {
      email: email.trim(),
    })) as ApiResponse<CheckEmailResponseData>

    return res.data || { available: false, message: 'Unable to check email.' }
  },

  /**
   * Authenticate or auto-provision account via Google OAuth ID token
   * POST /api/auth/google
   */
  googleAuth: async (credentialOrToken: string): Promise<AuthResult> => {
    const res = (await api.post('/auth/google', {
      credential: credentialOrToken,
      idToken: credentialOrToken,
    })) as any

    if (res?.isDeactivated || res?.data?.isDeactivated) {
      const data = res.data?.isDeactivated ? res.data : res
      return {
        isDeactivated: true,
        email: data.email,
        name: data.name,
        deletionScheduledAt: data.deletionScheduledAt,
        restorationToken: data.restorationToken,
      }
    }

    if (!res.data?.token || !res.data?.user) {
      throw new Error('Invalid Google authentication response from server.')
    }

    const rawUser = res.data.user
    return {
      token: res.data.token,
      user: {
        id: (rawUser.id || rawUser._id) as string,
        email: rawUser.email,
        name: rawUser.name,
        authProvider: rawUser.authProvider,
        isVerified: rawUser.isVerified,
        isDeactivated: rawUser.isDeactivated,
        createdAt: rawUser.createdAt,
      },
    }
  },

  /**
   * Verify 6-digit email verification OTP
   * POST /api/auth/verify-otp
   */
  verifyOtp: async (payload: { email: string; otp: string }): Promise<AuthResponse> => {
    const res = (await api.post('/auth/verify-otp', {
      email: payload.email.trim(),
      otp: payload.otp.trim(),
    })) as ApiResponse<AuthResponseData>

    if (!res.data?.token || !res.data?.user) {
      throw new Error('Invalid verification response from server.')
    }

    const rawUser = res.data.user
    return {
      token: res.data.token,
      user: {
        id: (rawUser.id || rawUser._id) as string,
        email: rawUser.email,
        name: rawUser.name,
        authProvider: rawUser.authProvider,
        isVerified: rawUser.isVerified,
        isDeactivated: rawUser.isDeactivated,
        createdAt: rawUser.createdAt,
      },
    }
  },

  /**
   * Resend 6-digit verification code with 60-second cooldown
   * POST /api/auth/resend-otp
   */
  resendOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    const res = (await api.post('/auth/resend-otp', {
      email: email.trim(),
    })) as ApiResponse<{ message?: string }>

    return {
      success: true,
      message: res.data?.message || 'Verification code resent.',
    }
  },

  /**
   * Fetch current authenticated user session (/auth/me)
   */
  getMe: async (): Promise<User> => {
    const res = (await api.get('/auth/me')) as ApiResponse<MeResponseData>
    if (!res.data?.user) {
      throw new Error('Failed to rehydrate user profile.')
    }

    const rawUser = res.data.user
    return {
      id: (rawUser.id || rawUser._id) as string,
      email: rawUser.email,
      name: rawUser.name,
      authProvider: rawUser.authProvider,
      isVerified: rawUser.isVerified,
      isDeactivated: rawUser.isDeactivated,
      createdAt: rawUser.createdAt,
    }
  },

  /**
   * Update Profile Information (Name)
   * PATCH /api/users/profile
   */
  updateProfile: async (payload: { name: string }): Promise<User> => {
    const res = (await api.patch('/users/profile', {
      name: payload.name.trim(),
    })) as ApiResponse<{ user: AuthResponseData['user'] }>

    if (!res.data?.user) {
      throw new Error('Failed to update profile.')
    }

    const rawUser = res.data.user
    return {
      id: (rawUser.id || rawUser._id) as string,
      email: rawUser.email,
      name: rawUser.name,
      authProvider: rawUser.authProvider,
      isVerified: rawUser.isVerified,
      isDeactivated: rawUser.isDeactivated,
      createdAt: rawUser.createdAt,
    }
  },

  /**
   * Update Master Password
   * PATCH /api/auth/update-password
   */
  updatePassword: async (payload: {
    currentPassword: string
    newPassword: string
  }): Promise<{ message: string }> => {
    const res = (await api.patch('/auth/update-password', {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    })) as ApiResponse<{ message?: string }>

    return {
      message: res.message || res.data?.message || 'Password updated successfully.',
    }
  },

  /**
   * Deactivate Account (30-day soft deactivation)
   * POST /api/auth/deactivate
   */
  deactivateAccount: async (): Promise<{ message: string }> => {
    const res = (await api.post('/auth/deactivate', {})) as ApiResponse<{ message?: string }>

    return {
      message: res.message || res.data?.message || 'Account has been deactivated.',
    }
  },

  /**
   * Restore deactivated account
   * POST /api/auth/restore
   */
  restoreAccount: async (restorationToken?: string): Promise<AuthResponse> => {
    const payload = restorationToken ? { restorationToken: restorationToken.trim() } : {}
    const res = (await api.post('/auth/restore', payload)) as any

    const token = res.token || res.data?.token
    const rawUser = res.data?.user || res.user

    if (!token || !rawUser) {
      throw new Error('Invalid restoration response from server.')
    }

    return {
      token,
      user: {
        id: (rawUser.id || rawUser._id) as string,
        email: rawUser.email,
        name: rawUser.name,
        authProvider: rawUser.authProvider,
        isVerified: rawUser.isVerified,
        isDeactivated: rawUser.isDeactivated,
        createdAt: rawUser.createdAt,
      },
    }
  },
}

export default authApi

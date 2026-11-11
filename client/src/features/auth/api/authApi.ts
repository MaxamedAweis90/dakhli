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

export const authApi = {
  /**
   * Log in user with email & password
   */
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    const res = (await api.post('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    })) as ApiResponse<AuthResponseData>

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
  googleAuth: async (credentialOrToken: string): Promise<AuthResponse> => {
    const res = (await api.post('/auth/google', {
      credential: credentialOrToken,
      idToken: credentialOrToken,
    })) as ApiResponse<AuthResponseData>

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
        createdAt: rawUser.createdAt,
      },
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
      createdAt: rawUser.createdAt,
    }
  },
}

export default authApi

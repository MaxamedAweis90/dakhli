import { create } from 'zustand'
import { TOKEN_STORAGE_KEY, AUTH_UNAUTHORIZED_EVENT } from '@/lib/api'
import type { AuthState, AuthUser } from '@/types/store'
import { authApi } from '@/features/auth/api/authApi'

const USER_STORAGE_KEY = 'dakhli_user'

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  isLoading: true,

  setSession: (token: string, user: AuthUser) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } catch {
      // Ignore storage write errors in restricted sandbox environments
    }
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  clearSession: () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      // Ignore storage remove errors
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  initialize: async () => {
    set({ isLoading: true })
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null
      if (!token) {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      // Fast-path cached user from localStorage
      const rawUser = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null
      const cachedUser: AuthUser | null = rawUser ? JSON.parse(rawUser) : null

      // Support 1-click dev demo session
      if (token === 'demo-jwt-token') {
        await new Promise((resolve) => setTimeout(resolve, 500))
        set({
          token,
          user: cachedUser || { id: 'demo-user-id', email: 'demo@dakhli.app', name: 'Demo User' },
          isAuthenticated: true,
          isLoading: false,
        })
        return
      }

      // Rehydrate user session via backend /auth/me
      try {
        const minDelay = new Promise((resolve) => setTimeout(resolve, 500))
        const [user] = await Promise.all([authApi.getMe(), minDelay])
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
        } catch {
          // ignore
        }
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch {
        // If rehydration fails or token invalid, purge storage
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          localStorage.removeItem(USER_STORAGE_KEY)
        } catch {
          // ignore
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))

// Auto-listen to 401 unauthorized event dispatched from Axios interceptor
if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => {
    useAuthStore.getState().clearSession()
  })
}

export default useAuthStore

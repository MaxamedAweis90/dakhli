import { create } from 'zustand'
import { TOKEN_STORAGE_KEY, AUTH_UNAUTHORIZED_EVENT } from '@/lib/api'
import type { AuthState, AuthUser } from '@/types/store'

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

  initialize: () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null
      const rawUser = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null
      const user: AuthUser | null = rawUser ? JSON.parse(rawUser) : null

      if (token) {
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        })
        return
      }
    } catch {
      // Fallback on corrupt payload
    }

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },
}))

// Auto-listen to 401 unauthorized event dispatched from Axios interceptor
if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => {
    useAuthStore.getState().clearSession()
  })
}

export default useAuthStore

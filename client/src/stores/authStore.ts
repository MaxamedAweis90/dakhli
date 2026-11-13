import { create } from 'zustand'
import { TOKEN_STORAGE_KEY, AUTH_UNAUTHORIZED_EVENT } from '@/lib/api'
import type { AuthState, AuthUser } from '@/types/store'
import { authApi } from '@/features/auth/api/authApi'
import { useOverheadsStore } from '@/stores/overheadsStore'

const USER_STORAGE_KEY = 'dakhli_user'

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  isLoading: true,
  isInitialized: false,

  setSession: (token: string, user: AuthUser) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } catch {
      // Ignore storage write errors in restricted sandbox environments
    }
    // Always reset overhead cycle to real current month upon session start
    useOverheadsStore.getState().jumpToCurrentMonth()
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    })
  },

  updateUser: (partialUser: Partial<AuthUser>) => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...partialUser }
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Ignore storage write errors
    }
    set({ user: updated })
  },

  clearSession: () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      // Ignore storage remove errors
    }
    useOverheadsStore.getState().jumpToCurrentMonth()
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    })
  },

  initialize: async () => {
    // If already initialized once during this app lifecycle, don't run again or toggle isLoading
    if (get().isInitialized) {
      return
    }

    set({ isLoading: true })
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null
      if (!token) {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        })
        return
      }

      // Fast-path cached user from localStorage for instant UI rendering
      const rawUser = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null
      const cachedUser: AuthUser | null = rawUser ? JSON.parse(rawUser) : null
      if (cachedUser) {
        set({ user: cachedUser, isAuthenticated: true })
      }

      // Rehydrate user session via backend /auth/me
      try {
        const minDelay = new Promise((resolve) => setTimeout(resolve, 350))
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
          isInitialized: true,
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
          isInitialized: true,
        })
      }
    } catch {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
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

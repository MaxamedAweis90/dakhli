import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi, isDeactivatedResponse } from '@/features/auth/api/authApi'

export function useGoogleOneTap() {
  const navigate = useNavigate()
  const { isAuthenticated, setSession } = useAuthStore()
  const isInitializedRef = useRef(false)

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '966850773364-nf30jee4njbvvvq3l63ekqmmsqq2h9o5.apps.googleusercontent.com'

  useEffect(() => {
    // Only trigger One-Tap on landing page if user is not already logged in
    if (isAuthenticated || isInitializedRef.current || !googleClientId) {
      return
    }

    let isMounted = true

    const triggerOneTap = () => {
      if (!isMounted || !window.google?.accounts?.id || isInitializedRef.current) {
        return
      }

      try {
        isInitializedRef.current = true

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response?.credential) return

            try {
              const res = await authApi.googleAuth({ credential: response.credential })

              if (isDeactivatedResponse(res)) {
                try {
                  sessionStorage.setItem('dakhli_restoration', JSON.stringify(res))
                } catch {
                  // ignore storage error
                }
                navigate('/account-deactivated', {
                  state: {
                    email: res.email,
                    name: res.name,
                    deletionScheduledAt: res.deletionScheduledAt,
                    restorationToken: res.restorationToken,
                  },
                })
                return
              }

              setSession(res.token, res.user)
              navigate('/', { replace: true })
            } catch (err) {
              console.warn('Google One-Tap authentication error:', err)
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        // Prompt user with One-Tap (only on Landing Page)
        window.google.accounts.id.prompt()
      } catch {
        // One-Tap is progressive enhancement; silently ignore browser restrictions
      }
    }

    if (window.google?.accounts?.id) {
      triggerOneTap()
    } else {
      const timer = setTimeout(triggerOneTap, 1200)
      return () => {
        isMounted = false
        clearTimeout(timer)
      }
    }

    return () => {
      isMounted = false
      try {
        window.google?.accounts?.id?.cancel()
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated, googleClientId, navigate, setSession])
}


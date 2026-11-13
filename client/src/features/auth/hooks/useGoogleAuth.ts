import { useState, useCallback } from 'react'

export interface GoogleAuthPayload {
  code?: string
  credential?: string
  idToken?: string
  token?: string
  accessToken?: string
}

interface UseGoogleAuthOptions {
  onSuccess: (payload: GoogleAuthPayload) => Promise<void>
}

/**
 * Hook for Google OAuth button flow using the official GIS popup Code Client.
 * Exclusively used on Auth screens (Login / Register) without triggering One-Tap.
 */
export function useGoogleAuth({ onSuccess }: UseGoogleAuthOptions) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '966850773364-nf30jee4njbvvvq3l63ekqmmsqq2h9o5.apps.googleusercontent.com'

  // Ensure Google Identity Services script is available
  const ensureGsiLoaded = useCallback((): Promise<void> => {
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
      if (existing) {
        let attempts = 0
        const interval = setInterval(() => {
          attempts++
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval)
            resolve()
          } else if (attempts > 50) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        let attempts = 0
        const interval = setInterval(() => {
          attempts++
          if (window.google?.accounts?.oauth2) {
            clearInterval(interval)
            resolve()
          } else if (attempts > 30) {
            clearInterval(interval)
            resolve()
          }
        }, 50)
      }
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services. Check your connection or ad blocker.'))
      }
      document.head.appendChild(script)
    })
  }, [])

  // Trigger Google Login popup via official Google Identity Services Code Client
  const triggerGoogleLogin = useCallback(async () => {
    setGoogleError(null)
    setIsGoogleLoading(true)

    try {
      if (!googleClientId) {
        throw new Error('Google Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID.')
      }

      await ensureGsiLoaded()

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services failed to load. Please check your browser or network.')
      }

      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        select_account: true,
        callback: async (response) => {
          if (response.error) {
            setIsGoogleLoading(false)
            if (response.error === 'popup_closed_by_user') {
              // User dismissed popup normally; no error banner needed
              return
            }
            if (response.error === 'access_denied') {
              setGoogleError('Google sign-in was cancelled.')
              return
            }
            setGoogleError(response.error_description || response.error || 'Google authentication was not completed.')
            return
          }

          if (response.code) {
            try {
              await onSuccess({ code: response.code })
            } catch (err: any) {
              setGoogleError(err?.message || 'Google authentication failed.')
            } finally {
              setIsGoogleLoading(false)
            }
          } else {
            setIsGoogleLoading(false)
          }
        },
        error_callback: (error) => {
          setIsGoogleLoading(false)
          if (error.type === 'popup_closed') {
            return
          }
          if (error.type === 'popup_failed_to_open') {
            setGoogleError('Popup was blocked by your browser. Please allow popups for this site to sign in with Google.')
            return
          }
          setGoogleError(error.message || 'Google sign-in popup encountered an error.')
        },
      })

      // Launch the official Google account chooser popup window
      codeClient.requestCode()
    } catch (err: any) {
      setIsGoogleLoading(false)
      setGoogleError(err?.message || 'Could not initiate Google authentication.')
    }
  }, [ensureGsiLoaded, googleClientId, onSuccess])

  return {
    triggerGoogleLogin,
    isGoogleLoading,
    googleError,
    setGoogleError,
    googleClientId,
  }
}

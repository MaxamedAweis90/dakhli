// Google Identity Services (GIS) Global Declarations

export interface GoogleCodeResponse {
  code?: string
  error?: string
  error_description?: string
  error_uri?: string
  state?: string
}

export interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
  error_uri?: string
  expires_in?: number
  state?: string
}

export interface GoogleCredentialResponse {
  credential?: string
  select_by?: string
  clientId?: string
}

export interface GoogleCodeClientConfig {
  client_id: string
  scope: string
  ux_mode?: 'popup' | 'redirect'
  redirect_uri?: string
  state?: string
  select_account?: boolean
  callback?: (response: GoogleCodeResponse) => void
  error_callback?: (error: { type: string; message: string }) => void
}

export interface GoogleTokenClientConfig {
  client_id: string
  scope: string
  callback?: (response: GoogleTokenResponse) => void
  error_callback?: (error: { type: string; message: string }) => void
}

export interface GoogleIdConfig {
  client_id: string
  callback?: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: 'signin' | 'signup' | 'use'
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: GoogleIdConfig) => void
          renderButton: (parent: HTMLElement, options: Record<string, any>) => void
          prompt: (notification?: (notification: any) => void) => void
          cancel: () => void
          disableAutoSelect: () => void
        }
        oauth2?: {
          initCodeClient: (config: GoogleCodeClientConfig) => {
            requestCode: () => void
          }
          initTokenClient: (config: GoogleTokenClientConfig) => {
            requestAccessToken: (overrideConfig?: Record<string, any>) => void
          }
          hasGrantedAllScopes: (
            tokenResponse: GoogleTokenResponse,
            firstScope: string,
            ...restScopes: string[]
          ) => boolean
          hasGrantedAnyScope: (
            tokenResponse: GoogleTokenResponse,
            firstScope: string,
            ...restScopes: string[]
          ) => boolean
          revoke: (accessToken: string, done?: () => void) => void
        }
      }
    }
  }
}


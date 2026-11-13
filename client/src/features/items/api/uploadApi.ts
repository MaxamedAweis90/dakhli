import { api } from '@/lib/api'

export const MAX_ITEM_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_AVATAR_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

export const ALLOWED_ITEM_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]

export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export interface ValidateImageOptions {
  isAvatar?: boolean
  maxSizeOverride?: number
}

/**
 * Validates image size and MIME type on the client before network transmission.
 */
export const validateImageFile = (
  file: File,
  options: ValidateImageOptions = {}
): { valid: boolean; error?: string } => {
  const isAvatar = Boolean(options.isAvatar)
  const maxSize = options.maxSizeOverride || (isAvatar ? MAX_AVATAR_IMAGE_SIZE : MAX_ITEM_IMAGE_SIZE)
  const allowedMimes = isAvatar ? ALLOWED_AVATAR_MIME_TYPES : ALLOWED_ITEM_MIME_TYPES
  const label = isAvatar ? 'Avatar' : 'Item'
  const maxMb = Math.round(maxSize / (1024 * 1024))

  if (!file) {
    return { valid: false, error: 'No file selected.' }
  }

  const mime = (file.type || '').toLowerCase()
  if (!allowedMimes.includes(mime)) {
    const readableFormats = isAvatar ? 'JPEG, PNG, or WebP' : 'JPEG, PNG, WebP, or AVIF'
    return {
      valid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Please choose a ${readableFormats} file.`,
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `${label} image exceeds the maximum allowed size of ${maxMb}MB.`,
    }
  }

  return { valid: true }
}

export interface UploadSessionResponse {
  sessionId: string
  expiresAt: string
}

export interface SessionStatusResponse {
  sessionId: string
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED'
  imageUrl?: string
  expiresAt: string
}

export interface DirectUploadResponse {
  imageUrl: string
  pathname?: string
  provider: 'vercel-blob' | 'fallback-data-url'
  folder?: 'items' | 'avatars'
  user?: any
}

export const uploadApi = {
  /**
   * Dedicated upload for user profile avatars (2MB limit, destination 'avatars/').
   * Automatically persists avatar to user database record.
   */
  uploadAvatar: async (file: File): Promise<DirectUploadResponse> => {
    const validation = validateImageFile(file, { isAvatar: true })
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = (await api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as {
      success: boolean
      data: DirectUploadResponse
    }
    return res.data
  },

  /**
   * Dedicated upload for item registry images (5MB limit, destination 'items/').
   */
  uploadItem: async (file: File): Promise<DirectUploadResponse> => {
    const validation = validateImageFile(file, { isAvatar: false })
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = (await api.post('/upload/item', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as {
      success: boolean
      data: DirectUploadResponse
    }
    return res.data
  },

  /**
   * Direct file upload supporting folder parameter ('items' | 'avatars').
   */
  uploadDirect: async (
    file: File,
    folder: 'items' | 'avatars' = 'items'
  ): Promise<DirectUploadResponse> => {
    const validation = validateImageFile(file, { isAvatar: folder === 'avatars' })
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = (await api.post(`/upload/direct?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as {
      success: boolean
      data: DirectUploadResponse
    }
    return res.data
  },

  /**
   * Create QR code cross-device upload session.
   */
  createSession: async (): Promise<UploadSessionResponse> => {
    const res = (await api.post('/upload/session')) as {
      success: boolean
      data: UploadSessionResponse
    }
    return res.data
  },

  /**
   * Check status of a cross-device QR upload session.
   */
  getSession: async (sessionId: string): Promise<SessionStatusResponse> => {
    const res = (await api.get(`/upload/session/${sessionId}`)) as {
      success: boolean
      data: SessionStatusResponse
    }
    return res.data
  },

  /**
   * Upload to QR session from mobile phone (5MB limit, destination 'items/').
   */
  uploadToSession: async (
    sessionId: string,
    file: File
  ): Promise<{ imageUrl: string }> => {
    const validation = validateImageFile(file, { isAvatar: false })
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = (await api.post(`/upload/session/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as {
      success: boolean
      data: { imageUrl: string }
    }
    return res.data
  },

  /**
   * Trigger folder initialization in 'dakhli-item-assets'.
   */
  initFolders: async (): Promise<{ success: boolean; message: string }> => {
    const res = (await api.post('/upload/init')) as {
      success: boolean
      data: { success: boolean; message: string }
    }
    return res.data
  },
}

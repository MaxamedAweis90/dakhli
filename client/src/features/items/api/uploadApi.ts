import { api } from '@/lib/api'

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
  provider: 'vercel-blob' | 'fallback-data-url'
}

export const uploadApi = {
  createSession: async (): Promise<UploadSessionResponse> => {
    const res = (await api.post('/upload/session')) as {
      success: boolean
      data: UploadSessionResponse
    }
    return res.data
  },

  getSession: async (sessionId: string): Promise<SessionStatusResponse> => {
    const res = (await api.get(`/upload/session/${sessionId}`)) as {
      success: boolean
      data: SessionStatusResponse
    }
    return res.data
  },

  uploadToSession: async (
    sessionId: string,
    file: File
  ): Promise<{ imageUrl: string }> => {
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

  uploadDirect: async (file: File): Promise<DirectUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = (await api.post('/upload/direct', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as {
      success: boolean
      data: DirectUploadResponse
    }
    return res.data
  },
}


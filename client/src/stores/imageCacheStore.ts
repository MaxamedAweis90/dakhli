import { create } from 'zustand'

interface ImageCacheState {
  loadedUrls: Set<string>
  failedUrls: Set<string>
  markLoaded: (url: string) => void
  markFailed: (url: string) => void
  isLoaded: (url: string) => boolean
  hasFailed: (url: string) => boolean
  clearCache: () => void
}

/**
 * Zustand in-memory image cache.
 * Tracks successfully loaded and decoded image URLs to eliminate
 * layout shift, flicker, and redundant shimmer skeletons when re-rendering
 * previously viewed cards or switching tabs.
 */
export const useImageCacheStore = create<ImageCacheState>((set, get) => ({
  loadedUrls: new Set<string>(),
  failedUrls: new Set<string>(),

  markLoaded: (url: string) => {
    if (!url) return
    const current = get().loadedUrls
    if (current.has(url)) return
    const next = new Set(current)
    next.add(url)
    set({ loadedUrls: next })
  },

  markFailed: (url: string) => {
    if (!url) return
    const current = get().failedUrls
    if (current.has(url)) return
    const next = new Set(current)
    next.add(url)
    set({ failedUrls: next })
  },

  isLoaded: (url: string) => {
    if (!url) return false
    return get().loadedUrls.has(url)
  },

  hasFailed: (url: string) => {
    if (!url) return false
    return get().failedUrls.has(url)
  },

  clearCache: () => {
    set({ loadedUrls: new Set<string>(), failedUrls: new Set<string>() })
  },
}))

import React, { useState, useEffect, useRef } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useImageCacheStore } from '@/stores/imageCacheStore'

export interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  alt?: string
  containerClassName?: string
  fallbackIcon?: React.ReactNode
  fallbackText?: string
  rootMargin?: string
  showSkeleton?: boolean
}

/**
 * Resolves an image URL into a fully-qualified browser-fetchable URL.
 * Automatically handles API proxy paths, absolute URLs, data URLs, and relative paths.
 */
export const resolveImageUrl = (src?: string | null): string => {
  if (!src) return ''
  if (
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  ) {
    return src
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'
  try {
    const urlObj = new URL(apiBase)
    const origin = urlObj.origin
    if (src.startsWith('/')) {
      return `${origin}${src}`
    }
    return `${origin}/${src}`
  } catch {
    return src
  }
}

/**
 * High-performance LazyImage component.
 * Features:
 * - IntersectionObserver: only loads when scrolled into viewport (+150px margin).
 * - Zustand in-memory cache: instant 0ms render for previously decoded images (no flicker).
 * - Offscreen image decoding via HTMLImageElement.decode().
 * - Smooth CSS fade-in transition once fully ready.
 * - Fluid shimmer skeleton while loading.
 * - Graceful fallback badge on network failure or invalid image URL.
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = 'Image',
  className,
  containerClassName,
  fallbackIcon,
  fallbackText,
  rootMargin = '150px 0px',
  showSkeleton = true,
  ...imgProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const resolvedSrc = resolveImageUrl(src)

  const { markLoaded, markFailed, isLoaded: checkCached, hasFailed: checkFailed } = useImageCacheStore()

  const isCached = resolvedSrc ? checkCached(resolvedSrc) : false
  const isFailedInCache = resolvedSrc ? checkFailed(resolvedSrc) : false

  const [isInView, setIsInView] = useState<boolean>(isCached)
  const [isLoaded, setIsLoaded] = useState<boolean>(isCached)
  const [hasError, setHasError] = useState<boolean>(!resolvedSrc || isFailedInCache)

  // Sync with prop changes
  useEffect(() => {
    if (!resolvedSrc) {
      setHasError(true)
      setIsLoaded(false)
      return
    }

    if (checkCached(resolvedSrc)) {
      setIsLoaded(true)
      setHasError(false)
      setIsInView(true)
      return
    }

    if (checkFailed(resolvedSrc)) {
      setHasError(true)
      setIsLoaded(false)
      return
    }

    setHasError(false)
    setIsLoaded(false)
  }, [resolvedSrc, checkCached, checkFailed])

  // Setup IntersectionObserver for when-in-view triggering
  useEffect(() => {
    if (isInView || isLoaded || !resolvedSrc || hasError) return

    const el = containerRef.current
    if (!el) return

    // If IntersectionObserver is not supported, load immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [isInView, isLoaded, resolvedSrc, hasError, rootMargin])

  // Perform background decode once in view
  useEffect(() => {
    if (!isInView || isLoaded || !resolvedSrc || hasError) return

    let isSubscribed = true
    const img = new Image()
    img.src = resolvedSrc

    const handleSuccess = async () => {
      if (!isSubscribed) return
      try {
        if ('decode' in img) {
          await img.decode()
        }
      } catch {
        // Fallback gracefully if decode() rejects
      }
      if (!isSubscribed) return
      markLoaded(resolvedSrc)
      setIsLoaded(true)
    }

    const handleError = () => {
      if (!isSubscribed) return
      markFailed(resolvedSrc)
      setHasError(true)
    }

    img.onload = handleSuccess
    img.onerror = handleError

    return () => {
      isSubscribed = false
      img.onload = null
      img.onerror = null
    }
  }, [isInView, isLoaded, resolvedSrc, hasError, markLoaded, markFailed])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden w-full h-full flex items-center justify-center bg-[#1F2128]',
        containerClassName
      )}
    >
      {/* Shimmer skeleton while in-view and loading */}
      {showSkeleton && !isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 bg-[#252833] animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        </div>
      )}

      {/* Graceful Fallback on error or empty src */}
      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 p-3 text-slate-500 bg-[#1A1C23]">
          {fallbackIcon || <ImageIcon className="w-6 h-6 text-slate-600 stroke-[1.5]" />}
          {fallbackText && (
            <span className="text-[0.68rem] font-mono text-slate-400 text-center truncate max-w-full">
              {fallbackText}
            </span>
          )}
        </div>
      )}

      {/* Main Image */}
      {resolvedSrc && !hasError && (
        <img
          {...imgProps}
          src={isInView || isLoaded ? resolvedSrc : undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => {
            markFailed(resolvedSrc)
            setHasError(true)
          }}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300 ease-out select-none',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
        />
      )}
    </div>
  )
}

export default LazyImage

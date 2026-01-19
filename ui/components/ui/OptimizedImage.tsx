'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ImageOff, Loader2 } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  onLoad?: () => void
  onError?: () => void
  fallback?: React.ReactNode
}

/**
 * Optimized Image Component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Loading placeholder with blur effect
 * - Error fallback
 * - Smooth fade-in animation
 * - Memory-efficient with cleanup
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'blur',
  onLoad,
  onError,
  fallback,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!priority)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '100px', // Start loading 100px before in view
        threshold: 0.1,
      }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [priority])

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  // Handle image error
  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Show fallback if error
  if (hasError) {
    return (
      fallback || (
        <div
          className={`flex items-center justify-center bg-oa-bg-secondary ${className}`}
          style={{ width, height }}
        >
          <div className="flex flex-col items-center gap-2 text-oa-text-secondary">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-oa-bg-secondary">
          {placeholder === 'blur' ? (
            <div className="absolute inset-0 bg-gradient-to-br from-oa-bg-secondary to-oa-border animate-pulse" />
          ) : null}
          <Loader2 className="w-6 h-6 text-oa-text-secondary animate-spin" />
        </div>
      )}

      {/* Actual image - only render if in view */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className={`w-full h-full object-cover ${isLoading ? 'invisible' : ''}`}
        />
      )}
    </div>
  )
}

/**
 * Image Gallery with optimized loading
 */
export function OptimizedImageGallery({
  images,
  columns = 3,
  gap = 4,
  onImageClick,
}: {
  images: Array<{ src: string; alt: string; id?: string }>
  columns?: number
  gap?: number
  onImageClick?: (index: number) => void
}) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 4}px`,
      }}
    >
      {images.map((image, index) => (
        <motion.div
          key={image.id || index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="aspect-square cursor-pointer"
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            className="rounded-lg"
          />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Avatar with fallback
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallbackInitials,
  className = '',
}: {
  src?: string
  alt: string
  size?: number
  fallbackInitials?: string
  className?: string
}) {
  const [hasError, setHasError] = useState(false)

  // Generate initials from alt text
  const initials = fallbackInitials || alt
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-oa-accent/20 text-oa-accent font-medium ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority
      className={`rounded-full ${className}`}
      onError={() => setHasError(true)}
    />
  )
}

export default OptimizedImage

import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-oa-border/40 rounded ${className}`}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`p-3 rounded-lg border border-oa-border bg-oa-bg-secondary ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonList({ items = 3, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  )
}

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  }

  return (
    <div
      className={`${sizeClasses[size]} border-oa-border border-t-oa-accent rounded-full animate-spin ${className}`}
    />
  )
}

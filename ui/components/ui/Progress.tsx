// Minimal progress bar (simple line)

import React from 'react'

interface ProgressProps {
  value: number // 0-100
  className?: string
}

export function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`h-0.5 bg-oa-border overflow-hidden ${className}`}>
      <div
        className="h-full bg-oa-text-primary transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// Minimal card component with border (no shadows)

import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '', onClick, ...props }: CardProps) {
  return (
    <div
      className={`bg-oa-bg-primary border border-oa-border p-6 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

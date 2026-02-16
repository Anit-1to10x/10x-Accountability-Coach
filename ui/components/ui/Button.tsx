// Minimal black & white button component

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  children: React.ReactNode
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-4 py-2 text-sm font-medium transition-all duration-150'

  const variantStyles = {
    primary: 'border border-oa-text-primary bg-oa-bg-primary text-oa-text-primary hover:bg-oa-text-primary hover:text-oa-bg-primary',
    secondary: 'border border-oa-border text-oa-text-secondary hover:border-oa-text-primary hover:text-oa-text-primary',
    outline: 'border border-oa-border text-oa-text-primary hover:border-oa-accent hover:bg-oa-bg-secondary bg-transparent',
    ghost: 'text-oa-text-primary hover:bg-oa-bg-secondary bg-transparent border-none',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

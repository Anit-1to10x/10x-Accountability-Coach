'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface AnimatedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function AnimatedButton({
  children,
  onClick,
  icon: Icon,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button',
}: AnimatedButtonProps) {
  const baseClasses = 'relative font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-oa-accent text-white hover:bg-oa-accent-hover focus:ring-oa-accent shadow-sm hover:shadow-md',
    secondary: 'bg-oa-bg-secondary border border-oa-border text-oa-text-primary hover:border-oa-accent hover:bg-oa-bg-tertiary focus:ring-oa-accent',
    ghost: 'text-oa-text-primary hover:bg-oa-bg-secondary focus:ring-oa-text-secondary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    outline: 'border border-oa-border text-oa-text-primary hover:border-oa-accent hover:bg-oa-bg-secondary focus:ring-oa-accent bg-transparent',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      <span className="flex items-center justify-center gap-2">
        {Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
        {children}
      </span>
    </motion.button>
  )
}

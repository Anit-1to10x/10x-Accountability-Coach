// Minimal input component

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-oa-text-secondary">{label}</label>
      )}
      <input
        className={`bg-oa-bg-primary border border-oa-border text-oa-text-primary px-3 py-2 text-sm focus:outline-none focus:border-oa-text-primary transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}

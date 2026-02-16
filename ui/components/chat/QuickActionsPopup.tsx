'use client'

import React from 'react'
import { Plus, Image, X, CheckCircle2 } from 'lucide-react'
import type { Agent } from '@/types'

interface QuickActionsPopupProps {
  isOpen: boolean
  onClose: () => void
  agent?: Agent
  onActionClick: (actionId: string) => void
}

export function QuickActionsPopup({ isOpen, onClose, agent, onActionClick }: QuickActionsPopupProps) {
  if (!isOpen) return null

  // Use agent's quick actions
  const quickActions = agent?.quickActions || []

  // Default actions if agent doesn't have any
  const defaultActions = [
    { id: 'new-challenge', label: 'New Challenge', icon: 'plus' },
    { id: 'quick-checkin', label: 'Quick Check-in', icon: 'check' },
    { id: 'vision-board', label: 'Create Vision Board', icon: 'image' },
  ]

  const actions = quickActions.length > 0 ? quickActions : defaultActions

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'plus':
        return <Plus size={18} />
      case 'image':
        return <Image size={18} />
      case 'check':
        return <CheckCircle2 size={18} />
      default:
        return <Plus size={18} />
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="absolute bottom-full right-0 mb-2 w-64 bg-oa-bg-secondary border border-oa-border rounded-lg shadow-xl z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-oa-border">
          <h3 className="text-sm font-semibold text-oa-text-primary">Quick Actions</h3>
          <button
            onClick={onClose}
            className="text-oa-text-secondary hover:text-oa-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions List */}
        <div className="p-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                onActionClick(action.id)
                onClose()
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-oa-text-primary hover:bg-oa-bg-tertiary rounded-lg transition-colors"
            >
              <div className="text-oa-accent">
                {getIcon(action.icon)}
              </div>
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {actions.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-oa-text-secondary">
            No quick actions available
          </div>
        )}
      </div>
    </>
  )
}

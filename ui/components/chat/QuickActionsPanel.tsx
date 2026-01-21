'use client'

import React from 'react'
import { TrendingUp, Code, Pencil, BookOpen, Heart } from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  prompt: string
}

interface QuickActionsPanelProps {
  onActionClick?: (prompt: string) => void
  agent?: any
  onCheckinClick?: () => void
  onCreateSkillClick?: () => void
}

const quickActions: QuickAction[] = [
  {
    id: 'strategize',
    label: 'Strategize',
    icon: <TrendingUp size={16} />,
    prompt: 'Help me create a strategy for achieving my goals. What should I focus on?'
  },
  {
    id: 'code',
    label: 'Code',
    icon: <Code size={16} />,
    prompt: 'I need help with a coding or technical task. Can you assist me?'
  },
  {
    id: 'write',
    label: 'Write',
    icon: <Pencil size={16} />,
    prompt: 'Help me write something. What would you like me to create?'
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: <BookOpen size={16} />,
    prompt: 'I want to learn something new today. What topics are you interested in?'
  },
  {
    id: 'life',
    label: 'Life stuff',
    icon: <Heart size={16} />,
    prompt: 'I need some life advice or help with personal matters.'
  }
]

export function QuickActionsPanel({ onActionClick }: QuickActionsPanelProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 py-4">
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick?.(action.prompt)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-oa-bg-secondary/50 hover:bg-oa-bg-secondary border border-oa-border rounded-full text-sm text-oa-text-primary transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-oa-text-secondary">{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}

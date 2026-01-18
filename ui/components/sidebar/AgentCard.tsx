'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Agent, AgentColor } from '@/types'
import { useNavigationStore } from '@/lib/store'

interface AgentCardProps {
  agent: Agent
  isActive: boolean
  onClick: () => void
}

// Color configurations for agent cards
const agentColorStyles: Record<AgentColor | 'default', { bg: string; border: string; text: string; activeBg: string }> = {
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    activeBg: 'bg-purple-500'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    activeBg: 'bg-blue-500'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-300',
    activeBg: 'bg-green-500'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    activeBg: 'bg-orange-500'
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-300',
    activeBg: 'bg-pink-500'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-300',
    activeBg: 'bg-cyan-500'
  },
  default: {
    bg: 'bg-oa-accent/10',
    border: 'border-oa-accent/30',
    text: 'text-oa-accent',
    activeBg: 'bg-oa-accent'
  }
}

export function AgentCard({ agent, isActive, onClick }: AgentCardProps) {
  const router = useRouter()
  const { activeType, activeId, setActive } = useNavigationStore()

  const handleClick = () => {
    setActive('agent', agent.id)
    onClick()
    router.push(`/agent/${agent.id}`)
  }

  const isActiveSelection = activeType === 'agent' && activeId === agent.id
  const colorStyle = agentColorStyles[agent.color || 'default']

  return (
    <motion.button
      onClick={handleClick}
      className={`
        w-full text-left mx-3 px-4 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200 border
        ${
          isActiveSelection
            ? `${colorStyle.activeBg} text-white shadow-md border-transparent`
            : `${colorStyle.bg} ${colorStyle.border} text-oa-text-primary hover:${colorStyle.bg.replace('/10', '/20')}`
        }
      `}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      <div className="flex items-center gap-3">
        <motion.span
          className={`text-lg w-8 h-8 flex items-center justify-center rounded-md ${
            isActiveSelection ? 'bg-white/20' : colorStyle.bg
          }`}
          animate={{ rotate: isActiveSelection ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          {agent.icon}
        </motion.span>
        <span className={isActiveSelection ? 'text-white' : colorStyle.text}>
          {agent.name}
        </span>
      </div>
    </motion.button>
  )
}

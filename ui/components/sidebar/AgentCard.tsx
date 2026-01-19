'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { Agent, AgentColor } from '@/types'
import { useNavigationStore, useAgentStore } from '@/lib/store'

interface AgentCardProps {
  agent: Agent
  isActive: boolean
  onClick: () => void
  mode?: 'navigate' | 'select' // navigate = go to agent page, select = toggle selection
}

// Color configurations for agent cards
const agentColorStyles: Record<AgentColor | 'default', { bg: string; border: string; text: string; activeBg: string; glow: string }> = {
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    text: 'text-purple-300',
    activeBg: 'bg-purple-500',
    glow: 'shadow-purple-500/30'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    text: 'text-blue-300',
    activeBg: 'bg-blue-500',
    glow: 'shadow-blue-500/30'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    text: 'text-green-300',
    activeBg: 'bg-green-500',
    glow: 'shadow-green-500/30'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/50',
    text: 'text-orange-300',
    activeBg: 'bg-orange-500',
    glow: 'shadow-orange-500/30'
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/50',
    text: 'text-pink-300',
    activeBg: 'bg-pink-500',
    glow: 'shadow-pink-500/30'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/50',
    text: 'text-cyan-300',
    activeBg: 'bg-cyan-500',
    glow: 'shadow-cyan-500/30'
  },
  default: {
    bg: 'bg-oa-accent/10',
    border: 'border-oa-accent/50',
    text: 'text-oa-accent',
    activeBg: 'bg-oa-accent',
    glow: 'shadow-oa-accent/30'
  }
}

export function AgentCard({ agent, isActive, onClick, mode = 'select' }: AgentCardProps) {
  const router = useRouter()
  const { activeType, activeId, setActive } = useNavigationStore()
  const { isAgentSelected, toggleAgentSelection, selectedAgentIds } = useAgentStore()

  const isSelected = isAgentSelected(agent.id)
  const colorStyle = agentColorStyles[agent.color || 'default']

  const handleClick = () => {
    if (mode === 'navigate') {
      setActive('agent', agent.id)
      onClick()
      router.push(`/agent/${agent.id}`)
    } else {
      // Toggle selection mode
      toggleAgentSelection(agent.id)
      onClick()
    }
  }

  const isActiveSelection = activeType === 'agent' && activeId === agent.id

  return (
    <motion.button
      onClick={handleClick}
      className={`
        w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 border relative overflow-hidden
        ${
          isSelected
            ? `${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} shadow-lg ${colorStyle.glow}`
            : 'bg-oa-bg-secondary/30 border-oa-border/50 text-oa-text-secondary/60 opacity-60 hover:opacity-80'
        }
      `}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Agent Icon with color background */}
        <motion.div
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm ${
            isSelected
              ? `${colorStyle.activeBg} shadow-md`
              : 'bg-oa-bg-secondary'
          }`}
          animate={{
            scale: isSelected ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <span className={isSelected ? 'drop-shadow-sm' : 'grayscale opacity-50'}>
            {agent.icon || '🤖'}
          </span>
        </motion.div>

        {/* Agent Name */}
        <div className="flex-1 min-w-0">
          <span className={`block truncate font-medium ${
            isSelected ? colorStyle.text : 'text-oa-text-secondary/60'
          }`}>
            {agent.name}
          </span>
          {isSelected && (
            <span className="text-[10px] text-oa-text-secondary/80">
              {agent.capabilities?.length || 0} capabilities
            </span>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            className={`w-5 h-5 rounded-full ${colorStyle.activeBg} flex items-center justify-center`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Check size={12} className="text-white" />
          </motion.div>
        )}
      </div>

      {/* Active glow effect for selected agents */}
      {isSelected && (
        <motion.div
          className={`absolute inset-0 rounded-xl ${colorStyle.activeBg} opacity-5 pointer-events-none`}
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  )
}

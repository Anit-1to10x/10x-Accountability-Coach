'use client'

import React, { useEffect, useState } from 'react'
import { useAgentStore } from '@/lib/store'
import type { Agent } from '@/types'

interface ChatGreetingProps {
  agentName?: string
  selectedAgents?: Agent[]
}

// Agent color map for badges
const agentColors: Record<string, string> = {
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  default: 'bg-oa-accent/20 text-oa-accent border-oa-accent/30',
}

export function ChatGreeting({ agentName, selectedAgents: propSelectedAgents }: ChatGreetingProps) {
  const [userName, setUserName] = useState<string>('')
  const { getSelectedAgents } = useAgentStore()

  // Use prop if provided, otherwise get from store
  const selectedAgents = propSelectedAgents || getSelectedAgents()

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        const profile = await response.json()
        if (profile.name) {
          // Capitalize first letter
          const capitalizedName = profile.name.charAt(0).toUpperCase() + profile.name.slice(1).toLowerCase()
          setUserName(capitalizedName)
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        setUserName('') // No fallback - will show 'there'
      }
    }
    loadUserProfile()
  }, [])

  const getSubtitle = () => {
    if (agentName) {
      return `Your personal ${agentName}`
    }
    if (selectedAgents.length > 0) {
      const capabilities = selectedAgents.flatMap(a => a.capabilities || [])
      const uniqueCapabilities = [...new Set(capabilities)]
      return `Your personal accountability partner with ${uniqueCapabilities.length} capabilities`
    }
    return 'Connect agents from the sidebar to get started'
  }

  return (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-light italic text-oa-text-primary mb-2">
        {userName ? `Hey, ${userName}` : 'Welcome to 10X Coach'}
      </h1>
      <p className="text-sm text-oa-text-secondary">
        {getSubtitle()}
      </p>

      {/* Connected Agents Display */}
      {selectedAgents.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-oa-text-secondary mb-3">Connected Agents</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selectedAgents.map((agent) => {
              const colorClass = agentColors[agent.color || 'default']
              return (
                <div
                  key={agent.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${colorClass}`}
                >
                  <span>{agent.icon || '🤖'}</span>
                  <span className="font-medium">{agent.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Accountability Coach Indicator */}
      {!agentName && selectedAgents.length > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-full text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-oa-text-primary">
            Accountability Coach - {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} connected
          </span>
        </div>
      )}

      {/* Single Agent Mode */}
      {agentName && (
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-oa-bg-secondary border border-oa-border rounded-full text-xs">
          <div className="w-2 h-2 bg-oa-accent rounded-full"></div>
          <span className="text-oa-text-primary">{agentName} Mode</span>
        </div>
      )}

      {/* No agents selected */}
      {selectedAgents.length === 0 && !agentName && (
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs text-orange-300">
          <span>No agents selected - click agents in sidebar to enable</span>
        </div>
      )}
    </div>
  )
}

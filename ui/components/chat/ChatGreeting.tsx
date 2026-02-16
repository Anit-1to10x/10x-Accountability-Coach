'use client'

import React, { useEffect, useState } from 'react'
import { useAgentStore, useChatStore } from '@/lib/store'
import { addProfileId, useProfileId } from '@/lib/useProfileId'
import type { Agent } from '@/types'

interface ChatGreetingProps {
  agentName?: string
  selectedAgents?: Agent[]
}

// Animated sun/asterisk icon similar to Claude
function AnimatedSunIcon({ isAnimating = false }: { isAnimating?: boolean }) {
  return (
    <div className={`relative ${isAnimating ? 'animate-pulse' : ''}`}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${isAnimating ? 'animate-spin-slow' : ''}`}
        style={{ animationDuration: '8s' }}
      >
        {/* Sun rays */}
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="24"
            y1="4"
            x2="24"
            y2="12"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 24 24)`}
            className={isAnimating ? 'opacity-80' : 'opacity-100'}
          />
        ))}
        {/* Center circle */}
        <circle cx="24" cy="24" r="8" fill="#D97706" />
      </svg>
    </div>
  )
}

export function ChatGreeting({ agentName, selectedAgents: propSelectedAgents }: ChatGreetingProps) {
  const profileId = useProfileId()
  const [userName, setUserName] = useState<string>('')
  const { getSelectedAgents } = useAgentStore()
  const { isTyping, streamingPhase } = useChatStore()

  // Use prop if provided, otherwise get from store
  const selectedAgents = propSelectedAgents || getSelectedAgents()
  const isThinking = isTyping || streamingPhase !== 'idle'

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const url = addProfileId('/api/user/profile', profileId)
        const response = await fetch(url)
        const profile = await response.json()
        if (profile.name) {
          // Capitalize first letter
          const capitalizedName = profile.name.charAt(0).toUpperCase() + profile.name.slice(1).toLowerCase()
          setUserName(capitalizedName)
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        setUserName('')
      }
    }
    loadUserProfile()
  }, [profileId])

  // Get display text based on state
  const getDisplayText = () => {
    const name = userName || 'there'
    if (isThinking) {
      return (
        <>
          <span className="text-oa-text-primary">{name}</span>
          <span className="text-oa-text-secondary"> is thinking</span>
        </>
      )
    }
    return (
      <>
        <span className="text-oa-text-primary">Hi, {name}</span>
      </>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated Sun Icon */}
      <div className="mb-6">
        <AnimatedSunIcon isAnimating={isThinking} />
      </div>

      {/* Main Greeting Text - Claude style */}
      <h1 className="text-4xl md:text-5xl font-light tracking-tight text-center mb-4">
        {getDisplayText()}
      </h1>

      {/* Thinking dots animation */}
      {isThinking && (
        <div className="flex items-center gap-1 mt-2">
          <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {/* Connected agents indicator - minimal style */}
      {selectedAgents.length > 0 && !isThinking && (
        <div className="mt-6 flex items-center gap-2 text-sm text-oa-text-secondary">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>{selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} connected</span>
        </div>
      )}
    </div>
  )
}

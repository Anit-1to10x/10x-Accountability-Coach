'use client'

import React, { useEffect, useState } from 'react'

interface ChatGreetingProps {
  agentName?: string
}

export function ChatGreeting({ agentName }: ChatGreetingProps) {
  const [userName, setUserName] = useState<string>('')

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
    return 'Ask anything - access all users, challenges, and data'
  }

  return (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-light italic text-oa-text-primary mb-2">
        {agentName ? `Hey, ${userName || 'there'}` : `Welcome to 10X Coach`}
      </h1>
      <p className="text-sm text-oa-text-secondary">
        {getSubtitle()}
      </p>
      {!agentName && (
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-full text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-oa-text-primary">Unified Dashboard - All data accessible</span>
        </div>
      )}
      {agentName && (
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-oa-bg-secondary border border-oa-border rounded-full text-xs">
          <div className="w-2 h-2 bg-oa-accent rounded-full"></div>
          <span className="text-oa-text-primary">{agentName} Mode</span>
        </div>
      )}
    </div>
  )
}

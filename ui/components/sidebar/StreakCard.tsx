'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import type { Challenge } from '@/types'

interface StreakCardProps {
  challenge: Challenge
  onCheckin?: (challenge: Challenge) => void
}

export function StreakCard({ challenge, onCheckin }: StreakCardProps) {
  const router = useRouter()

  const handleClick = () => {
    // Trigger check-in flow
    if (onCheckin) {
      onCheckin(challenge)
    } else {
      // Default: navigate to chat with check-in message
      const checkinMessage = encodeURIComponent(`Check in for challenge: ${challenge.name}`)
      router.push(`/chat?agent=accountability-coach&message=${checkinMessage}`)
    }
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/streak/${challenge.id}`)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 rounded-lg border border-oa-border hover:border-oa-accent bg-oa-bg-primary hover:bg-oa-bg-secondary transition-all group cursor-pointer"
    >
      {/* Header with name and progress */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-oa-text-primary group-hover:text-oa-accent transition-colors flex-1 pr-2">
          {challenge.name}
        </h3>
        <span className="text-xs font-medium text-oa-accent bg-oa-accent/10 px-2 py-1 rounded-full">
          {challenge.progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-oa-bg-secondary rounded-full h-1.5 mb-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-oa-accent to-blue-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${challenge.progress}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🔥</span>
          <span className="text-oa-text-primary font-medium">
            {challenge.streak.current} day{challenge.streak.current !== 1 ? 's' : ''}
          </span>
        </div>

        {challenge.streak.best > challenge.streak.current && (
          <div className="flex items-center gap-1.5 text-oa-text-secondary">
            <span>🏆</span>
            <span>{challenge.streak.best} best</span>
          </div>
        )}
      </div>

      {/* Type badge and check-in hint */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-oa-text-secondary capitalize">
          {challenge.type}
        </span>
        <div className="flex items-center gap-1 text-xs text-oa-accent/70 opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageCircle size={12} />
          <span>Check in</span>
        </div>
      </div>
    </button>
  )
}

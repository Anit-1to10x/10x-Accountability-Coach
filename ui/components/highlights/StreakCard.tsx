'use client'

import React from 'react'
import type { Challenge } from '@/types'

interface StreakCardProps {
  challenges: Challenge[]
}

export function StreakCard({ challenges }: StreakCardProps) {
  const activeChallenges = Array.isArray(challenges) ? challenges.filter(c => c.status === 'active') : []
  const bestStreak = activeChallenges.length > 0 ? Math.max(...activeChallenges.map(c => c.streak.best), 0) : 0
  const currentStreak = activeChallenges.length > 0 ? activeChallenges[0].streak.current : 0

  return (
    <div className="p-6 border-b border-oa-border">
      <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-4">Streak</h3>
      <div className="text-center">
        <div className="text-4xl mb-2">🔥</div>
        <div className="text-title font-semibold">{currentStreak} Days</div>
        <div className="text-xs text-oa-text-secondary mt-1">Best: {bestStreak} days</div>
      </div>
    </div>
  )
}

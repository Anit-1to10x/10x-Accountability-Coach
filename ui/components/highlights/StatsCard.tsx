'use client'

import React from 'react'
import type { Challenge } from '@/types'

interface StatsCardProps {
  challenges: Challenge[]
}

export function StatsCard({ challenges }: StatsCardProps) {
  const safeChallenges = Array.isArray(challenges) ? challenges : []
  const activeCount = safeChallenges.filter(c => c.status === 'active').length
  const pausedCount = safeChallenges.filter(c => c.status === 'paused').length
  const completedCount = safeChallenges.filter(c => c.status === 'completed').length

  return (
    <div className="p-6">
      <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-4">Challenges</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Active</span>
          <span className="text-sm font-medium">{activeCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Paused</span>
          <span className="text-sm font-medium">{pausedCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Completed</span>
          <span className="text-sm font-medium">{completedCount}</span>
        </div>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import type { Challenge } from '@/types'
import { Progress } from '@/components/ui'

interface ObjectiveCardProps {
  challenges: Challenge[]
}

export function ObjectiveCard({ challenges }: ObjectiveCardProps) {
  const activeChallenges = Array.isArray(challenges) ? challenges.filter(c => c.status === 'active') : []

  return (
    <div className="p-6 border-b border-oa-border">
      <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-4">Objectives</h3>
      <div className="space-y-4">
        {activeChallenges.slice(0, 3).map((challenge) => (
          <div key={challenge.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate">{challenge.goal}</span>
              <span className="text-xs text-oa-text-secondary">{challenge.progress}%</span>
            </div>
            <Progress value={challenge.progress} />
          </div>
        ))}
        {activeChallenges.length === 0 && (
          <p className="text-sm text-oa-text-secondary">No active objectives</p>
        )}
      </div>
    </div>
  )
}

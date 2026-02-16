'use client'

import React from 'react'
import type { Skill } from '@/types/skill'

interface SkillCardProps {
  skill: Skill
  isAttached: boolean
  onToggle: () => void
}

export function SkillCard({ skill, isAttached, onToggle }: SkillCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'health':
        return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'learning':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      case 'creative':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="p-4 bg-oa-bg-secondary border border-oa-border rounded-lg hover:border-oa-accent/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-oa-text-primary mb-1">
            {skill.name}
          </h3>
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded border ${getCategoryColor(
              skill.category
            )}`}
          >
            {skill.category}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-oa-text-secondary mb-4 line-clamp-2">
        {skill.description}
      </p>

      {/* Action Button */}
      <button
        onClick={onToggle}
        className={`w-full px-3 py-2 text-xs font-medium rounded transition-colors ${
          isAttached
            ? 'bg-oa-accent/10 text-oa-accent border border-oa-accent hover:bg-oa-accent/20'
            : 'bg-oa-bg-tertiary text-oa-text-primary border border-oa-border hover:border-oa-accent'
        }`}
      >
        {isAttached ? 'Remove from Agent' : 'Add to Agent'}
      </button>
    </div>
  )
}

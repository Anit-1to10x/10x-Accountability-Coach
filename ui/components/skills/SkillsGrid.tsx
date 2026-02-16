'use client'

import React, { useState } from 'react'
import { SkillCard } from './SkillCard'
import type { Skill } from '@/types/skill'

interface SkillsGridProps {
  skills: Skill[]
  attachedSkillIds: string[]
  onToggleSkill: (skillId: string) => void
}

export function SkillsGrid({
  skills,
  attachedSkillIds,
  onToggleSkill,
}: SkillsGridProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesCategory =
      categoryFilter === 'all' || skill.category === categoryFilter
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = [
    { value: 'all', label: 'All Skills' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'health', label: 'Health' },
    { value: 'learning', label: 'Learning' },
    { value: 'creative', label: 'Creative' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-sm text-oa-text-primary placeholder:text-oa-text-secondary focus:outline-none focus:border-oa-accent"
        />

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-oa-accent text-white'
                  : 'bg-oa-bg-secondary text-oa-text-secondary border border-oa-border hover:border-oa-accent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Count */}
      <div className="text-sm text-oa-text-secondary">
        Showing {filteredSkills.length} of {skills.length} skills
        {attachedSkillIds.length > 0 && (
          <span className="ml-2">
            ({attachedSkillIds.length} attached to agent)
          </span>
        )}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            isAttached={attachedSkillIds.includes(skill.id)}
            onToggle={() => onToggleSkill(skill.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && (
        <div className="text-center py-12 text-oa-text-secondary">
          <p>No skills found matching your criteria</p>
        </div>
      )}
    </div>
  )
}

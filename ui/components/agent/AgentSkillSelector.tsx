'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, Zap, Search } from 'lucide-react'
import type { Skill } from '@/types/skill'

interface AgentSkillSelectorProps {
  agentId: string
  agentName: string
  currentSkills: string[]
  onClose: () => void
  onSave: (skills: string[]) => void
}

export function AgentSkillSelector({
  agentId,
  agentName,
  currentSkills,
  onClose,
  onSave
}: AgentSkillSelectorProps) {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentSkills)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadAllSkills()
  }, [])

  const loadAllSkills = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/skills')
      const data = await response.json()
      setAllSkills(data.skills || [])
    } catch (error) {
      console.error('Failed to load skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await fetch(`/api/agents/${agentId}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: selectedSkills })
      })
      onSave(selectedSkills)
      onClose()
    } catch (error) {
      console.error('Failed to save skills:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredSkills = allSkills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasChanges = JSON.stringify(selectedSkills.sort()) !== JSON.stringify(currentSkills.sort())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-oa-bg-primary border border-oa-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-oa-border">
          <div>
            <h2 className="text-lg font-semibold text-oa-text-primary">
              Select Skills for {agentName}
            </h2>
            <p className="text-sm text-oa-text-secondary mt-0.5">
              Choose which skills this agent can use
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-oa-text-secondary" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-oa-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-oa-text-secondary" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-sm text-oa-text-primary placeholder:text-oa-text-secondary focus:outline-none focus:border-oa-accent"
            />
          </div>
        </div>

        {/* Skills List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-oa-text-secondary">Loading skills...</div>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Zap className="w-8 h-8 text-oa-text-secondary mb-2" />
              <p className="text-sm text-oa-text-secondary">
                {searchQuery ? 'No skills match your search' : 'No skills available'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSkills.map(skill => {
                const isSelected = selectedSkills.includes(skill.id)
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-oa-accent/10 border border-oa-accent/30'
                        : 'hover:bg-oa-bg-secondary border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-oa-accent text-white'
                        : 'border border-oa-border'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-oa-text-primary">
                        {skill.name}
                      </div>
                      {skill.description && (
                        <div className="text-xs text-oa-text-secondary truncate">
                          {skill.description}
                        </div>
                      )}
                    </div>
                    {skill.format === 'claude-official' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                        Official
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-oa-border bg-oa-bg-secondary/50">
          <div className="text-sm text-oa-text-secondary">
            {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-oa-text-secondary hover:text-oa-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasChanges
                  ? 'bg-oa-accent text-white hover:bg-oa-accent-hover'
                  : 'bg-oa-bg-secondary text-oa-text-secondary cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import type { Agent } from '@/types'
import type { Skill } from '@/types/skill'
import { AgentSkillSelector } from './AgentSkillSelector'

interface AgentSkillsListProps {
  agent: Agent
  onSkillRemoved?: () => void
  onSkillsChanged?: (skills: string[]) => void
}

export function AgentSkillsList({ agent, onSkillRemoved, onSkillsChanged }: AgentSkillsListProps) {
  const [activeSkills, setActiveSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    loadActiveSkills()
  }, [agent.id, agent.skills])

  const loadActiveSkills = async () => {
    try {
      setIsLoading(true)
      const skillsRes = await fetch('/api/skills')
      const skillsData = await skillsRes.json()

      const agentActiveSkills = skillsData.skills?.filter((skill: Skill) =>
        agent.skills?.includes(skill.id)
      ) || []

      setActiveSkills(agentActiveSkills)
    } catch (error) {
      console.error('Failed to load active skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const newSkills = (agent.skills || []).filter((id) => id !== skillId)

      await fetch(`/api/agents/${agent.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: newSkills }),
      })

      await loadActiveSkills()
      onSkillRemoved?.()
      onSkillsChanged?.(newSkills)
    } catch (error) {
      console.error('Failed to remove skill:', error)
    }
  }

  const handleAddSkills = () => {
    setShowSelector(true)
  }

  const handleSkillsSaved = (newSkills: string[]) => {
    loadActiveSkills()
    onSkillsChanged?.(newSkills)
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-oa-text-secondary">Loading skills...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-oa-text-primary">
          Active Skills ({activeSkills.length})
        </h3>
        <button
          onClick={handleAddSkills}
          className="flex items-center gap-1 text-sm text-oa-accent hover:text-oa-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skills</span>
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {activeSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeSkills.map((skill) => (
              <motion.div
                key={skill.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                className="group relative inline-flex items-center gap-2 px-3 py-1.5 bg-oa-accent/10 border border-oa-accent/30 rounded-full hover:border-oa-accent/60 transition-all"
              >
                <span className="text-sm font-medium text-oa-accent">
                  {skill.name}
                </span>
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="p-0.5 text-oa-accent/60 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Remove ${skill.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-oa-text-secondary p-4 bg-oa-bg-secondary border border-oa-border rounded-lg text-center"
          >
            No skills attached yet.{' '}
            <button
              onClick={handleAddSkills}
              className="text-oa-accent hover:underline"
            >
              Browse skills
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Selector Modal */}
      {showSelector && (
        <AgentSkillSelector
          agentId={agent.id}
          agentName={agent.name}
          currentSkills={agent.skills || []}
          onClose={() => setShowSelector(false)}
          onSave={handleSkillsSaved}
        />
      )}
    </div>
  )
}

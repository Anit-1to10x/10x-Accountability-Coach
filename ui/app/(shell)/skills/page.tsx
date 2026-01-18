'use client'

import React, { useEffect, useState } from 'react'
import { useAgentStore } from '@/lib/store'
import { SkillDetailModal } from '@/components/skills/SkillDetailModal'
import { SkillImportModal } from '@/components/skills/SkillImportModal'
import type { Skill } from '@/types/skill'
import { BookOpen, Users, Plus, X, Lock, Package, Sparkles, Gift, Download } from 'lucide-react'
import { SkillRevealModal } from '@/components/skills/SkillRevealModal'

interface SkillPack {
  name: string
  value?: string
  skills: Skill[]
}

export default function SkillsPage() {
  const { agents, activeAgentId, loadAgents } = useAgentStore()
  const [skills, setSkills] = useState<Skill[]>([])
  const [packs, setPacks] = useState<Record<string, SkillPack>>({})
  const [ungrouped, setUngrouped] = useState<Skill[]>([])
  const [currentDay, setCurrentDay] = useState(1)
  const [skillsWithAgents, setSkillsWithAgents] = useState<Map<string, string[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRevealModal, setShowRevealModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newlyUnlockedSkills, setNewlyUnlockedSkills] = useState<Skill[]>([])

  useEffect(() => {
    loadAgents()
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setIsLoading(true)

      // Load all available skills
      const skillsRes = await fetch('/api/skills')
      const skillsData = await skillsRes.json()
      setSkills(skillsData.skills || [])
      setPacks(skillsData.packs || {})
      setUngrouped(skillsData.ungrouped || skillsData.skills || [])
      setCurrentDay(skillsData.currentDay || 1)

      // Check for newly unlocked skills
      const allSkills = skillsData.skills || []
      const unlockedSkills = allSkills.filter((s: Skill) => !s.isLocked && s.unlockDay)

      // Get previously revealed skills from localStorage
      const revealedKey = 'oa-revealed-skills'
      const revealedSkills = JSON.parse(localStorage.getItem(revealedKey) || '[]')

      // Find skills that are unlocked but not yet revealed
      const newUnlocks = unlockedSkills.filter(
        (s: Skill) => !revealedSkills.includes(s.id)
      )

      if (newUnlocks.length > 0) {
        setNewlyUnlockedSkills(newUnlocks)
        setShowRevealModal(true)

        // Mark these as revealed
        const allRevealed = [...revealedSkills, ...newUnlocks.map((s: Skill) => s.id)]
        localStorage.setItem(revealedKey, JSON.stringify(allRevealed))
      }

      // Load which agents are using each skill
      const skillAgentMap = new Map<string, string[]>()

      for (const agent of agents) {
        // Use agents.json directly instead of individual agent files
        (agent.skills || []).forEach((skillId: string) => {
          if (!skillAgentMap.has(skillId)) {
            skillAgentMap.set(skillId, [])
          }
          skillAgentMap.get(skillId)!.push(agent.name)
        })
      }

      setSkillsWithAgents(skillAgentMap)
    } catch (error) {
      console.error('Failed to load skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewSkill = (skillId: string) => {
    setSelectedSkillId(skillId)
    setShowDetailModal(true)
  }

  const handleSaveSkill = async (skillId: string, content: string) => {
    try {
      await fetch(`/api/skills/${skillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      // Optionally reload skills to update descriptions
      await loadSkills()
    } catch (error) {
      console.error('Failed to save skill:', error)
      throw error
    }
  }

  const handleToggleSkill = async (skillId: string, agentId: string, isCurrentlyUsed: boolean) => {
    try {
      const agent = agents.find(a => a.id === agentId)
      if (!agent) return

      const currentSkills = agent.skills || []
      const newSkills = isCurrentlyUsed
        ? currentSkills.filter((id: string) => id !== skillId)
        : [...currentSkills, skillId]

      // Update agent skills
      await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...agent, skills: newSkills }),
      })

      // Reload agents and skills
      await loadAgents()
      await loadSkills()
    } catch (error) {
      console.error('Failed to toggle skill:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading skills...</div>
      </div>
    )
  }

  // Render a skill card
  const renderSkillCard = (skill: Skill) => {
    const usedByAgents = skillsWithAgents.get(skill.id) || []
    const isUsed = usedByAgents.length > 0
    const isLocked = skill.isLocked

    return (
      <div
        key={skill.id}
        className={`bg-oa-bg-secondary border border-oa-border rounded-lg transition-colors ${
          isLocked
            ? 'opacity-60 cursor-not-allowed'
            : 'hover:border-oa-accent'
        }`}
      >
        <div className="p-5">
          {/* Skill Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div
              className={`flex-1 ${isLocked ? '' : 'cursor-pointer'}`}
              onClick={() => !isLocked && handleViewSkill(skill.id)}
            >
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {isLocked && <Lock className="w-4 h-4 text-oa-text-secondary" />}
                <h3 className={`text-lg font-semibold ${
                  isLocked
                    ? 'text-oa-text-secondary'
                    : 'text-oa-text-primary hover:text-oa-accent transition-colors'
                }`}>
                  {skill.name}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  skill.category === 'health' ? 'bg-green-500/10 text-green-400' :
                  skill.category === 'productivity' ? 'bg-blue-500/10 text-blue-400' :
                  skill.category === 'learning' ? 'bg-purple-500/10 text-purple-400' :
                  skill.category === 'creative' ? 'bg-pink-500/10 text-pink-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}>
                  {skill.category}
                </span>
                {skill.isPremium && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                    <Sparkles className="w-3 h-3" />
                    Premium
                  </span>
                )}
                {isLocked && skill.unlockDay && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-400">
                    Unlocks Day {skill.unlockDay}
                  </span>
                )}
              </div>
              <p className="text-sm text-oa-text-secondary line-clamp-2">
                {isLocked
                  ? `Unlocks on Day ${skill.unlockDay}. Complete your daily check-ins to unlock!`
                  : skill.description}
              </p>
            </div>

            <button
              onClick={() => !isLocked && handleViewSkill(skill.id)}
              disabled={isLocked}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm ${
                isLocked
                  ? 'border-oa-border text-oa-text-secondary cursor-not-allowed'
                  : 'border-oa-border text-oa-text-primary hover:bg-oa-bg-tertiary transition-colors'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {isLocked ? 'Locked' : 'View Details'}
            </button>
          </div>

          {/* Agents using this skill */}
          {!isLocked && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-oa-border">
              {isUsed ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="w-4 h-4 text-oa-text-secondary" />
                  <span className="text-xs text-oa-text-secondary">Used by:</span>
                  {usedByAgents.map((agentName) => {
                    const agent = agents.find(a => a.name === agentName)
                    return (
                      <div key={agentName} className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 bg-oa-accent/10 text-oa-accent rounded-full font-medium">
                          {agentName}
                        </span>
                        {agent && (
                          <button
                            onClick={() => handleToggleSkill(skill.id, agent.id, true)}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors"
                            title="Remove from agent"
                          >
                            <X className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <span className="text-xs text-oa-text-secondary">Not used by any agent</span>
              )}

              {/* Add to agent dropdown */}
              <div className="flex items-center gap-2">
                {agents
                  .filter(agent => !(agent.skills || []).includes(skill.id))
                  .map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => handleToggleSkill(skill.id, agent.id, false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-accent hover:text-white hover:border-oa-accent transition-colors text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to {agent.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const lockedCount = skills.filter(s => s.isLocked).length
  const unlockedCount = skills.filter(s => !s.isLocked).length
  const packCount = Object.keys(packs).length

  return (
    <div className="flex flex-col h-full bg-oa-bg-primary">
      {/* Header */}
      <div className="px-8 py-6 border-b border-oa-border">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-oa-text-primary">
            Skills Marketplace
          </h1>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-oa-text-secondary">
          <span>{skills.length} total skills</span>
          <span className="text-oa-accent">{unlockedCount} available</span>
          {lockedCount > 0 && (
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              {lockedCount} locked
            </span>
          )}
          {packCount > 0 && (
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {packCount} packs
            </span>
          )}
          <span className="ml-auto">Day {currentDay}</span>
        </div>
      </div>

      {/* Content - List View */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Skill Packs */}
        {Object.entries(packs).length > 0 && (
          <div className="mb-8">
            {Object.entries(packs).map(([packId, pack]) => (
              <div key={packId} className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-5 h-5 text-oa-accent" />
                  <h2 className="text-lg font-semibold text-oa-text-primary">{pack.name}</h2>
                  {pack.value && (
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full">
                      {pack.value} Value
                    </span>
                  )}
                  <span className="text-xs text-oa-text-secondary">
                    {pack.skills.length} skills
                  </span>
                </div>
                <div className="space-y-3 ml-8">
                  {pack.skills.map(renderSkillCard)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ungrouped Skills */}
        {ungrouped.length > 0 && (
          <div>
            {Object.entries(packs).length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-oa-text-primary">Other Skills</h2>
                <span className="text-xs text-oa-text-secondary">
                  {ungrouped.length} skills
                </span>
              </div>
            )}
            <div className="space-y-3">
              {ungrouped.map(renderSkillCard)}
            </div>
          </div>
        )}
      </div>

      {/* Skill Detail Modal */}
      <SkillDetailModal
        skillId={selectedSkillId}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedSkillId(null)
        }}
        onSave={handleSaveSkill}
      />

      {/* Skill Reveal Modal */}
      <SkillRevealModal
        skills={newlyUnlockedSkills}
        isOpen={showRevealModal}
        onClose={() => {
          setShowRevealModal(false)
          setNewlyUnlockedSkills([])
        }}
        onViewSkill={(skillId) => {
          setShowRevealModal(false)
          setNewlyUnlockedSkills([])
          handleViewSkill(skillId)
        }}
      />

      {/* Skill Import Modal */}
      <SkillImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          loadSkills()
          setShowImportModal(false)
        }}
      />
    </div>
  )
}

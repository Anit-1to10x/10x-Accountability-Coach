'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { CreateAgentModal } from '@/components/agent/CreateAgentModal'
import { SkillCreator } from '@/components/skills/SkillCreator'
import { AgentSetupWizard } from '@/components/agent/AgentSetupWizard'
import { useAgentStore } from '@/lib/store'
import type { Agent } from '@/types'

export function AddAgentButton() {
  const [showModal, setShowModal] = useState(false)
  const [showSkillCreator, setShowSkillCreator] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [newAgentData, setNewAgentData] = useState<{ name: string; id: string } | null>(null)
  const { loadAgents } = useAgentStore()

  const handleCreateAgent = async (agentData: Partial<Agent>) => {
    try {
      // Create agent ID from name
      const agentId = agentData.name?.toLowerCase().replace(/\s+/g, '-') || 'new-agent'
      const agentName = agentData.name || 'New Agent'

      // Close the creation modal
      setShowModal(false)

      // Store agent data and show wizard
      setNewAgentData({ name: agentName, id: agentId })
      setShowSetupWizard(true)

      // Create full agent object
      const newAgent: Agent = {
        id: agentId,
        name: agentName,
        icon: agentData.icon || '🤖',
        description: agentData.description || '',
        color: agentData.color || 'purple',
        skills: agentData.skills || [],
        quickActions: [
          { id: 'action-1', label: 'Quick Action 1', icon: 'zap' },
          { id: 'action-2', label: 'Quick Action 2', icon: 'star' },
        ],
        sections: [
          { id: 'workspace', label: 'Workspace', path: 'workspace/' },
        ],
        capabilities: {},
      }

      // Save to API (happens in background while wizard shows)
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      })

      if (!response.ok) {
        throw new Error('Failed to create agent')
      }

      // Reload agents
      await loadAgents()
    } catch (error) {
      console.error('Failed to create agent:', error)
      setShowSetupWizard(false)
      throw error
    }
  }

  const handleWizardComplete = () => {
    setShowSetupWizard(false)
    if (newAgentData) {
      // Navigate to new agent
      window.location.href = `/agent/${newAgentData.id}`
    }
  }

  const handleCreateSkill = () => {
    setShowModal(false)
    setShowSkillCreator(true)
  }

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        className="
          w-full px-4 py-2.5 rounded-lg text-sm font-medium
          bg-gradient-to-r from-oa-accent/10 to-purple-500/10
          border border-oa-accent/30
          hover:border-oa-accent/50 hover:from-oa-accent/20 hover:to-purple-500/20
          text-oa-text-secondary hover:text-oa-accent
          transition-all duration-200
          flex items-center justify-center gap-2
        "
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
      >
        <Plus className="w-4 h-4" />
        <span>Add Agent</span>
      </motion.button>

      <CreateAgentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreateAgent={handleCreateAgent}
        onCreateSkill={handleCreateSkill}
      />

      <SkillCreator
        isOpen={showSkillCreator}
        onClose={() => {
          setShowSkillCreator(false)
          setShowModal(true) // Return to agent creation modal
        }}
        agentId="system"
        onSkillCreated={(skillId) => {
          console.log('Skill created:', skillId)
          setShowSkillCreator(false)
          setShowModal(true) // Return to agent creation modal
        }}
      />

      <AgentSetupWizard
        isOpen={showSetupWizard}
        agentName={newAgentData?.name || 'New Agent'}
        onComplete={handleWizardComplete}
      />
    </>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Bot, Zap, MessageSquare, Settings2, Check, X, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  isDefault?: boolean
  skills: string[]
  capabilities: string[]
  personality?: {
    tone: string
    style: string
  }
}

interface AgentCapabilities {
  agentId: string
  assignedSkills: string[]
  assignedPrompts: string[]
  systemPrompt?: string
  personality?: {
    tone: 'strict' | 'balanced' | 'friendly'
    style: string
  }
  restrictions?: {
    allowOnlyAssigned: boolean
    blockedTopics?: string[]
  }
  updatedAt: string
}

interface Skill {
  id: string
  name: string
  description?: string
}

interface Prompt {
  id: string
  name: string
  category: string
  description?: string
}

export function AgentSettings() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [capabilities, setCapabilities] = useState<Record<string, AgentCapabilities>>({})
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([])
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load agents
      const agentsRes = await fetch('/api/agents')
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents || [])
      }

      // Load available skills
      const skillsRes = await fetch('/api/skills')
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json()
        setAvailableSkills(skillsData.skills || [])
      }

      // Load available prompts
      const promptsRes = await fetch('/api/prompts')
      if (promptsRes.ok) {
        const promptsData = await promptsRes.json()
        setAvailablePrompts(promptsData.dynamicPrompts || [])
      }

      // Load capabilities for each agent
      const agentsRes2 = await fetch('/api/agents')
      if (agentsRes2.ok) {
        const agentsData = await agentsRes2.json()
        const caps: Record<string, AgentCapabilities> = {}

        for (const agent of agentsData.agents || []) {
          try {
            const capRes = await fetch(`/api/agents/${agent.id}/capabilities`)
            if (capRes.ok) {
              const capData = await capRes.json()
              caps[agent.id] = capData
            }
          } catch (err) {
            console.error(`Failed to load capabilities for ${agent.id}:`, err)
          }
        }
        setCapabilities(caps)
      }
    } catch (err) {
      console.error('Failed to load agent settings:', err)
      setError('Failed to load agent settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCapabilities = async (agentId: string) => {
    setSaving(agentId)

    try {
      const cap = capabilities[agentId]
      const res = await fetch(`/api/agents/${agentId}/capabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cap),
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      // Reload capabilities
      const capRes = await fetch(`/api/agents/${agentId}/capabilities`)
      if (capRes.ok) {
        const capData = await capRes.json()
        setCapabilities(prev => ({ ...prev, [agentId]: capData }))
      }
    } catch (err) {
      console.error('Failed to save capabilities:', err)
      alert('Failed to save agent settings')
    } finally {
      setSaving(null)
    }
  }

  const updateCapability = (agentId: string, updates: Partial<AgentCapabilities>) => {
    setCapabilities(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        ...updates,
        agentId,
      },
    }))
  }

  const toggleSkill = (agentId: string, skillId: string) => {
    const current = capabilities[agentId]?.assignedSkills || []
    const updated = current.includes(skillId)
      ? current.filter(s => s !== skillId)
      : [...current, skillId]
    updateCapability(agentId, { assignedSkills: updated })
  }

  const togglePrompt = (agentId: string, promptId: string) => {
    const current = capabilities[agentId]?.assignedPrompts || []
    const updated = current.includes(promptId)
      ? current.filter(p => p !== promptId)
      : [...current, promptId]
    updateCapability(agentId, { assignedPrompts: updated })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-oa-accent animate-spin" />
        <span className="ml-2 text-sm text-oa-text-secondary">Loading agent settings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={loadData}
          className="mt-2 text-sm text-oa-accent hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-oa-text-secondary mb-4">
        Configure skills, prompts, and personality for each agent. These settings control how each agent behaves and what capabilities they have access to.
      </p>

      {agents.length === 0 ? (
        <div className="text-center py-8">
          <Bot className="w-12 h-12 text-oa-text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-sm text-oa-text-secondary">No agents configured yet</p>
        </div>
      ) : (
        agents.map((agent) => {
          const isExpanded = expandedAgent === agent.id
          const cap = capabilities[agent.id] || {
            agentId: agent.id,
            assignedSkills: agent.skills || [],
            assignedPrompts: [],
            personality: { tone: 'balanced' as const, style: '' },
            restrictions: { allowOnlyAssigned: true },
          }
          const isSaving = saving === agent.id

          return (
            <div
              key={agent.id}
              className="bg-oa-bg-tertiary border border-oa-border rounded-lg overflow-hidden"
            >
              {/* Agent Header */}
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-oa-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-oa-accent/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-oa-accent" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-oa-text-primary">{agent.name}</h4>
                      {agent.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-oa-text-secondary">{agent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-oa-text-secondary">
                    <span>{cap.assignedSkills?.length || 0} skills</span>
                    <span className="mx-1">·</span>
                    <span>{cap.assignedPrompts?.length || 0} prompts</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-oa-text-secondary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-oa-text-secondary" />
                  )}
                </div>
              </button>

              {/* Expanded Settings */}
              {isExpanded && (
                <div className="border-t border-oa-border p-4 space-y-6">
                  {/* Personality Settings */}
                  <div>
                    <h5 className="text-sm font-medium text-oa-text-primary mb-3 flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Personality & Tone
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-oa-text-secondary mb-1">Accountability Tone</label>
                        <select
                          value={cap.personality?.tone || 'balanced'}
                          onChange={(e) => updateCapability(agent.id, {
                            personality: { ...cap.personality, tone: e.target.value as any, style: cap.personality?.style || '' }
                          })}
                          className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg text-sm text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                        >
                          <option value="strict">Strict - No excuses, high standards</option>
                          <option value="balanced">Balanced - Supportive but honest</option>
                          <option value="friendly">Friendly - Warm and encouraging</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-oa-text-secondary mb-1">Custom Style (optional)</label>
                        <input
                          type="text"
                          value={cap.personality?.style || ''}
                          onChange={(e) => updateCapability(agent.id, {
                            personality: { ...cap.personality, tone: cap.personality?.tone || 'balanced', style: e.target.value }
                          })}
                          placeholder="e.g., Use sports metaphors"
                          className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg text-sm text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills Assignment */}
                  <div>
                    <h5 className="text-sm font-medium text-oa-text-primary mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Assigned Skills
                    </h5>
                    <p className="text-xs text-oa-text-secondary mb-3">
                      Select which skills this agent can use. Unselected skills will not be available to this agent.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availableSkills.map((skill) => {
                        const isAssigned = cap.assignedSkills?.includes(skill.id)
                        return (
                          <button
                            key={skill.id}
                            onClick={() => toggleSkill(agent.id, skill.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                              isAssigned
                                ? 'bg-oa-accent/10 border border-oa-accent text-oa-accent'
                                : 'bg-oa-bg-primary border border-oa-border text-oa-text-secondary hover:border-oa-text-secondary'
                            }`}
                          >
                            {isAssigned ? (
                              <Check className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <div className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{skill.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Prompts Assignment */}
                  <div>
                    <h5 className="text-sm font-medium text-oa-text-primary mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Assigned Prompts
                    </h5>
                    <p className="text-xs text-oa-text-secondary mb-3">
                      Select which prompts/frameworks this agent can use for responses.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {availablePrompts.map((prompt) => {
                        const isAssigned = cap.assignedPrompts?.includes(prompt.id)
                        return (
                          <button
                            key={prompt.id}
                            onClick={() => togglePrompt(agent.id, prompt.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                              isAssigned
                                ? 'bg-purple-500/10 border border-purple-500 text-purple-400'
                                : 'bg-oa-bg-primary border border-oa-border text-oa-text-secondary hover:border-oa-text-secondary'
                            }`}
                          >
                            {isAssigned ? (
                              <Check className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <div className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{prompt.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Restrictions */}
                  <div>
                    <h5 className="text-sm font-medium text-oa-text-primary mb-3">Restrictions</h5>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cap.restrictions?.allowOnlyAssigned !== false}
                          onChange={(e) => updateCapability(agent.id, {
                            restrictions: { ...cap.restrictions, allowOnlyAssigned: e.target.checked }
                          })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-oa-text-primary">
                          Only allow assigned skills and prompts
                        </span>
                      </label>
                      <div>
                        <label className="block text-xs text-oa-text-secondary mb-1">Blocked Topics (comma-separated)</label>
                        <input
                          type="text"
                          value={cap.restrictions?.blockedTopics?.join(', ') || ''}
                          onChange={(e) => updateCapability(agent.id, {
                            restrictions: {
                              ...cap.restrictions,
                              allowOnlyAssigned: cap.restrictions?.allowOnlyAssigned !== false,
                              blockedTopics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                            }
                          })}
                          placeholder="e.g., politics, religion"
                          className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg text-sm text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom System Prompt */}
                  <div>
                    <h5 className="text-sm font-medium text-oa-text-primary mb-3">Custom Instructions (Optional)</h5>
                    <textarea
                      value={cap.systemPrompt || ''}
                      onChange={(e) => updateCapability(agent.id, { systemPrompt: e.target.value })}
                      placeholder="Add custom instructions for this agent..."
                      rows={3}
                      className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg text-sm text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent resize-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-2 border-t border-oa-border">
                    <button
                      onClick={() => handleSaveCapabilities(agent.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Agent Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

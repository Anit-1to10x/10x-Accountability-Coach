/**
 * Agent Capabilities System
 *
 * Manages skills and prompts assigned to each agent.
 * Agents can only use skills/prompts explicitly assigned to them.
 */

import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from './paths'

// Types
export interface AgentCapabilities {
  agentId: string
  assignedSkills: string[]      // Skill IDs assigned to this agent
  assignedPrompts: string[]     // Prompt IDs assigned to this agent
  systemPrompt?: string         // Custom system prompt override
  personality?: {
    tone: 'strict' | 'balanced' | 'friendly'
    style: string
  }
  restrictions?: {
    allowOnlyAssigned: boolean  // If true, agent can only use assigned skills/prompts
    blockedTopics?: string[]    // Topics the agent should not discuss
  }
  updatedAt: string
}

export interface AgentCapabilitiesConfig {
  agents: Record<string, AgentCapabilities>
  globalDefaults: {
    defaultSkills: string[]
    defaultPrompts: string[]
  }
}

const CAPABILITIES_FILE = 'agent-capabilities.json'

/**
 * Load agent capabilities configuration
 */
export async function loadAgentCapabilities(): Promise<AgentCapabilitiesConfig> {
  const filePath = path.join(DATA_DIR, CAPABILITIES_FILE)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    // Return default config if file doesn't exist
    return {
      agents: {},
      globalDefaults: {
        defaultSkills: ['streak', 'daily-checkin'],
        defaultPrompts: ['motivation', 'accountability'],
      },
    }
  }
}

/**
 * Save agent capabilities configuration
 */
export async function saveAgentCapabilities(config: AgentCapabilitiesConfig): Promise<void> {
  const filePath = path.join(DATA_DIR, CAPABILITIES_FILE)
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(config, null, 2))
}

/**
 * Get capabilities for a specific agent
 */
export async function getAgentCapabilities(agentId: string): Promise<AgentCapabilities> {
  const config = await loadAgentCapabilities()

  // Return agent-specific capabilities or defaults
  if (config.agents[agentId]) {
    return config.agents[agentId]
  }

  // Return default capabilities for unknown agents
  // Default to allowOnlyAssigned: false so agents aren't artificially restricted
  return {
    agentId,
    assignedSkills: config.globalDefaults.defaultSkills,
    assignedPrompts: config.globalDefaults.defaultPrompts,
    restrictions: {
      allowOnlyAssigned: false,
    },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Update capabilities for an agent
 */
export async function updateAgentCapabilities(
  agentId: string,
  updates: Partial<AgentCapabilities>
): Promise<AgentCapabilities> {
  const config = await loadAgentCapabilities()

  const existing = config.agents[agentId] || {
    agentId,
    assignedSkills: config.globalDefaults.defaultSkills,
    assignedPrompts: config.globalDefaults.defaultPrompts,
    restrictions: { allowOnlyAssigned: true },
  }

  const updated: AgentCapabilities = {
    ...existing,
    ...updates,
    agentId,
    updatedAt: new Date().toISOString(),
  }

  config.agents[agentId] = updated
  await saveAgentCapabilities(config)

  return updated
}

/**
 * Assign skills to an agent
 */
export async function assignSkillsToAgent(
  agentId: string,
  skillIds: string[]
): Promise<AgentCapabilities> {
  return updateAgentCapabilities(agentId, { assignedSkills: skillIds })
}

/**
 * Assign prompts to an agent
 */
export async function assignPromptsToAgent(
  agentId: string,
  promptIds: string[]
): Promise<AgentCapabilities> {
  return updateAgentCapabilities(agentId, { assignedPrompts: promptIds })
}

/**
 * Check if an agent can use a specific skill
 */
export async function canAgentUseSkill(agentId: string, skillId: string): Promise<boolean> {
  const capabilities = await getAgentCapabilities(agentId)

  // If restrictions are disabled, allow all skills
  if (!capabilities.restrictions?.allowOnlyAssigned) {
    return true
  }

  return capabilities.assignedSkills.includes(skillId)
}

/**
 * Check if an agent can use a specific prompt
 */
export async function canAgentUsePrompt(agentId: string, promptId: string): Promise<boolean> {
  const capabilities = await getAgentCapabilities(agentId)

  // If restrictions are disabled, allow all prompts
  if (!capabilities.restrictions?.allowOnlyAssigned) {
    return true
  }

  return capabilities.assignedPrompts.includes(promptId)
}

/**
 * Get filtered skills for an agent (only assigned skills)
 */
export async function getAgentSkills(agentId: string, allSkills: any[]): Promise<any[]> {
  const capabilities = await getAgentCapabilities(agentId)

  // If restrictions are disabled, return all skills
  if (!capabilities.restrictions?.allowOnlyAssigned) {
    return allSkills
  }

  // Filter to only assigned skills
  return allSkills.filter(skill =>
    capabilities.assignedSkills.includes(skill.id) ||
    capabilities.assignedSkills.includes(skill.name?.toLowerCase().replace(/\s+/g, '-'))
  )
}

/**
 * Get filtered prompts for an agent (only assigned prompts)
 */
export async function getAgentPrompts(agentId: string, allPrompts: any[]): Promise<any[]> {
  const capabilities = await getAgentCapabilities(agentId)

  // If restrictions are disabled, return all prompts
  if (!capabilities.restrictions?.allowOnlyAssigned) {
    return allPrompts
  }

  // Filter to only assigned prompts
  return allPrompts.filter(prompt =>
    capabilities.assignedPrompts.includes(prompt.id) ||
    capabilities.assignedPrompts.includes(prompt.name?.toLowerCase().replace(/\s+/g, '-'))
  )
}

/**
 * Get combined capabilities from multiple agents (for unified chat)
 */
export async function getCombinedAgentCapabilities(agentIds: string[]): Promise<AgentCapabilities> {
  if (agentIds.length === 0) {
    // Return defaults if no agents selected
    const config = await loadAgentCapabilities()
    return {
      agentId: 'unified',
      assignedSkills: config.globalDefaults.defaultSkills,
      assignedPrompts: config.globalDefaults.defaultPrompts,
      restrictions: {
        allowOnlyAssigned: false, // Unified chat allows all
      },
      updatedAt: new Date().toISOString(),
    }
  }

  // Load capabilities for all selected agents
  const capabilitiesPromises = agentIds.map(id => getAgentCapabilities(id))
  const allCapabilities = await Promise.all(capabilitiesPromises)

  // Combine all skills and prompts (remove duplicates)
  const combinedSkills = [...new Set(allCapabilities.flatMap(c => c.assignedSkills))]
  const combinedPrompts = [...new Set(allCapabilities.flatMap(c => c.assignedPrompts))]

  // Combine blocked topics from all agents
  const blockedTopics = [...new Set(allCapabilities.flatMap(c => c.restrictions?.blockedTopics || []))]

  return {
    agentId: 'unified',
    assignedSkills: combinedSkills,
    assignedPrompts: combinedPrompts,
    restrictions: {
      allowOnlyAssigned: false, // Unified doesn't restrict
      blockedTopics: blockedTopics.length > 0 ? blockedTopics : undefined,
    },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Build system prompt for an agent including capabilities context
 */
export function buildAgentSystemPrompt(
  agentName: string,
  capabilities: AgentCapabilities,
  userProfile: any
): string {
  const parts: string[] = []

  // Base identity
  parts.push(`You are ${agentName}, a specialized AI accountability coach.`)

  // Personality
  if (capabilities.personality) {
    const toneDescriptions = {
      strict: 'You are direct, demanding, and hold high standards. No excuses accepted.',
      balanced: 'You are supportive but honest. You celebrate wins while pushing for growth.',
      friendly: 'You are warm, encouraging, and focus on positive reinforcement.',
    }
    parts.push(toneDescriptions[capabilities.personality.tone] || '')
    if (capabilities.personality.style) {
      parts.push(`Your communication style: ${capabilities.personality.style}`)
    }
  }

  // User context
  if (userProfile) {
    parts.push(`\n## User Context`)
    if (userProfile.name) parts.push(`- User's name: ${userProfile.name}`)
    if (userProfile.goal) parts.push(`- Main goal: ${userProfile.goal}`)
    if (userProfile.timezone) parts.push(`- Timezone: ${userProfile.timezone}`)
  }

  // Restrictions
  if (capabilities.restrictions?.blockedTopics?.length) {
    parts.push(`\n## Topics to avoid: ${capabilities.restrictions.blockedTopics.join(', ')}`)
  }

  // Skills context
  if (capabilities.assignedSkills.length > 0) {
    parts.push(`\n## Your Available Skills`)
    parts.push(`You can help with: ${capabilities.assignedSkills.join(', ')}`)
    if (capabilities.restrictions?.allowOnlyAssigned) {
      parts.push(`Note: Only use your assigned skills. For other requests, guide the user to appropriate resources.`)
    }
  }

  // Custom system prompt override
  if (capabilities.systemPrompt) {
    parts.push(`\n## Additional Instructions`)
    parts.push(capabilities.systemPrompt)
  }

  return parts.filter(Boolean).join('\n')
}

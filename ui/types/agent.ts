// Agent type definitions
import type { Skill } from './skill'

export type AgentColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'cyan'

export interface Agent {
  id: string
  name: string
  icon: string
  description: string
  color?: AgentColor
  isDefault?: boolean
  skills: string[] // Skill IDs
  activeSkills?: Skill[] // Full skill objects (populated)
  quickActions: QuickAction[]
  sections: AgentSection[]
  capabilities: AgentCapabilities
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  handler?: () => void
}

export interface AgentSection {
  id: string
  label: string
  path: string
}

export interface AgentCapabilities {
  visionBoard?: boolean
  scheduling?: boolean
  streaks?: boolean
  punishments?: boolean
  [key: string]: boolean | undefined
}

export interface AgentConfig {
  id: string
  name: string
  icon: string
  description: string
  skills: string[]
  quickActions: QuickAction[]
  sections: AgentSection[]
  capabilities: AgentCapabilities
}

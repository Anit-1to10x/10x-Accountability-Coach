// Skill type definitions

export interface Skill {
  id: string
  name: string
  description: string
  category: 'productivity' | 'health' | 'learning' | 'creative' | 'custom'
  triggers?: string[] // Keywords that activate this skill
  path: string // Local directory path
  isInstalled: boolean
  isActive: boolean // Currently attached to agent
  icon?: string
  version?: string
  author?: string
  allowedTools?: string[] // Restricted tools for this skill
  format?: string // Output format hint for skill

  // Pack and unlock system
  pack?: string             // Pack name (e.g., "vibe-creative-pack")
  packDisplayName?: string  // Human-readable pack name
  packValue?: string        // Value display (e.g., "$199")
  source?: string           // Source URL or identifier
  unlockDay?: number        // Day when skill unlocks (1-30)
  isLocked?: boolean        // Computed: true if unlockDay > current day
  isPremium?: boolean       // Pre-built skill vs user-created
  revealMessage?: string    // Custom message shown on unlock
}

export interface SkillManifest {
  name: string
  description: string
  triggers?: string[]
  category?: string
  version?: string
  author?: string
  allowedTools?: string[]

  // Pack and unlock metadata (from frontmatter)
  pack?: string
  packDisplayName?: string
  packValue?: string
  source?: string
  unlockDay?: number
  isPremium?: boolean
  revealMessage?: string
}

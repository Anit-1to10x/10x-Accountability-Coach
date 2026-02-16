export interface Prompt {
  id: string
  name: string
  description: string
  content: string
  category: 'system' | 'user' | 'assistant' | 'custom'
  tags?: string[]
  isGlobal: boolean  // Global prompts available to all agents
  createdBy?: string  // Agent ID if agent-specific
  createdAt: string
  updatedAt: string
}

export interface AgentPrompt {
  agentId: string
  promptIds: string[]  // References to Prompt IDs
}

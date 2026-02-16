/**
 * Shared Chat Capabilities
 *
 * This module provides shared functionality for both UnifiedChat and individual Agent chats.
 * Ensures consistent behavior across all chat interfaces.
 *
 * Key differences:
 * - UnifiedChat: General system-wide conversations, access to all skills/prompts
 * - Agent Chats: Specialized capabilities, users can set up multiple focused agents
 */

import type { Agent, ChatMessage } from '@/types'
import type { StreamingPhase } from '@/lib/store'
import type { AgentCapabilities } from '@/lib/agent-capabilities'

// Common chat configuration
export interface ChatConfig {
  agentId: string
  profileId?: string | null
  isUnified: boolean
  capabilities?: AgentCapabilities
}

// Message with file attachments
export interface EnhancedMessage extends ChatMessage {
  files?: Array<{
    name: string
    content: string
    type: string
    size: number
  }>
}

// Streaming state
export interface StreamingState {
  phase: StreamingPhase
  details: {
    toolName?: string
    skillName?: string
    promptName?: string
    files?: Array<{ name: string; type: string; size: number }>
    message?: string
    mcpServers?: string[]
    mcpToolCount?: number
  }
}

/**
 * Get chat configuration based on agent type
 */
export function getChatConfig(agent?: Agent): ChatConfig {
  if (!agent) {
    return {
      agentId: 'unified',
      isUnified: true,
    }
  }

  return {
    agentId: agent.id,
    isUnified: agent.id === 'unified',
    capabilities: undefined, // Will be loaded from server
  }
}

/**
 * Build the API request body for chat stream
 */
export function buildChatRequest(
  config: ChatConfig,
  message: string,
  files?: File[]
): {
  agentId: string
  content: string
  profileId?: string | null
  files?: Array<{ name: string; content: string; type: string; size: number }>
} {
  return {
    agentId: config.agentId,
    content: message,
    profileId: config.profileId,
    // Files are processed in store.ts before being sent
  }
}

/**
 * Parse SSE events from the chat stream
 */
export function parseSSEEvent(event: string): {
  type: string
  data: any
} | null {
  if (!event.startsWith('data: ')) return null

  try {
    const data = JSON.parse(event.slice(6))
    return { type: data.type, data }
  } catch {
    return null
  }
}

/**
 * Process streaming events into state updates
 */
export function processStreamEvent(
  event: { type: string; data: any },
  currentState: StreamingState
): StreamingState {
  switch (event.type) {
    case 'start':
      return { ...currentState, phase: 'thinking' }

    case 'mcp_connected':
      return {
        ...currentState,
        details: {
          ...currentState.details,
          mcpServers: event.data.servers,
          mcpToolCount: event.data.toolCount,
        },
      }

    case 'files_processed':
      return {
        phase: 'analyzing_files',
        details: {
          ...currentState.details,
          files: event.data.files,
          message: event.data.message,
        },
      }

    case 'skill_match':
      return {
        phase: 'matching_skill',
        details: { ...currentState.details, skillName: event.data.skillName },
      }

    case 'prompt_match':
      return {
        phase: 'matching_prompt',
        details: { ...currentState.details, promptName: event.data.promptName },
      }

    case 'tools_available':
      return {
        phase: 'loading_tools',
        details: currentState.details,
      }

    case 'chunk':
      return { phase: 'generating', details: currentState.details }

    case 'end':
      return { phase: 'complete', details: {} }

    default:
      return currentState
  }
}

/**
 * Get available quick actions based on chat type
 */
export function getQuickActions(config: ChatConfig): Array<{
  id: string
  label: string
  icon: string
  description: string
}> {
  const commonActions = [
    {
      id: 'new-challenge',
      label: 'New Challenge',
      icon: 'target',
      description: 'Create a new accountability challenge',
    },
    {
      id: 'quick-checkin',
      label: 'Quick Check-in',
      icon: 'check-circle',
      description: 'Do a quick daily check-in',
    },
  ]

  if (config.isUnified) {
    // UnifiedChat gets all actions
    return [
      ...commonActions,
      {
        id: 'vision-board',
        label: 'Vision Board',
        icon: 'image',
        description: 'Create or update your vision board',
      },
      {
        id: 'progress-report',
        label: 'Progress Report',
        icon: 'bar-chart',
        description: 'View your progress summary',
      },
      {
        id: 'schedule',
        label: 'Schedule',
        icon: 'calendar',
        description: 'View and manage your schedule',
      },
    ]
  }

  // Agent-specific actions based on capabilities
  return commonActions
}

/**
 * Get placeholder text based on chat type
 */
export function getPlaceholder(config: ChatConfig, agentName?: string): string {
  if (config.isUnified) {
    return 'Ask me anything about your goals, challenges, or progress...'
  }

  return agentName
    ? `Message ${agentName}...`
    : 'Type your message here...'
}

/**
 * Get welcome message based on user context
 */
export function getWelcomeMessage(
  config: ChatConfig,
  userName?: string,
  stats?: {
    activeChallenges: number
    currentStreak: number
    pendingTasks: number
  }
): string {
  const name = userName || 'there'

  if (config.isUnified) {
    let message = `Hey ${name}! I'm your 10X Coach. `

    if (stats) {
      if (stats.activeChallenges > 0) {
        message += `You have ${stats.activeChallenges} active challenge${stats.activeChallenges > 1 ? 's' : ''}. `
      }
      if (stats.currentStreak > 0) {
        message += `You're on a ${stats.currentStreak}-day streak! `
      }
      if (stats.pendingTasks > 0) {
        message += `${stats.pendingTasks} task${stats.pendingTasks > 1 ? 's' : ''} pending today. `
      }
    }

    message += 'How can I help you today?'
    return message
  }

  return `Hey ${name}! I'm ready to help you stay accountable. What would you like to work on?`
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get file icon name based on extension
 */
export function getFileIconName(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  const iconMap: Record<string, string> = {
    // Images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    webp: 'image',
    svg: 'image',

    // Videos
    mp4: 'video',
    webm: 'video',
    mov: 'video',

    // Audio
    mp3: 'music',
    wav: 'music',

    // Code
    js: 'code',
    ts: 'code',
    jsx: 'code',
    tsx: 'code',
    py: 'code',
    css: 'code',
    html: 'code',
    sql: 'code',

    // Data
    json: 'file-json',
    csv: 'table',
    xlsx: 'table',
    yaml: 'file-text',
    yml: 'file-text',

    // Documents
    md: 'file-text',
    txt: 'file-text',
    pdf: 'file',
  }

  return iconMap[ext] || 'file'
}

/**
 * Check if file type is supported for content analysis
 */
export function isAnalyzableFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const analyzableExtensions = [
    'md', 'txt', 'json', 'yaml', 'yml', 'csv',
    'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'sql', 'xml',
  ]
  return analyzableExtensions.includes(ext)
}

/**
 * Check if file type is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)
}

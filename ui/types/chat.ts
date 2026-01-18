// Chat type definitions

export interface ChatMessageOption {
  label: string
  value: string
  description?: string
}

export interface ChatMessageMetadata {
  isOnboarding?: boolean
  step?: string
  options?: ChatMessageOption[]
  optionType?: 'select' | 'multi-select'
  inputType?: 'text' | 'date' | 'number' | 'select' | 'multi-select' | 'none'
  answered?: boolean
  isFirstTime?: boolean
  isPending?: boolean
  // Streaming properties
  isStreaming?: boolean       // True while chunks are arriving
  streamingError?: string     // Error message if streaming fails
  requestId?: string          // Track which request this message belongs to
  [key: string]: any  // Allow additional properties
}

export interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'assistant'
  content: string
  timestamp: string
  agentId: string
  attachments?: ChatAttachment[]
  metadata?: ChatMessageMetadata
}

export interface ChatAttachment {
  id: string
  type: 'image' | 'video' | 'file'
  path: string
  name: string
  size?: number
}

export interface ChatHistory {
  agentId: string
  date: string
  messages: ChatMessage[]
}

export interface ChatIndex {
  dates: string[]
  agentIds: Record<string, string[]> // date -> agentIds
}

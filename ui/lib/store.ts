// Zustand global store for OpenAnalyst

import { create } from 'zustand'
import type { Agent, ChatMessage, FileNode, Todo, Challenge } from '@/types'
import { addProfileId } from './useProfileId'

// Helper to get active profileId
const getActiveProfileId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('activeProfileId')
}

// Navigation Store - Track active selection (home, agent, OR nav item)
interface NavigationState {
  activeType: 'home' | 'agent' | 'nav' | null
  activeId: string | null
  setActive: (type: 'home' | 'agent' | 'nav' | null, id: string | null) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeType: null,
  activeId: null,
  setActive: (type, id) => set({ activeType: type, activeId: id }),
}))

// Sidebar Store - Track collapsed state
interface SidebarState {
  isCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}))

// Profile Store
interface Profile {
  id: string
  name: string
  email: string
  created: string
  lastActive: string
  owner: boolean
}

interface ProfileState {
  activeProfileId: string | null
  profiles: Profile[]
  setActiveProfile: (id: string) => void
  loadProfiles: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  activeProfileId: typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') : null,
  profiles: [],
  setActiveProfile: (id) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeProfileId', id)
    }
    set({ activeProfileId: id })
  },
  loadProfiles: async () => {
    try {
      const response = await fetch('/api/profiles')
      const data = await response.json()
      set({ profiles: data.profiles || [] })
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  },
}))

// Agent Store
interface AgentState {
  agents: Agent[]
  activeAgentId: string | null
  selectedAgentIds: string[] // Multi-select for unified chat
  setActiveAgent: (id: string | null) => void
  toggleAgentSelection: (id: string) => void
  selectAllAgents: () => void
  deselectAllAgents: () => void
  isAgentSelected: (id: string) => boolean
  getSelectedAgents: () => Agent[]
  loadAgents: () => Promise<void>
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  activeAgentId: null,
  selectedAgentIds: [], // Will be populated with default agent on load
  setActiveAgent: (id) => set({ activeAgentId: id }),
  toggleAgentSelection: (id) => {
    const { selectedAgentIds } = get()
    if (selectedAgentIds.includes(id)) {
      // Don't allow deselecting if it's the only one selected
      if (selectedAgentIds.length > 1) {
        set({ selectedAgentIds: selectedAgentIds.filter(agentId => agentId !== id) })
      }
    } else {
      set({ selectedAgentIds: [...selectedAgentIds, id] })
    }
  },
  selectAllAgents: () => {
    const { agents } = get()
    set({ selectedAgentIds: agents.map(a => a.id) })
  },
  deselectAllAgents: () => {
    const { agents } = get()
    // Keep at least the default agent selected
    const defaultAgent = agents.find(a => a.isDefault)
    set({ selectedAgentIds: defaultAgent ? [defaultAgent.id] : [] })
  },
  isAgentSelected: (id) => {
    return get().selectedAgentIds.includes(id)
  },
  getSelectedAgents: () => {
    const { agents, selectedAgentIds } = get()
    return agents.filter(a => selectedAgentIds.includes(a.id))
  },
  loadAgents: async () => {
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()
      // Handle both array and object response formats
      const agents = Array.isArray(data) ? data : (data.agents || [])
      // Auto-select default agent on first load
      const defaultAgent = agents.find((a: Agent) => a.isDefault)
      const currentSelected = get().selectedAgentIds
      set({
        agents,
        selectedAgentIds: currentSelected.length === 0 && defaultAgent
          ? [defaultAgent.id]
          : currentSelected.length === 0 && agents.length > 0
            ? [agents[0].id] // Fallback to first agent if no default
            : currentSelected
      })
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  },
}))

// Streaming Phase Types
export type StreamingPhase =
  | 'idle'
  | 'thinking'
  | 'rag_retrieving'
  | 'mcp_connected'
  | 'matching_skill'
  | 'matching_prompt'
  | 'loading_tools'
  | 'executing_tool'
  | 'executing_code'
  | 'analyzing_files'
  | 'generating'
  | 'complete'

// File info for streaming
interface StreamingFileInfo {
  name: string
  type: string
  size: number
}

// Chat Store
interface ChatState {
  messages: Record<string, ChatMessage[]> // Keyed by agentId
  isTyping: boolean
  streamingPhase: StreamingPhase
  streamingDetails: {
    toolName?: string
    skillName?: string
    promptName?: string
    files?: StreamingFileInfo[]
    message?: string
    documentsFound?: number
    sources?: string[]
    servers?: string[]
    toolCount?: number
  }
  setTyping: (isTyping: boolean) => void
  setStreamingPhase: (phase: StreamingPhase, details?: { toolName?: string; skillName?: string; promptName?: string; files?: StreamingFileInfo[]; message?: string; documentsFound?: number; sources?: string[]; servers?: string[]; toolCount?: number }) => void
  addMessage: (agentId: string, message: ChatMessage) => void
  updateMessage: (agentId: string, messageId: string, updates: Partial<ChatMessage>) => void
  markMessageAnswered: (agentId: string, messageIndex: number) => void
  loadHistory: (agentId: string) => Promise<void>
  sendMessage: (agentId: string, content: string, attachments?: File[]) => Promise<void>
  clearMessages: (agentId: string) => void
  loadSessionMessages: (agentId: string, messages: ChatMessage[]) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isTyping: false,
  streamingPhase: 'idle' as StreamingPhase,
  streamingDetails: {},
  setTyping: (isTyping) => set({ isTyping }),
  setStreamingPhase: (phase, details = {}) => set({ streamingPhase: phase, streamingDetails: details }),
  addMessage: (agentId, message) => {
    const { messages } = get()
    set({
      messages: {
        ...messages,
        [agentId]: [...(messages[agentId] || []), message],
      },
    })
  },
  updateMessage: (agentId, messageId, updates) => {
    const { messages } = get()
    const agentMessages = messages[agentId] || []
    const messageIndex = agentMessages.findIndex(m => m.id === messageId)

    if (messageIndex === -1) return

    const updatedMessages = [...agentMessages]
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      ...updates,
      metadata: {
        ...updatedMessages[messageIndex].metadata,
        ...updates.metadata,
      },
    }

    set({
      messages: {
        ...messages,
        [agentId]: updatedMessages,
      },
    })
  },
  markMessageAnswered: (agentId, messageIndex) => {
    const { messages } = get()
    const agentMessages = messages[agentId] || []
    if (agentMessages[messageIndex]) {
      agentMessages[messageIndex] = {
        ...agentMessages[messageIndex],
        metadata: {
          ...agentMessages[messageIndex].metadata,
          answered: true,
        },
      }
      set({
        messages: {
          ...messages,
          [agentId]: [...agentMessages],
        },
      })
    }
  },
  loadHistory: async (agentId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const profileId = getActiveProfileId()
      const baseUrl = `/api/chat/${agentId}?date=${today}`
      const url = addProfileId(baseUrl, profileId)
      const response = await fetch(url)
      const history = await response.json()
      set((state) => ({
        messages: {
          ...state.messages,
          [agentId]: history.messages || [],
        },
      }))
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  },
  clearMessages: (agentId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [agentId]: [],
      },
    }))
  },
  loadSessionMessages: (agentId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [agentId]: messages,
      },
    }))
  },
  sendMessage: async (agentId, content, attachments) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      agentId,
      attachments: attachments?.map((file) => ({
        id: Date.now().toString(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        path: file.name,
        name: file.name,
        size: file.size,
      })),
    }

    get().addMessage(agentId, message)

    try {
      // Create streaming message placeholder
      const streamingMessageId = `streaming-${Date.now()}`
      get().addMessage(agentId, {
        id: streamingMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        agentId,
        metadata: {
          isStreaming: true,
          requestId: streamingMessageId,
        },
      })

      set({ isTyping: true })
      get().setStreamingPhase('thinking')

      // Get profile ID from localStorage
      const profileId = typeof window !== 'undefined'
        ? localStorage.getItem('activeProfileId')
        : null

      // Read file contents for AI context (chunking happens server-side)
      const filesWithContent = await Promise.all(
        (attachments || []).map(async (file) => {
          try {
            // Only read text-based files for context
            const textExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.csv', '.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.sql', '.xml']
            const ext = '.' + file.name.split('.').pop()?.toLowerCase()

            if (textExtensions.includes(ext)) {
              const content = await file.text()
              return {
                name: file.name,
                content,
                type: file.type,
                size: file.size,
              }
            }

            // For binary files, just include metadata
            return {
              name: file.name,
              content: `[Binary file: ${file.name}, size: ${file.size} bytes]`,
              type: file.type,
              size: file.size,
            }
          } catch {
            return {
              name: file.name,
              content: `[Could not read file: ${file.name}]`,
              type: file.type,
              size: file.size,
            }
          }
        })
      )

      // Get selected agent IDs from agent store (for unified chat with multiple agents)
      const selectedAgentIds = useAgentStore.getState().selectedAgentIds

      // Get user's timezone for context-aware responses
      const timezone = typeof window !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC'

      // Build conversation history for context-aware responses
      const currentMessages = get().messages[agentId] || []
      const history = currentMessages
        .filter(m => !m.metadata?.isStreaming && m.content)
        .slice(-10)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

      // Use fetch streaming instead of WebSocket
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          content,
          profileId,
          timezone,
          files: filesWithContent.length > 0 ? filesWithContent : undefined,
          selectedAgentIds: agentId === 'unified' ? selectedAgentIds : undefined,
          history,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process SSE events (split by double newline)
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          if (!event.startsWith('data: ')) continue

          try {
            const data = JSON.parse(event.slice(6))

            switch (data.type) {
              case 'start':
                // Stream started
                get().setStreamingPhase('thinking')
                break

              case 'phase':
                // Handle streaming phase updates
                if (data.phase) {
                  get().setStreamingPhase(data.phase, {
                    toolName: data.toolName,
                    skillName: data.skillName,
                    promptName: data.promptName,
                  })
                }
                break

              case 'api_suggestion':
                // Show API suggestion to user (configured or not)
                if (data.suggestion && !data.suggestion.configured) {
                  // Prepend suggestion tip to the response
                  get().updateMessage(agentId, streamingMessageId, {
                    metadata: {
                      isStreaming: true,
                      apiSuggestion: data.suggestion,
                    },
                  })
                }
                break

              case 'files_processed':
                // Show file analysis status
                get().setStreamingPhase('analyzing_files', {
                  files: data.files,
                  message: data.message,
                })
                break

              case 'rag_status':
                // Show RAG/MCP knowledge base status
                if (data.status === 'retrieved' && data.documentsFound > 0) {
                  get().setStreamingPhase('rag_retrieving', {
                    documentsFound: data.documentsFound,
                    sources: data.sources,
                    message: data.message,
                  })
                  get().updateMessage(agentId, streamingMessageId, {
                    metadata: {
                      isStreaming: true,
                      ragStatus: {
                        status: 'retrieved',
                        documentsFound: data.documentsFound,
                        sources: data.sources,
                      },
                    },
                  })
                } else if (data.status === 'unavailable') {
                  // RAG not available - continue without it
                  get().setStreamingPhase('thinking', {
                    message: 'Knowledge base not connected',
                  })
                }
                break

              case 'mcp_connected':
                // Show MCP connection status
                get().setStreamingPhase('mcp_connected', {
                  servers: data.servers,
                  toolCount: data.toolCount,
                })
                break

              case 'chunk':
                if (data.content) {
                  fullContent += data.content
                  get().setStreamingPhase('generating')
                  get().updateMessage(agentId, streamingMessageId, {
                    content: fullContent,
                  })
                }
                break

              case 'skill_match':
                // Show skill badge and update phase
                get().setStreamingPhase('matching_skill', { skillName: data.skillName })
                get().updateMessage(agentId, streamingMessageId, {
                  metadata: {
                    isStreaming: true,
                    skillUsed: data.skillName,
                  },
                })
                break

              case 'tool_call':
                // Show tool execution phase
                get().setStreamingPhase('executing_tool', { toolName: data.toolName })
                break

              case 'tool_result':
                // Tool completed, update message with result
                get().setStreamingPhase('generating')
                if (data.result) {
                  get().updateMessage(agentId, streamingMessageId, {
                    metadata: {
                      isStreaming: true,
                      toolResults: data.result,
                    },
                  })
                }
                break

              case 'end':
                // Streaming complete
                get().setStreamingPhase('complete')
                get().updateMessage(agentId, streamingMessageId, {
                  content: fullContent,
                  metadata: {
                    isStreaming: false,
                    requestId: undefined,
                  },
                })
                set({ isTyping: false })

                // Persist conversation to disk for session memory
                try {
                  const chatDate = new Date().toISOString().split('T')[0]
                  fetch(`/api/chat/${agentId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      date: chatDate,
                      userMessage: content,
                      assistantMessage: fullContent,
                    }),
                  }).catch(() => {}) // Fire-and-forget, don't block UI
                } catch {
                  // Non-critical - don't break chat if persistence fails
                }
                // Reset phase after a brief delay
                setTimeout(() => get().setStreamingPhase('idle'), 1000)
                break

              case 'error':
                get().setStreamingPhase('idle')
                get().updateMessage(agentId, streamingMessageId, {
                  content: `Error: ${data.error || 'Failed to get response'}`,
                  metadata: {
                    isStreaming: false,
                    streamingError: data.error,
                  },
                })
                set({ isTyping: false })
                break
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Ensure final state is set
      if (get().isTyping) {
        get().updateMessage(agentId, streamingMessageId, {
          content: fullContent,
          metadata: {
            isStreaming: false,
            requestId: undefined,
          },
        })
        set({ isTyping: false })
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      set({ isTyping: false })
      get().setStreamingPhase('idle')

      get().addMessage(agentId, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Failed to send message. Please check your API configuration and try again.',
        timestamp: new Date().toISOString(),
        agentId,
      })
    }
  },
}))

// UI Store (panel sizes, preferences)
interface UIState {
  leftPanelWidth: number
  rightPanelWidth: number
  isLayer2Open: boolean
  setLeftPanelWidth: (width: number) => void
  setRightPanelWidth: (width: number) => void
  toggleLayer2: () => void
}

export const useUIStore = create<UIState>((set) => ({
  leftPanelWidth: 240,
  rightPanelWidth: 280,
  isLayer2Open: false,
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
  toggleLayer2: () => set((state) => ({ isLayer2Open: !state.isLayer2Open })),
}))

// File Store (file tree cache)
interface FileState {
  trees: Record<string, FileNode[]> // Keyed by agentId
  selectedFile: string | null
  fileContent: string | null
  loadTree: (agentId: string) => Promise<void>
  selectFile: (path: string | null) => void
  loadFile: (path: string) => Promise<void>
}

export const useFileStore = create<FileState>((set) => ({
  trees: {},
  selectedFile: null,
  fileContent: null,
  loadTree: async (agentId) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/files`)
      const tree = await response.json()
      set((state) => ({
        trees: {
          ...state.trees,
          [agentId]: tree,
        },
      }))
    } catch (error) {
      console.error('Failed to load file tree:', error)
    }
  },
  selectFile: (path) => set({ selectedFile: path, fileContent: null }),
  loadFile: async (path) => {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      const data = await response.json()
      set({ fileContent: data.content })
    } catch (error) {
      console.error('Failed to load file:', error)
    }
  },
}))

// Todos Store
interface TodoState {
  todos: Todo[]
  loadTodos: () => Promise<void>
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loadTodos: async () => {
    try {
      const profileId = getActiveProfileId()
      const url = addProfileId('/api/todos', profileId)
      const response = await fetch(url)
      const todos = await response.json()
      set({ todos })
    } catch (error) {
      console.error('Failed to load todos:', error)
    }
  },
  addTodo: async (todo) => {
    try {
      const profileId = getActiveProfileId()
      const url = addProfileId('/api/todos', profileId)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      })
      const newTodo = await response.json()
      set((state) => ({ todos: [...state.todos, newTodo] }))
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  },
  toggleTodo: async (id) => {
    try {
      // Get current todo to determine new completed state
      const currentTodo = useTodoStore.getState().todos.find(t => t.id === id)
      if (!currentTodo) return

      const newCompleted = currentTodo.status !== 'completed'
      const profileId = getActiveProfileId()
      const url = addProfileId(`/api/todos/${id}`, profileId)

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to toggle todo:', error)
        return
      }

      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id
            ? { ...todo, status: newCompleted ? 'completed' : 'pending', completed: newCompleted }
            : todo
        ),
      }))
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  },
  deleteTodo: async (id) => {
    try {
      const profileId = getActiveProfileId()
      const url = addProfileId(`/api/todos/${id}`, profileId)
      const response = await fetch(url, { method: 'DELETE' })
      if (!response.ok) {
        console.error('Failed to delete todo:', await response.json())
        return
      }
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  },
}))

// Challenges/Streaks Store
interface ChallengeState {
  challenges: Challenge[]
  loadChallenges: () => Promise<void>
  activateChallenge: (id: string) => Promise<{ success: boolean; todosCreated?: number }>
  pauseChallenge: (id: string) => Promise<{ success: boolean }>
  syncTodos: (id: string, day?: number) => Promise<{ success: boolean; synced?: number }>
  updateChallengeStatus: (id: string, status: Challenge['status']) => Promise<{ success: boolean }>
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  loadChallenges: async () => {
    try {
      const profileId = getActiveProfileId()
      const url = addProfileId('/api/challenges', profileId)
      const response = await fetch(url)
      const data = await response.json()
      // API returns { challenges: [...] }, extract the array
      set({ challenges: data.challenges || [] })
    } catch (error) {
      console.error('Failed to load challenges:', error)
      set({ challenges: [] })
    }
  },
  activateChallenge: async (id: string) => {
    try {
      const profileId = getActiveProfileId()
      const response = await fetch(`/api/challenges/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(profileId && { 'X-Profile-Id': profileId })
        },
        body: JSON.stringify({ status: 'active', profileId })
      })
      const result = await response.json()
      if (result.success) {
        // Update local state
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === id ? { ...c, status: 'active' } : c
          )
        }))
        // Reload todos to show new tasks
        useTodoStore.getState().loadTodos()
      }
      return { success: result.success, todosCreated: result.todosCreated }
    } catch (error) {
      console.error('Failed to activate challenge:', error)
      return { success: false }
    }
  },
  pauseChallenge: async (id: string) => {
    try {
      const profileId = getActiveProfileId()
      const response = await fetch(`/api/challenges/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(profileId && { 'X-Profile-Id': profileId })
        },
        body: JSON.stringify({ status: 'paused', profileId })
      })
      const result = await response.json()
      if (result.success) {
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === id ? { ...c, status: 'paused' } : c
          )
        }))
      }
      return { success: result.success }
    } catch (error) {
      console.error('Failed to pause challenge:', error)
      return { success: false }
    }
  },
  syncTodos: async (id: string, day?: number) => {
    try {
      const profileId = getActiveProfileId()
      const response = await fetch(`/api/challenges/${id}/sync-todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(profileId && { 'X-Profile-Id': profileId })
        },
        body: JSON.stringify({ day, profileId, replace: true })
      })
      const result = await response.json()
      if (result.success && result.synced > 0) {
        // Reload todos to show new tasks
        useTodoStore.getState().loadTodos()
      }
      return { success: result.success, synced: result.synced }
    } catch (error) {
      console.error('Failed to sync todos:', error)
      return { success: false }
    }
  },
  updateChallengeStatus: async (id: string, status: Challenge['status']) => {
    if (status === 'active') {
      return get().activateChallenge(id)
    } else if (status === 'paused') {
      return get().pauseChallenge(id)
    }
    try {
      const profileId = getActiveProfileId()
      const response = await fetch(`/api/challenges/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(profileId && { 'X-Profile-Id': profileId })
        },
        body: JSON.stringify({ status, profileId })
      })
      const result = await response.json()
      if (result.success) {
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === id ? { ...c, status } : c
          )
        }))
      }
      return { success: result.success }
    } catch (error) {
      console.error('Failed to update challenge status:', error)
      return { success: false }
    }
  },
}))

// Onboarding Store
interface OnboardingState {
  isActive: boolean
  type: 'user' | 'challenge' | null
  currentStep: string
  responses: Record<string, any>

  startOnboarding: (type: 'user' | 'challenge') => void
  answerStep: (stepId: string, value: any) => void
  getNextStep: () => { stepId: string; message: string; options?: any[] } | null
  completeOnboarding: () => Promise<void>
  markMessageAnswered: (messageIndex: number) => void
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isActive: false,
  type: null,
  currentStep: '',
  responses: {},

  startOnboarding: (type) => {
    set({
      isActive: true,
      type,
      currentStep: type === 'user' ? 'name' : 'challenge_name',
      responses: {},
    })
  },

  answerStep: (stepId, value) => {
    const { responses } = get()
    set({
      responses: { ...responses, [stepId]: value },
    })
  },

  getNextStep: () => {
    const { type, currentStep, responses } = get()

    if (!type) return null

    // Import will be done in UnifiedChat component
    // This is a placeholder - actual logic will use onboardingStateMachine
    return null
  },

  completeOnboarding: async () => {
    const { responses, type } = get()
    const profileId = getActiveProfileId()

    try {
      // Save onboarding data based on type
      if (type === 'user') {
        // Save to profile with profileId
        const url = addProfileId('/api/user/profile', profileId)
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(profileId && { 'X-Profile-Id': profileId })
          },
          body: JSON.stringify({ ...responses, profileId }),
        })
      } else if (type === 'challenge') {
        // Create challenge
        const url = addProfileId('/api/challenges', profileId)
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(profileId && { 'X-Profile-Id': profileId })
          },
          body: JSON.stringify({ ...responses, profileId }),
        })
      }

      // Reset onboarding state
      set({
        isActive: false,
        type: null,
        currentStep: '',
        responses: {},
      })
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  },

  markMessageAnswered: (messageIndex) => {
    // This will be handled in the chat store
  },
}))

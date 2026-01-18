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
  setActiveAgent: (id: string | null) => void
  loadAgents: () => Promise<void>
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  loadAgents: async () => {
    try {
      const response = await fetch('/api/agents')
      const agents = await response.json()
      set({ agents })
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  },
}))

// Chat Store
interface ChatState {
  messages: Record<string, ChatMessage[]> // Keyed by agentId
  isTyping: boolean
  setTyping: (isTyping: boolean) => void
  addMessage: (agentId: string, message: ChatMessage) => void
  updateMessage: (agentId: string, messageId: string, updates: Partial<ChatMessage>) => void
  markMessageAnswered: (agentId: string, messageIndex: number) => void
  loadHistory: (agentId: string) => Promise<void>
  sendMessage: (agentId: string, content: string, attachments?: File[]) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isTyping: false,
  setTyping: (isTyping) => set({ isTyping }),
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
      const response = await fetch(`/api/chat/${agentId}?date=${today}`)
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

      // Get profile ID from localStorage
      const profileId = typeof window !== 'undefined'
        ? localStorage.getItem('activeProfileId')
        : null

      // Use fetch streaming instead of WebSocket
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, content, profileId }),
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
                break

              case 'chunk':
                if (data.content) {
                  fullContent += data.content
                  get().updateMessage(agentId, streamingMessageId, {
                    content: fullContent,
                  })
                }
                break

              case 'skill_match':
                // Optional: show skill badge
                get().updateMessage(agentId, streamingMessageId, {
                  metadata: {
                    isStreaming: true,
                    skillUsed: data.skillName,
                  },
                })
                break

              case 'end':
                // Streaming complete
                get().updateMessage(agentId, streamingMessageId, {
                  content: fullContent,
                  metadata: {
                    isStreaming: false,
                    requestId: undefined,
                  },
                })
                set({ isTyping: false })
                break

              case 'error':
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
      await fetch(`/api/todos/${id}`, { method: 'PATCH' })
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id
            ? { ...todo, status: todo.status === 'completed' ? 'pending' : 'completed' }
            : todo
        ),
      }))
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  },
}))

// Challenges/Streaks Store
interface ChallengeState {
  challenges: Challenge[]
  loadChallenges: () => Promise<void>
}

export const useChallengeStore = create<ChallengeState>((set) => ({
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

    try {
      // Save onboarding data based on type
      if (type === 'user') {
        // Save to profile
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responses),
        })
      } else if (type === 'challenge') {
        // Create challenge
        const profileId = getActiveProfileId()
        const url = addProfileId('/api/challenges', profileId)
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responses),
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

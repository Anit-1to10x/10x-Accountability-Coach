// Todo type definitions

export interface Todo {
  id: string
  text: string           // Primary text field (used in data files)
  title?: string         // Alias for text (for compatibility)
  description?: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  agent?: string
  challengeId?: string   // Link to challenge
  challenge?: string     // Alias for challengeId
  dueDate?: string
  time?: string          // Format: "HH:MM" (e.g., "09:00")
  duration?: number      // Duration in minutes
  createdAt: string
  completedAt?: string
  generatedByAI?: boolean
}

export interface TodoList {
  active: Todo[]
  completed: Todo[]
}

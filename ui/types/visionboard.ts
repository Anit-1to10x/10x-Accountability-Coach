// Vision Board type definitions

export interface VisionBoardImage {
  id: string
  url: string  // Local file path or URL
  caption?: string
  addedAt: string
}

export interface VisionBoardGoal {
  id: string
  text: string
  category: 'career' | 'health' | 'relationships' | 'personal' | 'financial' | 'creative' | 'custom'
  achieved: boolean
  achievedAt?: string
}

export interface VisionBoard {
  id: string
  title: string
  description?: string
  agentId: string
  images: VisionBoardImage[]
  goals: VisionBoardGoal[]
  affirmations: string[]
  theme: 'dark' | 'light' | 'gradient'
  layout: 'grid' | 'masonry' | 'collage'
  createdAt: string
  updatedAt: string
}

export interface VisionBoardTemplate {
  id: string
  name: string
  description: string
  presetGoals: string[]
  presetAffirmations: string[]
  suggestedCategories: string[]
}

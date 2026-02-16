// Streak and challenge type definitions

export interface Streak {
  id: string
  challengeId: string
  current: number
  best: number
  lastCheckin: string
  missedDays: number
  graceUsed: number
}

export interface Punishment {
  id: string
  type: 'streak_break' | 'missed_todo' | 'missed_goal' | 'deadline_missed'
  trigger: {
    type: 'streak_days' | 'missed_count' | 'deadline'
    value: number  // e.g., 3 days, 5 missed todos
  }
  consequence: {
    type: 'message' | 'restriction' | 'public_shame' | 'donation' | 'custom'
    description: string
    severity: 'mild' | 'moderate' | 'severe'
  }
  status: 'active' | 'triggered' | 'executed' | 'forgiven'
  triggeredAt?: string
  executedAt?: string
  description?: string  // Human-readable description
  createdAt?: string    // When the punishment was created
  triggeredBy?: string  // What caused this punishment (challengeId, etc.)
}

export interface ChallengeMilestone {
  name: string
  day: number
  completed: boolean
}

export interface Challenge {
  id: string
  name: string
  type: 'learning' | 'building' | 'fitness' | 'habit' | 'creative' | 'custom'
  agent: string
  goal: string
  startDate: string
  targetDate?: string
  status: 'active' | 'paused' | 'completed' | 'failed' | 'upcoming' | 'pending'
  streak: Streak
  progress: number // 0-100
  completedDays?: number  // Number of completed days
  totalDays?: number  // Total days for the challenge
  punishments?: Punishment[]
  gracePeriod?: number  // hours before punishment triggers
  dailyHours?: number  // hours per day commitment
  availableSlots?: string[]  // time slots available
  milestones?: ChallengeMilestone[]  // Challenge milestones
}

export interface Milestone {
  id: string
  challengeId: string
  title: string
  description: string
  target: number
  achieved: boolean
  achievedAt?: string
}

// Schedule and calendar type definitions

export interface CalendarEvent {
  id: string
  title: string
  agent: string
  challenge?: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled'
  recurring?: RecurringPattern
  dependencies?: string[]
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  endDate?: string
}

export interface Calendar {
  events: CalendarEvent[]
  lastRestructured: string
  pendingChanges: PendingChange[]
}

export interface PendingChange {
  id: string
  eventId: string
  type: 'reschedule' | 'cancel' | 'modify'
  proposedDate?: string
  proposedTime?: string
  reason?: string
  timestamp: string
}

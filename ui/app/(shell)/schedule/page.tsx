'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CalendarEnhanced } from '@/components/schedule/CalendarEnhanced'
import { addProfileId, useProfileId } from '@/lib/useProfileId'

// Default: work block starting at 9 AM, dynamically sized based on tasks
const DEFAULT_START_HOUR = 9
const DEFAULT_TASK_DURATION = 60 // Each task gets 1 hour by default

// Parse time slot string like "9:00 AM - 12:00 PM" to { start: 9, end: 12 }
function parseTimeSlot(slot: string): { start: number; end: number } | null {
  const match = slot.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i)
  if (!match) return null

  let startHour = parseInt(match[1])
  const startPeriod = match[3]?.toUpperCase()
  let endHour = parseInt(match[4])
  const endPeriod = match[6]?.toUpperCase()

  // Convert to 24-hour format
  if (startPeriod === 'PM' && startHour !== 12) startHour += 12
  if (startPeriod === 'AM' && startHour === 12) startHour = 0
  if (endPeriod === 'PM' && endHour !== 12) endHour += 12
  if (endPeriod === 'AM' && endHour === 12) endHour = 0

  return { start: startHour, end: endHour }
}

// Convert total minutes to formatted time string (e.g., "9:30")
function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}:${mins.toString().padStart(2, '0')}`
}

// Schedule tasks with 1-hour slots each, back-to-back with no overlap
function scheduleTasksForDate(
  tasks: any[],
  dateStr: string,
  userAvailability?: { start: number; end: number }[]
): any[] {
  if (tasks.length === 0) return []

  // Use user availability or default start at 9 AM
  let startHour = DEFAULT_START_HOUR

  if (userAvailability && userAvailability.length > 0) {
    startHour = userAvailability[0].start
  }

  const scheduledTasks: any[] = []
  let currentMinutes = startHour * 60 // Start at beginning of work block

  tasks.forEach((task) => {
    // Each task gets exactly 1 hour (60 min) for clean calendar display
    const duration = DEFAULT_TASK_DURATION

    scheduledTasks.push({
      ...task,
      time: formatTime(currentMinutes),
      endTime: formatTime(currentMinutes + duration),
      duration,
      isFixed: task.flexibility === 'fixed',
    })

    // Move to next hour slot
    currentMinutes += duration
  })

  return scheduledTasks
}

export default function SchedulePage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<{ start: number; end: number }[]>([{ start: 9, end: 13 }]) // Default 4-hour block
  const profileId = useProfileId()
  const hasLoaded = useRef(false)
  const lastProfileId = useRef(profileId)

  useEffect(() => {
    // Only load if not loaded yet, or if profileId changed
    if (!hasLoaded.current || lastProfileId.current !== profileId) {
      hasLoaded.current = true
      lastProfileId.current = profileId
      loadEvents()
    }
  }, [profileId])

  // Re-fetch when files change via CLI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.category === 'challenge' || detail?.category === 'todo' || detail?.category === 'schedule') {
        loadEvents()
      }
    }
    window.addEventListener('file-sync', handler)
    return () => window.removeEventListener('file-sync', handler)
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)

      // Load all data in parallel including user availability
      const todosUrl = addProfileId('/api/todos', profileId)
      const availabilityUrl = addProfileId('/api/user/availability', profileId)

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      let challengeTasksUrl = addProfileId('/api/todos/from-challenges', profileId)
      challengeTasksUrl += (challengeTasksUrl.includes('?') ? '&' : '?') + `timezone=${encodeURIComponent(tz)}`
      const challengesUrl = addProfileId('/api/challenges', profileId)

      const [challengeTasksRes, todosRes, challengesRes, availabilityRes] = await Promise.all([
        fetch(challengeTasksUrl),
        fetch(todosUrl),
        fetch(challengesUrl),
        fetch(availabilityUrl)
      ])

      const [challengeTasksData, todosData, challengesData, availabilityData] = await Promise.all([
        challengeTasksRes.json(),
        todosRes.json(),
        challengesRes.json(),
        availabilityRes.json()
      ])

      const challengeTasks = challengeTasksData.tasks || []
      const todos = Array.isArray(todosData) ? todosData : []

      // Parse user availability settings - default to 4-hour block starting at 9 AM
      let userSlots: { start: number; end: number }[] = [{ start: 9, end: 13 }]
      if (availabilityData.availableSlots && availabilityData.availableSlots.length > 0) {
        const parsedSlots = availabilityData.availableSlots
          .map(parseTimeSlot)
          .filter((s: any): s is { start: number; end: number } => s !== null)

        if (parsedSlots.length > 0) {
          userSlots = parsedSlots
        }
      }
      setAvailability(userSlots)

      // Group tasks by date for scheduling
      const tasksByDate: Record<string, any[]> = {}

      // Add challenge tasks
      challengeTasks.forEach((task: any) => {
        const dateStr = task.dueDate || new Date().toISOString().split('T')[0]
        if (!tasksByDate[dateStr]) tasksByDate[dateStr] = []

        const isPaused = task.challengeStatus === 'paused'
        tasksByDate[dateStr].push({
          id: task.id,
          title: isPaused ? `[PAUSED] ${task.title}` : task.title,
          description: task.description || '',
          date: dateStr,
          dueDate: dateStr,
          duration: task.duration || 30,
          status: task.completed ? 'completed' : 'pending',
          type: 'challenge-task' as const,
          challengeName: task.challengeName,
          challengeId: task.challengeId,
          challengeStatus: task.challengeStatus || 'active',
          day: task.day,
          dayTitle: task.dayTitle,
          priority: task.priority || 'medium',
          flexibility: task.flexibility || 'flexible',
          isPaused,
        })
      })

      // Add regular todos
      todos.forEach((todo: any) => {
        const dateStr = todo.dueDate || new Date().toISOString().split('T')[0]
        if (!tasksByDate[dateStr]) tasksByDate[dateStr] = []

        tasksByDate[dateStr].push({
          id: todo.id,
          title: todo.text || todo.title,
          description: todo.description || '',
          date: dateStr,
          dueDate: dateStr,
          duration: todo.duration || 30,
          status: todo.status || (todo.completed === true ? 'completed' : 'pending'),
          type: 'todo' as const,
          challengeName: todo.challengeId,
          priority: todo.priority || 'medium',
          flexibility: todo.flexibility || 'flexible',
        })
      })

      // Schedule all tasks for each date
      const allEvents: any[] = []
      Object.entries(tasksByDate).forEach(([dateStr, tasks]) => {
        // Sort tasks by: 1) flexibility (fixed first), 2) priority (high first), 3) type (challenges first)
        const sortedTasks = tasks.sort((a, b) => {
          // Fixed tasks first
          if (a.flexibility === 'fixed' && b.flexibility !== 'fixed') return -1
          if (a.flexibility !== 'fixed' && b.flexibility === 'fixed') return 1

          // Then by priority
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
          const aPriority = priorityOrder[a.priority] ?? 1
          const bPriority = priorityOrder[b.priority] ?? 1
          if (aPriority !== bPriority) return aPriority - bPriority

          // Challenges before todos
          if (a.type === 'challenge-task' && b.type !== 'challenge-task') return -1
          if (a.type !== 'challenge-task' && b.type === 'challenge-task') return 1

          return 0
        })

        const scheduledTasks = scheduleTasksForDate(sortedTasks, dateStr, userSlots)
        allEvents.push(...scheduledTasks)
      })

      setEvents(allEvents)
    } catch (error) {
      console.error('Failed to load events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleEventStatusChange = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      // Find the event to check if it's a challenge task
      const event = events.find(e => e.id === id)

      if (event?.type === 'challenge-task' && event.challengeId && event.day) {
        // Use challenge-task API to update MD file
        const taskUrl = addProfileId('/api/todos/challenge-task', profileId)
        const res = await fetch(taskUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: id,
            completed: status === 'completed',
            challengeId: event.challengeId,
            day: event.day,
            title: event.title,
            profileId
          }),
        })

        const data = await res.json()
        if (!data.success) {
          console.error('Failed to toggle challenge task:', data.error)
          return
        }
      } else {
        // Regular todo - use todos API
        const todoUrl = addProfileId(`/api/todos/${id}`, profileId)
        await fetch(todoUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: status === 'completed' }),
        })
      }

      // Update local state
      setEvents((prev) =>
        prev.map((event) => (event.id === id ? { ...event, status } : event))
      )
    } catch (error) {
      console.error('Failed to update event status:', error)
    }
  }

  const handleEventReschedule = () => {
    // Reload events after rescheduling
    loadEvents()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <CalendarEnhanced
        events={events}
        onEventStatusChange={handleEventStatusChange}
        onEventReschedule={handleEventReschedule}
      />
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { CalendarEnhanced } from '@/components/schedule/CalendarEnhanced'
import { addProfileId, useProfileId } from '@/lib/useProfileId'

export default function SchedulePage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const profileId = useProfileId()

  useEffect(() => {
    loadEvents()
  }, [profileId])

  const loadEvents = async () => {
    try {
      setLoading(true)

      // Load challenge tasks from MD files
      const challengeTasksRes = await fetch('/api/todos/from-challenges')
      const challengeTasksData = await challengeTasksRes.json()
      const challengeTasks = challengeTasksData.tasks || []

      // Load regular todos
      const todosUrl = addProfileId('/api/todos', profileId)
      const todosRes = await fetch(todosUrl)
      const todosData = await todosRes.json()
      const todos = Array.isArray(todosData) ? todosData : []

      // Load challenges for start date info
      const challengesRes = await fetch('/api/challenges')
      const challengesData = await challengesRes.json()
      const challenges = challengesData.challenges || []

      // Convert challenge tasks to calendar events
      // Group by day and create daily events
      // Group tasks by day to calculate time slots within each day
      const tasksByDay: Record<string, any[]> = {}
      challengeTasks.forEach((task: any) => {
        const key = `${task.challengeId}-${task.day}`
        if (!tasksByDay[key]) tasksByDay[key] = []
        tasksByDay[key].push(task)
      })

      const challengeEvents = challengeTasks.map((task: any, index: number) => {
        // Calculate date based on challenge start date + day number
        const challenge = challenges.find((c: any) => c.id === task.challengeId)
        // Use challenge start date (e.g., 2026-01-01) or default to today
        const startDateStr = challenge?.start_date || challenge?.startDate || challenge?.['start date']

        // Parse date string directly without timezone issues
        let taskDate: Date
        if (startDateStr) {
          const [year, month, day] = startDateStr.split('-').map(Number)
          taskDate = new Date(year, month - 1, day + (task.day - 1))
        } else {
          taskDate = new Date()
          taskDate.setDate(taskDate.getDate() + (task.day - 1))
        }

        // Calculate time slot: 9:30 to 10:30, each task is 10 minutes
        // Find task index within its day
        const dayKey = `${task.challengeId}-${task.day}`
        const dayTasks = tasksByDay[dayKey] || []
        const taskIndexInDay = dayTasks.findIndex((t: any) => t.id === task.id)

        // Start at 9:30, add 10 minutes per task
        const startMinutes = 30 + (taskIndexInDay * 10) // 30, 40, 50, 60, 70...
        const startHour = 9 + Math.floor(startMinutes / 60)
        const startMin = startMinutes % 60

        // Format date without timezone issues
        const dateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`

        // Check if challenge is paused
        const isPaused = challenge?.status === 'paused'

        return {
          id: task.id,
          title: isPaused ? `[PAUSED] ${task.title}` : task.title,
          date: dateStr,
          time: `${startHour}:${startMin.toString().padStart(2, '0')}`,
          duration: 10, // Each task is 10 minutes
          status: task.completed ? 'completed' : 'pending',
          type: 'challenge-task' as const,
          challengeName: task.challengeName,
          challengeId: task.challengeId,
          challengeStatus: challenge?.status || 'active',
          day: task.day,
          dayTitle: task.dayTitle,
          priority: task.priority,
          isPaused,
        }
      })

      // Convert regular todos to calendar events
      const todoEvents = todos.map((todo: any) => ({
        id: todo.id,
        title: todo.text || todo.title,
        date: todo.dueDate || new Date().toISOString().split('T')[0],
        time: todo.time,
        duration: todo.duration || 30,
        status: todo.status || (todo.completed === true ? 'completed' : 'pending'),
        type: 'todo' as const,
        challengeName: todo.challengeId,
        priority: todo.priority,
      }))

      setEvents([...challengeEvents, ...todoEvents])
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
        const res = await fetch('/api/todos/challenge-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: id,
            completed: status === 'completed',
            challengeId: event.challengeId,
            day: event.day,
            title: event.title
          }),
        })

        const data = await res.json()
        if (!data.success) {
          console.error('Failed to toggle challenge task:', data.error)
          return
        }
      } else {
        // Regular todo - use todos API
        await fetch(`/api/todos/${id}`, {
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

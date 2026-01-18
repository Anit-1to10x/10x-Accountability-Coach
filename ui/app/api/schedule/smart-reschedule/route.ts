import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS, getProfilePaths } from '@/lib/paths'

const getEventsFile = (profileId?: string | null) => {
  const scheduleDir = profileId
    ? getProfilePaths(profileId).schedule
    : path.join(DATA_DIR, 'schedule')
  return path.join(scheduleDir, 'events.json')
}

const getHistoryDir = (profileId?: string | null) => {
  const scheduleDir = profileId
    ? getProfilePaths(profileId).schedule
    : path.join(DATA_DIR, 'schedule')
  return path.join(scheduleDir, 'history')
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  duration: number
  type: 'todo' | 'challenge' | 'meeting' | 'reminder'
  challengeId?: string
  todoId?: string
  completed?: boolean
}

interface Todo {
  id: string
  title: string
  status: string
  time?: string
  duration?: number
  dueDate?: string
}

// Parse time string "HH:MM" to minutes from midnight
const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert minutes to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Check if two time ranges overlap
const timesOverlap = (
  start1: number,
  duration1: number,
  start2: number,
  duration2: number
): boolean => {
  const end1 = start1 + duration1
  const end2 = start2 + duration2
  return start1 < end2 && end1 > start2
}

// GET: Check for conflicts at a specific time slot
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const duration = parseInt(searchParams.get('duration') || '30')
    const excludeId = searchParams.get('excludeId')
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    if (!date || !time) {
      return NextResponse.json(
        { error: 'date and time are required' },
        { status: 400 }
      )
    }

    const EVENTS_FILE = getEventsFile(profileId)

    // Read events from schedule
    let events: CalendarEvent[] = []
    try {
      const content = await fs.readFile(EVENTS_FILE, 'utf-8')
      events = JSON.parse(content)
    } catch {
      // No events file yet
    }

    // Also read from todos/active.json
    let todos: Todo[] = []
    try {
      const activeFile = path.join(PATHS.todos, 'active.json')
      const content = await fs.readFile(activeFile, 'utf-8')
      todos = JSON.parse(content)
    } catch {
      // No todos file
    }

    // Also read from challenge daily files
    const challengeEvents: CalendarEvent[] = []
    try {
      const challengesDir = PATHS.challenges
      const challengeFolders = await fs.readdir(challengesDir)

      for (const folder of challengeFolders) {
        const dailyDir = path.join(challengesDir, folder, 'daily')
        try {
          const dailyFiles = await fs.readdir(dailyDir)
          for (const file of dailyFiles) {
            if (file.endsWith('.json')) {
              const content = await fs.readFile(path.join(dailyDir, file), 'utf-8')
              const dayData = JSON.parse(content)
              if (dayData.date === date && dayData.todos) {
                for (const todo of dayData.todos) {
                  if (todo.time) {
                    challengeEvents.push({
                      id: todo.id,
                      title: todo.title,
                      date: dayData.date,
                      time: todo.time,
                      duration: todo.duration || 30,
                      type: 'todo',
                      challengeId: folder,
                    })
                  }
                }
              }
            }
          }
        } catch {
          // No daily folder for this challenge
        }
      }
    } catch {
      // No challenges directory
    }

    // Combine all events
    const allEvents = [
      ...events,
      ...challengeEvents,
      ...todos
        .filter((t) => t.dueDate === date && t.time)
        .map((t) => ({
          id: t.id,
          title: t.title,
          date: t.dueDate!,
          time: t.time!,
          duration: t.duration || 30,
          type: 'todo' as const,
        })),
    ]

    // Filter events for the specific date and find conflicts
    const newStart = parseTimeToMinutes(time)
    const conflicts = allEvents
      .filter((event) => {
        if (event.id === excludeId) return false
        if (event.date !== date) return false
        if (!event.time) return false

        const eventStart = parseTimeToMinutes(event.time)
        return timesOverlap(newStart, duration, eventStart, event.duration || 30)
      })
      .map((event) => ({
        id: event.id,
        title: event.title,
        time: event.time,
        duration: event.duration || 30,
      }))

    return NextResponse.json({
      conflicts,
      hasConflicts: conflicts.length > 0,
    })
  } catch (error: any) {
    console.error('Failed to check conflicts:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST: Reschedule a todo with conflict resolution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { todoId, newDate, newTime, reason, conflictResolution } = body

    // Get active profile ID
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    if (!todoId || !newDate || !newTime) {
      return NextResponse.json(
        { error: 'todoId, newDate, and newTime are required' },
        { status: 400 }
      )
    }

    const EVENTS_FILE = getEventsFile(profileId)
    const historyDir = getHistoryDir(profileId)

    // Track what was changed for the response
    const changes: Array<{ id: string; from: string; to: string }> = []

    // 1. Update in todos/active.json
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos
    const activeFile = path.join(todosDir, 'active.json')
    let todos: Todo[] = []
    try {
      const content = await fs.readFile(activeFile, 'utf-8')
      todos = JSON.parse(content)
    } catch {
      // No file
    }

    const todoIndex = todos.findIndex((t) => t.id === todoId)
    if (todoIndex !== -1) {
      const oldTodo = { ...todos[todoIndex] }
      todos[todoIndex].dueDate = newDate
      todos[todoIndex].time = newTime

      changes.push({
        id: todoId,
        from: `${oldTodo.dueDate} ${oldTodo.time}`,
        to: `${newDate} ${newTime}`,
      })

      await fs.writeFile(activeFile, JSON.stringify(todos, null, 2))
    }

    // 2. Update in schedule/events.json
    await fs.mkdir(path.dirname(EVENTS_FILE), { recursive: true })
    let events: CalendarEvent[] = []
    try {
      const content = await fs.readFile(EVENTS_FILE, 'utf-8')
      events = JSON.parse(content)
    } catch {
      // No file
    }

    const eventIndex = events.findIndex((e) => e.id === todoId || e.todoId === todoId)
    if (eventIndex !== -1) {
      const oldEvent = { ...events[eventIndex] }
      events[eventIndex].date = newDate
      events[eventIndex].time = newTime

      if (!changes.find((c) => c.id === todoId)) {
        changes.push({
          id: todoId,
          from: `${oldEvent.date} ${oldEvent.time}`,
          to: `${newDate} ${newTime}`,
        })
      }
    }

    // 3. Handle shift_all resolution - shift all conflicting events
    if (conflictResolution === 'shift_all') {
      const newStart = parseTimeToMinutes(newTime)
      const duration = todos[todoIndex]?.duration || events[eventIndex]?.duration || 30

      // Find and shift conflicting todos
      const todosToShift = todos.filter((t, idx) => {
        if (idx === todoIndex) return false
        if (t.dueDate !== newDate) return false
        if (!t.time) return false

        const todoStart = parseTimeToMinutes(t.time)
        return timesOverlap(newStart, duration, todoStart, t.duration || 30)
      })

      // Shift each conflicting todo by the duration of the new event
      for (const todo of todosToShift) {
        const oldTime = todo.time!
        const oldMinutes = parseTimeToMinutes(oldTime)
        const newMinutes = oldMinutes + duration
        const newTimeStr = minutesToTime(newMinutes)

        todo.time = newTimeStr

        changes.push({
          id: todo.id,
          from: `${todo.dueDate} ${oldTime}`,
          to: `${todo.dueDate} ${newTimeStr}`,
        })
      }

      // Similarly shift events
      const eventsToShift = events.filter((e, idx) => {
        if (idx === eventIndex) return false
        if (e.date !== newDate) return false
        if (!e.time) return false

        const eventStart = parseTimeToMinutes(e.time)
        return timesOverlap(newStart, duration, eventStart, e.duration || 30)
      })

      for (const event of eventsToShift) {
        const oldTime = event.time
        const oldMinutes = parseTimeToMinutes(oldTime)
        const newMinutes = oldMinutes + duration
        const newTimeStr = minutesToTime(newMinutes)

        event.time = newTimeStr

        if (!changes.find((c) => c.id === event.id)) {
          changes.push({
            id: event.id,
            from: `${event.date} ${oldTime}`,
            to: `${event.date} ${newTimeStr}`,
          })
        }
      }
    }

    // Save updates
    if (todos.length > 0) {
      await fs.writeFile(activeFile, JSON.stringify(todos, null, 2))
    }
    if (events.length > 0) {
      await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2))
    }

    // 4. Save to history
    await fs.mkdir(historyDir, { recursive: true })
    const historyFile = path.join(historyDir, `${new Date().toISOString().split('T')[0]}.json`)

    let history: any[] = []
    try {
      const content = await fs.readFile(historyFile, 'utf-8')
      history = JSON.parse(content)
    } catch {
      // No history file yet
    }

    history.push({
      timestamp: new Date().toISOString(),
      action: 'reschedule',
      todoId,
      reason: reason || 'User rescheduled',
      conflictResolution,
      changes,
    })

    await fs.writeFile(historyFile, JSON.stringify(history, null, 2))

    // 5. Update system index
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'smart_reschedule',
          data: {
            todoId,
            newDate,
            newTime,
            conflictResolution,
            changesCount: changes.length,
            timestamp: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      changes,
      conflictResolution,
    })
  } catch (error: any) {
    console.error('Failed to smart reschedule:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

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

// POST: Reschedule an event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, newDate, newTime, reason } = body

    // Get active profile ID
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    if (!eventId || !newDate || !newTime) {
      return NextResponse.json(
        { error: 'eventId, newDate, and newTime are required' },
        { status: 400 }
      )
    }

    const EVENTS_FILE = getEventsFile(profileId)

    // Ensure schedule directory exists
    await fs.mkdir(path.dirname(EVENTS_FILE), { recursive: true })

    // Read existing events
    let events: CalendarEvent[] = []
    try {
      const content = await fs.readFile(EVENTS_FILE, 'utf-8')
      events = JSON.parse(content)
    } catch {
      // File doesn't exist yet, start with empty array
      events = []
    }

    // Find event to reschedule
    const eventIndex = events.findIndex((e) => e.id === eventId)
    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const oldEvent = { ...events[eventIndex] }

    // Update event
    events[eventIndex].date = newDate
    events[eventIndex].time = newTime

    // Save updated events
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2))

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'event_rescheduled',
          data: {
            eventId,
            oldDate: oldEvent.date,
            oldTime: oldEvent.time,
            newDate,
            newTime,
            reason: reason || 'User rescheduled',
            timestamp: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      event: events[eventIndex],
      oldEvent,
    })
  } catch (error: any) {
    console.error('Failed to reschedule event:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET: Get rescheduling suggestions based on availability
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const date = searchParams.get('date')
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    const EVENTS_FILE = getEventsFile(profileId)

    // Read events
    let events: CalendarEvent[] = []
    try {
      const content = await fs.readFile(EVENTS_FILE, 'utf-8')
      events = JSON.parse(content)
    } catch {
      events = []
    }

    // Find the event
    const event = events.find((e) => e.id === eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Load user availability from profile
    const profilePath = path.join(PATHS.profile, 'availability.md')
    let availableSlots: string[] = []
    try {
      const profileContent = await fs.readFile(profilePath, 'utf-8')
      const slotsMatch = profileContent.match(/## Available Time Slots\n\n([\s\S]+?)(?:\n##|$)/)
      if (slotsMatch) {
        availableSlots = slotsMatch[1]
          .split('\n')
          .filter((line) => line.trim().startsWith('-'))
          .map((line) => line.replace(/^-\s*/, '').trim())
      }
    } catch {
      // Default slots if profile doesn't exist
      availableSlots = ['Morning (8-12pm)', 'Afternoon (12-5pm)', 'Evening (5-9pm)']
    }

    // Generate suggestions for the specified date or next 7 days
    const targetDate = date ? new Date(date) : new Date()
    const suggestions: Array<{ date: string; time: string; slot: string }> = []

    // Find free slots on target date
    const targetDateStr = targetDate.toISOString().split('T')[0]
    const dayEvents = events.filter((e) => e.date === targetDateStr)

    // Convert availability slots to time suggestions
    const timeSlots: Record<string, string[]> = {
      'Early Morning (5-8am)': ['06:00', '07:00'],
      'Morning (8-12pm)': ['09:00', '10:00', '11:00'],
      'Afternoon (12-5pm)': ['13:00', '14:00', '15:00', '16:00'],
      'Evening (5-9pm)': ['17:00', '18:00', '19:00', '20:00'],
      'Night (9pm+)': ['21:00', '22:00'],
    }

    availableSlots.forEach((slot) => {
      const times = timeSlots[slot] || []
      times.forEach((time) => {
        // Check if this time is free
        const isFree = !dayEvents.some((e) => e.time === time)
        if (isFree) {
          suggestions.push({
            date: targetDateStr,
            time,
            slot,
          })
        }
      })
    })

    return NextResponse.json({
      event,
      suggestions: suggestions.slice(0, 10), // Return top 10 suggestions
      availableSlots,
    })
  } catch (error: any) {
    console.error('Failed to get rescheduling suggestions:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

'use client'

import React, { useMemo, useState } from 'react'
import { CalendarEvent } from './CalendarEvent'
import { CheckCircle2, Circle, Clock, List, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

interface Event {
  id: string
  title: string
  time?: string
  duration?: number // Duration in minutes
  date: string
  status: 'completed' | 'pending' | 'cancelled' | 'missed'
  challengeName?: string
  challengeId?: string
  day?: number
  dayTitle?: string
  type: 'todo' | 'session' | 'task' | 'challenge-task'
  priority?: string
}

interface CalendarDayProps {
  date: Date
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventReschedule?: (id: string) => void
}

// Constants for time slot calculations
const HOUR_HEIGHT = 80 // pixels per hour
const MIN_EVENT_HEIGHT = 32 // minimum height for short events

// Parse time string "HH:MM" to minutes from midnight
const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Calculate event position and height
const getEventStyle = (event: Event): { top: number; height: number; minuteOffset: number } => {
  if (!event.time) {
    return { top: 0, height: MIN_EVENT_HEIGHT, minuteOffset: 0 }
  }

  const minutes = parseTimeToMinutes(event.time)
  const minuteOffset = minutes % 60 // Minutes within the hour
  const duration = event.duration || 30 // Default 30 minutes if not specified

  // Calculate top offset within hour slot (as pixels)
  const top = (minuteOffset / 60) * HOUR_HEIGHT

  // Calculate height based on duration
  const height = Math.max((duration / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT)

  return { top, height, minuteOffset }
}

export function CalendarDay({
  date,
  events,
  onEventStatusChange,
  onEventReschedule,
}: CalendarDayProps) {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [showTimeline, setShowTimeline] = useState(false)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  // Format date without timezone issues (use local date, not UTC)
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  // Get events for this day
  const dayEvents = events.filter((e) => e.date === dateStr)

  // Sort events by time
  const sortedEvents = [...dayEvents].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
  })

  // Get events that start within a specific hour
  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event) => {
      if (!event.time) return hour === 0
      const eventHour = parseInt(event.time.split(':')[0])
      return eventHour === hour
    })
  }

  // Check for conflicts (overlapping events)
  const eventsWithConflicts = useMemo(() => {
    const timedEvents = dayEvents.filter((e) => e.time)
    const conflicts = new Set<string>()

    for (let i = 0; i < timedEvents.length; i++) {
      for (let j = i + 1; j < timedEvents.length; j++) {
        const e1 = timedEvents[i]
        const e2 = timedEvents[j]

        if (!e1.time || !e2.time) continue

        const start1 = parseTimeToMinutes(e1.time)
        const end1 = start1 + (e1.duration || 30)
        const start2 = parseTimeToMinutes(e2.time)
        const end2 = start2 + (e2.duration || 30)

        if (start1 < end2 && end1 > start2) {
          conflicts.add(e1.id)
          conflicts.add(e2.id)
        }
      }
    }

    return conflicts
  }, [dayEvents])

  const isToday = date.toDateString() === new Date().toDateString()
  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()

  const completedCount = dayEvents.filter((e) => e.status === 'completed').length
  const pendingCount = dayEvents.filter((e) => e.status === 'pending').length
  const totalMinutes = dayEvents.reduce((sum, e) => sum + (e.duration || 10), 0)

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30'
      default: return 'text-oa-text-secondary bg-oa-bg-tertiary border-oa-border'
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day header */}
      <div className={`p-6 border-b border-oa-border ${isToday ? 'bg-oa-accent/5' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-medium text-oa-text-secondary mb-1">
              {date.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className={`text-2xl font-bold ${isToday ? 'text-oa-accent' : 'text-oa-text-primary'}`}>
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 border border-oa-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-oa-accent text-white'
                  : 'text-oa-text-secondary hover:bg-oa-bg-secondary'
              }`}
            >
              <List size={14} />
              List
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-oa-accent text-white'
                  : 'text-oa-text-secondary hover:bg-oa-bg-secondary'
              }`}
            >
              <Calendar size={14} />
              Timeline
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-oa-text-secondary">
              <span className="font-medium text-oa-text-primary">{completedCount}</span> completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-oa-text-secondary">
              <span className="font-medium text-oa-text-primary">{pendingCount}</span> pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-oa-text-secondary" />
            <span className="text-sm text-oa-text-secondary">
              <span className="font-medium text-oa-text-primary">{Math.round(totalMinutes / 60 * 10) / 10}h</span> total
            </span>
          </div>
          {eventsWithConflicts.size > 0 && (
            <div className="flex items-center gap-2 text-orange-500">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm font-medium">{eventsWithConflicts.size} conflicts</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          /* List View */
          <div className="p-4 space-y-2">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-12 text-oa-text-secondary">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tasks scheduled for this day</p>
              </div>
            ) : (
              sortedEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                    event.status === 'completed'
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-oa-bg-secondary border-oa-border hover:border-oa-accent/30'
                  }`}
                >
                  {/* Index number */}
                  <div className="w-6 h-6 rounded-full bg-oa-bg-tertiary flex items-center justify-center text-xs font-medium text-oa-text-secondary flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Checkbox */}
                  <button
                    onClick={() => onEventStatusChange?.(event.id, event.status === 'completed' ? 'pending' as any : 'completed')}
                    className="flex-shrink-0"
                  >
                    {event.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-oa-text-secondary hover:text-oa-accent transition-colors" />
                    )}
                  </button>

                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${event.status === 'completed' ? 'line-through text-oa-text-secondary' : 'text-oa-text-primary'}`}>
                      {event.title}
                    </div>
                    {event.challengeName && (
                      <div className="text-xs text-oa-text-secondary mt-0.5">
                        {event.challengeName} {event.day && `• Day ${event.day}`}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  {event.time && (
                    <div className="flex items-center gap-1 text-sm text-oa-text-secondary flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {event.time}
                    </div>
                  )}

                  {/* Duration */}
                  <div className="text-xs px-2 py-1 rounded bg-oa-bg-tertiary text-oa-text-secondary flex-shrink-0">
                    {event.duration || 10}m
                  </div>

                  {/* Priority */}
                  {event.priority && (
                    <div className={`text-xs px-2 py-1 rounded border flex-shrink-0 ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Show timeline button */}
            {sortedEvents.length > 0 && (
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="flex items-center gap-2 w-full p-3 mt-4 text-sm text-oa-text-secondary hover:text-oa-text-primary border border-oa-border rounded-lg hover:bg-oa-bg-secondary transition-colors"
              >
                {showTimeline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showTimeline ? 'Hide Timeline View' : 'Show Timeline View'}
              </button>
            )}

            {/* Collapsible timeline */}
            {showTimeline && (
              <div className="mt-4 border border-oa-border rounded-lg overflow-hidden">
                {renderTimelineView()}
              </div>
            )}
          </div>
        ) : (
          /* Timeline View */
          renderTimelineView()
        )}
      </div>
    </div>
  )

  function renderTimelineView() {
    return (
      <div>
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)
          const isCurrentHour = isToday && hour === currentHour

          return (
            <div
              key={hour}
              className={`border-b border-oa-border flex relative`}
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              {/* Time label */}
              <div className="w-20 p-3 text-right border-r border-oa-border flex-shrink-0">
                <div className={`text-sm font-medium ${isCurrentHour ? 'text-oa-accent' : 'text-oa-text-primary'}`}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="text-xs text-oa-text-secondary">
                  {hour < 12 ? 'AM' : 'PM'}
                </div>
              </div>

              {/* Events container */}
              <div className="flex-1 relative">
                {/* Current time indicator */}
                {isCurrentHour && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${(currentMinute / 60) * HOUR_HEIGHT}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-oa-accent" />
                      <div className="flex-1 h-0.5 bg-oa-accent" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {hourEvents.map((event, index) => {
                  const { top, height } = getEventStyle(event)
                  const hasConflict = eventsWithConflicts.has(event.id)

                  const sameTimeEvents = hourEvents.filter((e) => {
                    if (!e.time || !event.time) return false
                    const diff = Math.abs(parseTimeToMinutes(e.time) - parseTimeToMinutes(event.time))
                    return diff < 15
                  })
                  const offset = sameTimeEvents.indexOf(event)
                  const totalOverlap = sameTimeEvents.length

                  return (
                    <div
                      key={event.id}
                      className="absolute px-1"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: totalOverlap > 1 ? `${(offset / totalOverlap) * 100}%` : '4px',
                        right: totalOverlap > 1 ? `${((totalOverlap - offset - 1) / totalOverlap) * 100}%` : '4px',
                        zIndex: 10 + index,
                      }}
                    >
                      <CalendarEvent
                        event={{ ...event, duration: event.duration }}
                        onStatusChange={onEventStatusChange}
                        onReschedule={onEventReschedule}
                        hasConflict={hasConflict}
                        isCompact={height < 50}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}

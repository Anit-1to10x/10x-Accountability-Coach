'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarEvent } from './CalendarEvent'
import { CalendarWeek } from './CalendarWeek'
import { CalendarDay } from './CalendarDay'

interface Event {
  id: string
  title: string
  time?: string
  date: string
  status: 'completed' | 'pending' | 'cancelled' | 'missed'
  challengeName?: string
  type: 'todo' | 'session' | 'task'
}

type ViewMode = 'month' | 'week' | 'day'

interface CalendarEnhancedProps {
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventReschedule?: (id: string) => void
}

export function CalendarEnhanced({
  events = [],
  onEventStatusChange,
  onEventReschedule,
}: CalendarEnhancedProps) {
  // Find the earliest event date to initialize calendar view
  const earliestEventDate = useMemo(() => {
    if (events.length === 0) return new Date()

    const dates = events
      .map(e => new Date(e.date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    return dates.length > 0 ? dates[0] : new Date()
  }, [events])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Navigate to earliest event date when events load (for future-dated challenges)
  useEffect(() => {
    if (!hasInitialized && events.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // If earliest event is in the future, navigate to that month
      if (earliestEventDate.getTime() > today.getTime()) {
        setCurrentDate(new Date(earliestEventDate))
      }
      setHasInitialized(true)
    }
  }, [events, earliestEventDate, hasInitialized])

  const filteredEvents = events.filter((event) => {
    if (!dateRangeStart || !dateRangeEnd) return true
    const eventDate = new Date(event.date)
    return eventDate >= dateRangeStart && eventDate <= dateRangeEnd
  })

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const goToChallengeStart = () => {
    setCurrentDate(new Date(earliestEventDate))
  }

  // Check if we're viewing the challenge start month
  const isViewingChallengeStart = currentDate.getMonth() === earliestEventDate.getMonth() &&
    currentDate.getFullYear() === earliestEventDate.getFullYear()

  // Check if challenge is in the future
  const isChallengeInFuture = earliestEventDate.getTime() > new Date().setHours(0, 0, 0, 0)

  const getTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  const getEventsForDate = (date: Date) => {
    // Format date without timezone issues (use local date, not UTC)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return filteredEvents.filter((e) => e.date === dateStr)
  }

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-oa-bg-secondary/30" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()

      days.push(
        <div
          key={day}
          className={`min-h-[120px] border border-oa-border p-2 ${
            isToday ? 'bg-oa-accent/10 ring-2 ring-oa-accent' : 'bg-oa-bg-primary hover:bg-oa-bg-secondary'
          } transition-colors cursor-pointer`}
        >
          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-oa-accent' : 'text-oa-text-primary'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <CalendarEvent
                key={event.id}
                event={event}
                onStatusChange={onEventStatusChange}
                onReschedule={onEventReschedule}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[10px] text-oa-text-secondary px-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px bg-oa-border mb-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-oa-bg-primary p-2 text-center text-xs font-medium text-oa-text-secondary"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-oa-border">
          {days}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())

    return (
      <CalendarWeek
        startDate={weekStart}
        events={filteredEvents}
        onEventStatusChange={onEventStatusChange}
        onEventReschedule={onEventReschedule}
      />
    )
  }

  const renderDayView = () => {
    return (
      <CalendarDay
        date={currentDate}
        events={filteredEvents}
        onEventStatusChange={onEventStatusChange}
        onEventReschedule={onEventReschedule}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-oa-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-oa-text-primary">{getTitle()}</h2>
          <div className="text-sm text-oa-text-secondary">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View mode buttons */}
          <div className="flex border border-oa-border rounded-lg overflow-hidden">
            <button
              onClick={() => {
                setViewMode('month')
                setCurrentDate(new Date()) // Navigate to current month
              }}
              className={`px-3 py-1.5 text-sm ${
                viewMode === 'month'
                  ? 'bg-oa-accent text-white'
                  : 'bg-oa-bg-primary text-oa-text-secondary hover:bg-oa-bg-secondary'
              } transition-colors`}
            >
              Month
            </button>
            <button
              onClick={() => {
                setViewMode('week')
                setCurrentDate(new Date()) // Navigate to current week
              }}
              className={`px-3 py-1.5 text-sm border-x border-oa-border ${
                viewMode === 'week'
                  ? 'bg-oa-accent text-white'
                  : 'bg-oa-bg-primary text-oa-text-secondary hover:bg-oa-bg-secondary'
              } transition-colors`}
            >
              Week
            </button>
            <button
              onClick={() => {
                setViewMode('day')
                setCurrentDate(new Date()) // Navigate to today
              }}
              className={`px-3 py-1.5 text-sm ${
                viewMode === 'day'
                  ? 'bg-oa-accent text-white'
                  : 'bg-oa-bg-primary text-oa-text-secondary hover:bg-oa-bg-secondary'
              } transition-colors`}
            >
              Day
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-oa-text-primary" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm border border-oa-border hover:bg-oa-bg-secondary rounded-lg transition-colors text-oa-text-primary"
            >
              Today
            </button>
            {/* Show "Start" button for future-dated challenges */}
            {isChallengeInFuture && !isViewingChallengeStart && (
              <button
                onClick={goToChallengeStart}
                className="px-3 py-1.5 text-sm bg-oa-accent text-white hover:bg-oa-accent/90 rounded-lg transition-colors"
              >
                Start
              </button>
            )}
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-oa-text-primary" />
            </button>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2 border-l border-oa-border pl-4">
            <input
              type="date"
              value={dateRangeStart?.toISOString().split('T')[0] || ''}
              onChange={(e) => setDateRangeStart(e.target.value ? new Date(e.target.value) : null)}
              className="px-2 py-1 text-xs border border-oa-border bg-oa-bg-primary rounded text-oa-text-primary"
            />
            <span className="text-oa-text-secondary text-xs">to</span>
            <input
              type="date"
              value={dateRangeEnd?.toISOString().split('T')[0] || ''}
              onChange={(e) => setDateRangeEnd(e.target.value ? new Date(e.target.value) : null)}
              className="px-2 py-1 text-xs border border-oa-border bg-oa-bg-primary rounded text-oa-text-primary"
            />
            {(dateRangeStart || dateRangeEnd) && (
              <button
                onClick={() => {
                  setDateRangeStart(null)
                  setDateRangeEnd(null)
                }}
                className="text-xs text-oa-accent hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar view */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'month' && <div className="h-full overflow-y-auto p-4">{renderMonthView()}</div>}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>
    </div>
  )
}

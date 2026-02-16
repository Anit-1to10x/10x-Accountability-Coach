'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  ChevronDown,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react'
import { CalendarEvent } from './CalendarEvent'
import { MiniCalendar } from './MiniCalendar'
import { toDateString } from '@/lib/datetime'

interface Event {
  id: string
  title: string
  description?: string
  time?: string
  endTime?: string
  date: string
  dueDate?: string
  duration?: number
  status: 'completed' | 'pending' | 'cancelled' | 'missed'
  challengeName?: string
  challengeId?: string
  type: 'todo' | 'session' | 'task' | 'challenge-task'
  day?: number
  dayTitle?: string
  priority?: string
  flexibility?: 'fixed' | 'flexible'
  isFixed?: boolean
  overflow?: boolean
}

type ViewMode = 'day' | 'week' | 'month' | 'schedule'

interface CalendarEnhancedProps {
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventReschedule?: (id: string) => void
  onEventClick?: (event: Event) => void
}

// Hour height constant for timeline views (60px = 1 hour for better spacing)
const HOUR_HEIGHT = 60

export function CalendarEnhanced({
  events = [],
  onEventStatusChange,
  onEventReschedule,
  onEventClick,
}: CalendarEnhancedProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('schedule')
  const [showViewDropdown, setShowViewDropdown] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Navigate to todo page when event is clicked
  const handleEventClick = (event: Event) => {
    if (onEventClick) {
      onEventClick(event)
    } else {
      // Default behavior: navigate to todos page with event ID
      router.push(`/todos?id=${event.id}&date=${event.date}&type=${event.type}`)
    }
  }

  // Navigate to earliest event date when events load
  const earliestEventDate = useMemo(() => {
    if (events.length === 0) return new Date()
    const dates = events
      .map((e) => new Date(e.date))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    return dates.length > 0 ? dates[0] : new Date()
  }, [events])

  // Scroll to current hour on mount
  useEffect(() => {
    if (timelineRef.current && (viewMode === 'week' || viewMode === 'day')) {
      const currentHour = new Date().getHours()
      const scrollPosition = Math.max(0, (currentHour - 1) * HOUR_HEIGHT)
      timelineRef.current.scrollTop = scrollPosition
    }
  }, [viewMode])

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

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getFullYear()}`
      }
      return `${weekStart.toLocaleDateString('en-US', { month: 'short' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = toDateString(date)
    return events.filter((e) => e.date === dateStr)
  }

  const getWeekDays = () => {
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      return date
    })
  }

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    if (viewMode === 'month') {
      setViewMode('day')
    }
  }

  const viewModeLabels: Record<ViewMode, string> = {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    schedule: 'Schedule',
  }

  return (
    <div className="flex h-full bg-oa-bg-primary">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r border-oa-border flex-shrink-0 p-4">
          {/* Create button */}
          <button
            onClick={() => router.push('/app')}
            className="flex items-center gap-3 w-full px-6 py-3 mb-6 bg-oa-bg-secondary border border-oa-border rounded-full shadow-md hover:shadow-lg transition-all group"
          >
            <Plus className="w-5 h-5 text-oa-text-secondary group-hover:text-oa-accent" />
            <span className="text-sm font-medium text-oa-text-primary">Create</span>
          </button>

          {/* Mini Calendar */}
          <MiniCalendar
            currentDate={currentDate}
            onDateSelect={handleDateSelect}
            events={events}
          />

          {/* Calendars list */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-oa-text-secondary uppercase tracking-wider">
                Calendars
              </span>
              <Plus className="w-4 h-4 text-oa-text-secondary cursor-pointer hover:text-oa-accent" />
            </div>
            <div className="space-y-1">
              <CalendarListItem color="bg-blue-500" label="Challenges" checked />
              <CalendarListItem color="bg-green-500" label="Tasks" checked />
              <CalendarListItem color="bg-purple-500" label="Personal" />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-oa-border">
          <div className="flex items-center gap-4">
            {/* Hamburger menu */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-oa-bg-secondary rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-oa-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-oa-accent" />
              <span className="text-xl font-normal text-oa-text-primary">Calendar</span>
            </div>

            {/* Today button */}
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-oa-text-primary border border-oa-border rounded-md hover:bg-oa-bg-secondary transition-colors"
            >
              Today
            </button>

            {/* Navigation arrows */}
            <div className="flex items-center">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-oa-bg-secondary rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-oa-text-secondary" />
              </button>
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-oa-bg-secondary rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-oa-text-secondary" />
              </button>
            </div>

            {/* Current date title */}
            <h1 className="text-xl font-normal text-oa-text-primary">
              {getHeaderTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-oa-text-primary border border-oa-border rounded-md hover:bg-oa-bg-secondary transition-colors"
              >
                {viewModeLabels[viewMode]}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showViewDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowViewDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-oa-bg-primary border border-oa-border rounded-lg shadow-lg z-20 py-1">
                    {(['day', 'week', 'month', 'schedule'] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setViewMode(mode)
                          setShowViewDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          viewMode === mode
                            ? 'bg-oa-accent/10 text-oa-accent'
                            : 'text-oa-text-primary hover:bg-oa-bg-secondary'
                        }`}
                      >
                        {viewModeLabels[mode]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Calendar content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventStatusChange={onEventStatusChange}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventStatusChange={onEventStatusChange}
              onEventClick={handleEventClick}
              onEventReschedule={onEventReschedule}
              timelineRef={timelineRef}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventStatusChange={onEventStatusChange}
              onEventClick={handleEventClick}
              onEventReschedule={onEventReschedule}
              timelineRef={timelineRef}
            />
          )}
          {viewMode === 'schedule' && (
            <ScheduleView
              events={events}
              onEventStatusChange={onEventStatusChange}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Calendar list item component
function CalendarListItem({
  color,
  label,
  checked = false,
}: {
  color: string
  label: string
  checked?: boolean
}) {
  const [isChecked, setIsChecked] = useState(checked)

  return (
    <label className="flex items-center gap-3 py-1 px-2 rounded hover:bg-oa-bg-secondary cursor-pointer transition-colors">
      <div
        className={`w-4 h-4 rounded flex items-center justify-center ${
          isChecked ? color : 'border-2 border-oa-border'
        }`}
        onClick={() => setIsChecked(!isChecked)}
      >
        {isChecked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm text-oa-text-primary">{label}</span>
    </label>
  )
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventStatusChange,
  onEventClick,
  onDateSelect,
}: {
  currentDate: Date
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventClick?: (event: Event) => void
  onDateSelect: (date: Date) => void
}) {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  const today = new Date()

  const getEventsForDate = (date: Date) => {
    const dateStr = toDateString(date)
    return events.filter((e) => e.date === dateStr)
  }

  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    const prevDate = new Date(firstDay)
    prevDate.setDate(prevDate.getDate() - (startingDayOfWeek - i))
    currentWeek.push(prevDate)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    currentWeek.push(date)

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill remaining days of last week
  if (currentWeek.length > 0) {
    let nextDay = 1
    while (currentWeek.length < 7) {
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, nextDay)
      currentWeek.push(nextDate)
      nextDay++
    }
    weeks.push(currentWeek)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-oa-border">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-oa-text-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-[repeat(auto-fill,minmax(0,1fr))]">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-oa-border last:border-b-0">
            {week.map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date)
              const isToday = date.toDateString() === today.toDateString()
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={dayIndex}
                  onClick={() => onDateSelect(date)}
                  className={`min-h-[100px] p-1 border-r border-oa-border last:border-r-0 cursor-pointer transition-colors ${
                    !isCurrentMonth ? 'bg-oa-bg-secondary/50' : 'hover:bg-oa-bg-secondary/30'
                  }`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center text-sm mb-1 ${
                      isToday
                        ? 'bg-oa-accent text-white rounded-full'
                        : isCurrentMonth
                        ? 'text-oa-text-primary'
                        : 'text-oa-text-secondary'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                          event.status === 'completed'
                            ? 'bg-green-500/10 text-green-500 line-through'
                            : 'bg-oa-accent/10 text-oa-accent'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          onEventStatusChange?.(event.id, event.status === 'completed' ? 'pending' as any : 'completed')
                        }}
                        title="Click to view details, double-click to toggle status"
                      >
                        {event.time && <span className="font-medium">{event.time} </span>}
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-oa-text-secondary px-1.5">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({
  currentDate,
  events,
  onEventStatusChange,
  onEventClick,
  onEventReschedule,
  timelineRef,
}: {
  currentDate: Date
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventClick?: (event: Event) => void
  onEventReschedule?: (id: string) => void
  timelineRef: React.RefObject<HTMLDivElement>
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()
  const currentHour = today.getHours()
  const currentMinute = today.getMinutes()

  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    const dateStr = toDateString(date)
    return events.filter((event) => {
      if (event.date !== dateStr) return false
      if (!event.time) return hour === 0
      const eventHour = parseInt(event.time.split(':')[0])
      return eventHour === hour
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week header with dates */}
      <div className="flex border-b border-oa-border">
        <div className="w-16 flex-shrink-0" /> {/* Time column spacer */}
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((date, i) => {
            const isToday = date.toDateString() === today.toDateString()
            return (
              <div
                key={i}
                className="py-2 text-center border-l border-oa-border first:border-l-0"
              >
                <div className="text-xs font-medium text-oa-text-secondary uppercase">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`mt-1 w-10 h-10 mx-auto flex items-center justify-center text-2xl ${
                    isToday
                      ? 'bg-oa-accent text-white rounded-full'
                      : 'text-oa-text-primary'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Time grid */}
      <div ref={timelineRef} className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex" style={{ height: `${HOUR_HEIGHT}px` }}>
              {/* Time label */}
              <div className="w-16 flex-shrink-0 pr-2 text-right">
                <span className="text-xs text-oa-text-secondary -mt-2 block">
                  {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
                </span>
              </div>

              {/* Day columns */}
              <div className="flex-1 grid grid-cols-7 border-t border-oa-border">
                {weekDays.map((date, dayIndex) => {
                  const dayEvents = getEventsForDateAndHour(date, hour)
                  const isToday = date.toDateString() === today.toDateString()

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-l border-oa-border first:border-l-0 ${
                        isToday ? 'bg-oa-accent/5' : ''
                      }`}
                    >
                      {/* Current time indicator */}
                      {isToday && hour === currentHour && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none"
                          style={{ top: `${(currentMinute / 60) * HOUR_HEIGHT}px` }}
                        >
                          <div className="flex items-center">
                            <div className="w-3 h-3 -ml-1.5 rounded-full bg-red-500" />
                            <div className="flex-1 h-0.5 bg-red-500" />
                          </div>
                        </div>
                      )}

                      {/* Events */}
                      {dayEvents.map((event) => {
                        const eventMinute = event.time ? parseInt(event.time.split(':')[1]) : 0
                        const top = (eventMinute / 60) * HOUR_HEIGHT
                        const duration = event.duration || 30
                        const height = Math.max((duration / 60) * HOUR_HEIGHT, 28)

                        // Color scheme based on status and type
                        const getEventColors = () => {
                          if (event.status === 'completed') {
                            return 'bg-emerald-500/20 border-l-emerald-500 text-emerald-700 dark:text-emerald-300'
                          }
                          if (event.type === 'challenge-task') {
                            return 'bg-blue-500/20 border-l-blue-500 text-blue-700 dark:text-blue-300'
                          }
                          return 'bg-violet-500/20 border-l-violet-500 text-violet-700 dark:text-violet-300'
                        }

                        return (
                          <div
                            key={event.id}
                            className="absolute left-1 right-1 z-10"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                            }}
                          >
                            <div
                              onClick={() => onEventClick?.(event)}
                              onDoubleClick={() => onEventStatusChange?.(event.id, event.status === 'completed' ? 'pending' as any : 'completed')}
                              title={`${event.title}${event.description ? '\n' + event.description : ''}\nClick to view, double-click to toggle`}
                              className={`h-full rounded-md px-2 py-1 text-xs cursor-pointer overflow-hidden border-l-[3px] transition-all hover:shadow-lg hover:scale-[1.02] ${getEventColors()}`}
                            >
                              <div className={`font-semibold truncate leading-tight ${event.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                {event.title}
                              </div>
                              {height >= 40 && (
                                <div className="text-[10px] opacity-70 mt-0.5 truncate">
                                  {event.time && <span>{event.time}</span>}
                                  {event.duration && <span> · {event.duration}m</span>}
                                </div>
                              )}
                              {height >= 55 && event.challengeName && (
                                <div className="text-[10px] opacity-60 truncate">
                                  {event.challengeName}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Day View Component
function DayView({
  currentDate,
  events,
  onEventStatusChange,
  onEventClick,
  onEventReschedule,
  timelineRef,
}: {
  currentDate: Date
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventClick?: (event: Event) => void
  onEventReschedule?: (id: string) => void
  timelineRef: React.RefObject<HTMLDivElement>
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()
  const isToday = currentDate.toDateString() === today.toDateString()
  const currentHour = today.getHours()
  const currentMinute = today.getMinutes()

  const dateStr = toDateString(currentDate)
  const dayEvents = events.filter((e) => e.date === dateStr)

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event) => {
      if (!event.time) return hour === 0
      const eventHour = parseInt(event.time.split(':')[0])
      return eventHour === hour
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="py-4 text-center border-b border-oa-border">
        <div className="text-xs font-medium text-oa-text-secondary uppercase mb-1">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
        <div
          className={`w-12 h-12 mx-auto flex items-center justify-center text-3xl ${
            isToday ? 'bg-oa-accent text-white rounded-full' : 'text-oa-text-primary'
          }`}
        >
          {currentDate.getDate()}
        </div>
      </div>

      {/* Time grid */}
      <div ref={timelineRef} className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour)

            return (
              <div key={hour} className="flex" style={{ height: `${HOUR_HEIGHT}px` }}>
                {/* Time label */}
                <div className="w-20 flex-shrink-0 pr-3 text-right">
                  <span className="text-xs text-oa-text-secondary -mt-2 block">
                    {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
                  </span>
                </div>

                {/* Event area */}
                <div
                  className={`flex-1 relative border-t border-oa-border ${
                    isToday ? 'bg-oa-accent/5' : ''
                  }`}
                >
                  {/* Current time indicator */}
                  {isToday && hour === currentHour && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${(currentMinute / 60) * HOUR_HEIGHT}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-3 h-3 -ml-1.5 rounded-full bg-red-500" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {hourEvents.map((event, index) => {
                    const eventMinute = event.time ? parseInt(event.time.split(':')[1]) : 0
                    const top = (eventMinute / 60) * HOUR_HEIGHT
                    const duration = event.duration || 30
                    const height = Math.max((duration / 60) * HOUR_HEIGHT, 36)

                    // Color scheme based on status and type
                    const getEventColors = () => {
                      if (event.status === 'completed') {
                        return 'bg-emerald-500/15 border-l-emerald-500 text-emerald-700 dark:text-emerald-300'
                      }
                      if (event.type === 'challenge-task') {
                        return 'bg-blue-500/15 border-l-blue-500 text-blue-700 dark:text-blue-300'
                      }
                      return 'bg-violet-500/15 border-l-violet-500 text-violet-700 dark:text-violet-300'
                    }

                    return (
                      <div
                        key={event.id}
                        className="absolute left-2 right-6 z-10"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                        }}
                      >
                        <div
                          onClick={() => onEventClick?.(event)}
                          onDoubleClick={() => onEventStatusChange?.(event.id, event.status === 'completed' ? 'pending' as any : 'completed')}
                          title={`${event.title}${event.description ? '\n' + event.description : ''}\nClick to view, double-click to toggle`}
                          className={`h-full rounded-lg px-4 py-2 cursor-pointer border-l-4 transition-all hover:shadow-xl hover:scale-[1.01] ${getEventColors()}`}
                        >
                          <div className={`font-semibold text-sm ${event.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                            {event.title}
                          </div>
                          {height >= 50 && (
                            <div className="flex items-center gap-3 mt-1 text-xs opacity-70">
                              {event.time && <span>{event.time}{event.endTime && ` - ${event.endTime}`}</span>}
                              {event.duration && <span>{event.duration} min</span>}
                            </div>
                          )}
                          {height >= 70 && event.challengeName && (
                            <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{event.challengeName}</span>
                              {event.day && <span>Day {event.day}</span>}
                            </div>
                          )}
                          {height >= 90 && event.description && (
                            <p className="text-xs opacity-50 mt-1 line-clamp-2">{event.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Schedule View Component (List of upcoming events)
function ScheduleView({
  events,
  onEventStatusChange,
  onEventClick,
}: {
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventClick?: (event: Event) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, Event[]> = {}
    const sortedEvents = [...events]
      .filter((e) => new Date(e.date) >= today)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        if (!a.time && !b.time) return 0
        if (!a.time) return 1
        if (!b.time) return -1
        return a.time.localeCompare(b.time)
      })

    sortedEvents.forEach((event) => {
      if (!groups[event.date]) {
        groups[event.date] = []
      }
      groups[event.date].push(event)
    })

    return groups
  }, [events])

  const dates = Object.keys(groupedEvents).sort()

  return (
    <div className="h-full overflow-y-auto p-4">
      {dates.length === 0 ? (
        <div className="text-center py-12 text-oa-text-secondary">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((dateStr) => {
            const date = new Date(dateStr + 'T00:00:00')
            const isToday = date.toDateString() === new Date().toDateString()
            const dayEvents = groupedEvents[dateStr]

            return (
              <div key={dateStr}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-full flex flex-col items-center justify-center ${
                      isToday ? 'bg-oa-accent text-white' : 'bg-oa-bg-secondary text-oa-text-primary'
                    }`}
                  >
                    <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                    <span className="text-[10px] uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  </div>
                  <div>
                    <div className="font-medium text-oa-text-primary">
                      {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-oa-text-secondary">
                      {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Events list */}
                <div className="ml-6 border-l-2 border-oa-border pl-6 space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      onDoubleClick={() => onEventStatusChange?.(event.id, event.status === 'completed' ? 'pending' as any : 'completed')}
                      title="Click to view details, double-click to toggle status"
                      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                        event.status === 'completed'
                          ? 'bg-green-500/5 border-green-500'
                          : event.flexibility === 'fixed' || event.isFixed
                          ? 'bg-red-500/5 border-red-400 shadow-sm'
                          : 'bg-oa-bg-secondary border-oa-accent shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventStatusChange?.(event.id, event.status === 'completed' ? 'pending' as any : 'completed')
                          }}
                        >
                          {event.status === 'completed' ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-oa-accent hover:bg-oa-accent/10 transition-colors" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${event.status === 'completed' ? 'line-through text-oa-text-secondary' : 'text-oa-text-primary'}`}>
                              {event.title}
                            </span>
                            {(event.flexibility === 'fixed' || event.isFixed) && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Fixed</span>
                            )}
                            {event.priority === 'high' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded">High</span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-oa-text-secondary mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-sm text-oa-text-secondary">
                            {event.time && <span>{event.time}{event.endTime && ` - ${event.endTime}`}</span>}
                            {event.duration && <span>{event.duration}m</span>}
                            {event.challengeName && <span className="text-oa-accent">{event.challengeName}</span>}
                            {event.day && <span>Day {event.day}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import React from 'react'
import { CalendarEvent } from './CalendarEvent'

interface Event {
  id: string
  title: string
  time?: string
  date: string
  status: 'completed' | 'pending' | 'cancelled' | 'missed'
  challengeName?: string
  type: 'todo' | 'session' | 'task'
}

interface CalendarWeekProps {
  startDate: Date
  events: Event[]
  onEventStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onEventReschedule?: (id: string) => void
}

export function CalendarWeek({
  startDate,
  events,
  onEventStatusChange,
  onEventReschedule,
}: CalendarWeekProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return date
  })

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    // Format date without timezone issues (use local date, not UTC)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return events.filter((event) => {
      if (event.date !== dateStr) return false
      if (!event.time) return hour === 0 // All-day events show at midnight
      const eventHour = parseInt(event.time.split(':')[0])
      return eventHour === hour
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b border-oa-border sticky top-0 bg-oa-bg-primary z-10">
        <div className="p-2 text-xs font-medium text-oa-text-secondary border-r border-oa-border">
          Time
        </div>
        {weekDays.map((date) => {
          const isToday = date.toDateString() === new Date().toDateString()
          return (
            <div
              key={date.toISOString()}
              className={`p-2 text-center border-r border-oa-border last:border-r-0 ${
                isToday ? 'bg-oa-accent/10' : ''
              }`}
            >
              <div className="text-xs font-medium text-oa-text-secondary">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={`text-lg font-semibold ${
                  isToday ? 'text-oa-accent' : 'text-oa-text-primary'
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-oa-border min-h-[60px]">
            <div className="p-2 text-xs text-oa-text-secondary border-r border-oa-border">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((date) => {
              const dayEvents = getEventsForDateAndHour(date, hour)
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={date.toISOString()}
                  className={`p-1 border-r border-oa-border last:border-r-0 ${
                    isToday ? 'bg-oa-accent/5' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        onStatusChange={onEventStatusChange}
                        onReschedule={onEventReschedule}
                      />
                    ))}
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

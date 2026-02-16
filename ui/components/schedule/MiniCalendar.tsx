'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateString } from '@/lib/datetime'

interface Event {
  id: string
  date: string
  [key: string]: any
}

interface MiniCalendarProps {
  currentDate: Date
  onDateSelect: (date: Date) => void
  events?: Event[]
}

export function MiniCalendar({ currentDate, onDateSelect, events = [] }: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate))

  const today = new Date()
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const navigatePrevious = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setViewDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setViewDate(newDate)
  }

  const hasEventsOnDate = (date: Date) => {
    const dateStr = toDateString(date)
    return events.some((e) => e.date === dateStr)
  }

  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    currentWeek.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill remaining days of last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-oa-text-primary">
          {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={navigatePrevious}
            className="p-1 hover:bg-oa-bg-secondary rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-oa-text-secondary" />
          </button>
          <button
            onClick={navigateNext}
            className="p-1 hover:bg-oa-bg-secondary rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div
            key={i}
            className="w-8 h-8 flex items-center justify-center text-xs font-medium text-oa-text-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-0">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={dayIndex} className="w-8 h-8" />
              }

              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = date.toDateString() === currentDate.toDateString()
              const hasEvents = hasEventsOnDate(date)

              return (
                <button
                  key={dayIndex}
                  onClick={() => onDateSelect(date)}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-full relative transition-colors ${
                    isSelected
                      ? 'bg-oa-accent text-white'
                      : isToday
                      ? 'border border-oa-accent text-oa-accent'
                      : 'text-oa-text-primary hover:bg-oa-bg-secondary'
                  }`}
                >
                  {day}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-oa-accent" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

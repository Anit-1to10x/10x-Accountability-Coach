'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface CalendarProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  sessions: Array<{ date: string; status: string }>
}

export default function Calendar({ selectedDate, onSelectDate, sessions }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const getDateKey = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    // Format date without timezone issues (use local date, not UTC)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getSessionsForDay = (day: number) => {
    const dateKey = getDateKey(day)
    return sessions.filter(s => s.date === dateKey)
  }

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const daySessions = getSessionsForDay(day)
    const hasCompleted = daySessions.some(s => s.status === 'completed')
    const hasMissed = daySessions.some(s => s.status === 'missed')
    const hasUpcoming = daySessions.some(s => s.status === 'upcoming')

    days.push(
      <motion.button
        key={day}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelectDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
        className={`
          aspect-square rounded-lg flex flex-col items-center justify-center relative
          transition-all duration-200
          ${isSelected(day)
            ? 'bg-oa-primary text-white ring-2 ring-oa-primary'
            : isToday(day)
            ? 'bg-white/10 text-white ring-2 ring-white/30'
            : 'bg-white/5 text-white/80 hover:bg-white/10'
          }
        `}
      >
        <span className="text-sm font-medium">{day}</span>

        {/* Session indicators */}
        {daySessions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {hasCompleted && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Completed" />
            )}
            {hasMissed && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" title="Missed" />
            )}
            {hasUpcoming && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Upcoming" />
            )}
          </div>
        )}
      </motion.button>
    )
  }

  return (
    <div className="card">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={previousMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </motion.button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-white/40 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10 text-xs text-white/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          Completed
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          Upcoming
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          Missed
        </div>
      </div>
    </div>
  )
}

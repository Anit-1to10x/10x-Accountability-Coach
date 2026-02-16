'use client'

import React, { useState } from 'react'
import { Check, X, Clock, MoreVertical, AlertTriangle, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import RescheduleModal from './RescheduleModal'

interface CalendarEventProps {
  event: {
    id: string
    title: string
    time?: string
    duration?: number // Duration in minutes
    date?: string
    status: 'completed' | 'pending' | 'cancelled' | 'missed'
    challengeName?: string
    type: 'todo' | 'session' | 'task' | 'challenge-task'
  }
  onStatusChange?: (id: string, status: 'completed' | 'cancelled') => void
  onReschedule?: (id: string) => void
  onCheckin?: (event: CalendarEventProps['event']) => void
  hasConflict?: boolean
  isCompact?: boolean
}

// Format duration for display
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function CalendarEvent({
  event,
  onStatusChange,
  onReschedule,
  onCheckin,
  hasConflict = false,
  isCompact = false,
}: CalendarEventProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)

  const getStatusColor = () => {
    if (hasConflict) {
      return 'bg-orange-100 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-400 ring-2 ring-orange-500/50'
    }
    switch (event.status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
      case 'pending':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400'
      case 'cancelled':
      case 'missed':
        return 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
      default:
        return 'bg-oa-bg-secondary border-oa-border text-oa-text-primary'
    }
  }

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (event.status === 'completed') {
      onStatusChange?.(event.id, 'pending' as any)
    } else {
      onStatusChange?.(event.id, 'completed')
    }
  }

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStatusChange?.(event.id, 'cancelled')
    setShowMenu(false)
  }

  const handleRescheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRescheduleModal(true)
    setShowMenu(false)
  }

  const handleEventClick = () => {
    // Trigger check-in when clicking on the event
    if (event.status !== 'completed' && event.status !== 'cancelled') {
      if (onCheckin) {
        onCheckin(event)
      } else {
        // Default: navigate to chat with check-in message
        const challengeInfo = event.challengeName ? ` for ${event.challengeName}` : ''
        const checkinMessage = encodeURIComponent(`Check in${challengeInfo}: ${event.title}`)
        router.push(`/chat?agent=accountability-coach&message=${checkinMessage}`)
      }
    } else if (event.time) {
      // If already completed/cancelled, show reschedule modal
      setShowRescheduleModal(true)
    }
  }

  return (
    <>
      <div
        onClick={handleEventClick}
        className={`relative group h-full rounded-lg border-l-4 text-xs cursor-pointer
          ${getStatusColor()} transition-all hover:shadow-md hover:scale-[1.01] overflow-hidden
          ${isCompact ? 'px-2 py-1' : 'px-3 py-2'}`}
      >
        <div className="flex items-start justify-between gap-1 h-full">
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            {/* Quick check-in button */}
            <button
              onClick={handleCheckClick}
              className={`flex-shrink-0 w-4 h-4 rounded border transition-all ${
                event.status === 'completed'
                  ? 'bg-green-500 border-green-600'
                  : 'border-current hover:bg-current/10'
              } flex items-center justify-center`}
            >
              {event.status === 'completed' && <Check size={10} className="text-white" />}
            </button>

            <div className="flex-1 min-w-0 flex flex-col">
              {/* Title row */}
              <div className="flex items-center gap-1">
                {hasConflict && <AlertTriangle size={10} className="text-orange-500 flex-shrink-0" />}
                <div className={`font-medium truncate ${event.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                  {event.title}
                </div>
              </div>

              {/* Time and duration row */}
              {!isCompact && (
                <div className="flex items-center gap-2 mt-0.5 opacity-70">
                  {event.time && (
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.duration && (
                    <span className="text-[10px] bg-current/10 px-1 py-0.5 rounded">
                      {formatDuration(event.duration)}
                    </span>
                  )}
                </div>
              )}

              {/* Challenge name */}
              {!isCompact && event.challengeName && (
                <div className="text-[10px] mt-0.5 opacity-60 truncate">
                  {event.challengeName}
                </div>
              )}
            </div>
          </div>

          {/* More options menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-opacity"
            >
              <MoreVertical size={12} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-oa-bg-primary border border-oa-border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                <button
                  onClick={handleRescheduleClick}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-oa-bg-secondary transition-colors"
                >
                  Reschedule
                </button>
                {event.status !== 'cancelled' && (
                  <button
                    onClick={handleCancelClick}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-oa-bg-secondary transition-colors text-red-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showRescheduleModal && event.time && (
        <RescheduleModal
          session={{
            id: event.id,
            challengeName: event.challengeName || event.title,
            date: event.date || new Date().toISOString().split('T')[0],
            time: event.time,
            duration: event.duration,
          }}
          onClose={() => setShowRescheduleModal(false)}
          onReschedule={() => {
            setShowRescheduleModal(false)
            onReschedule?.(event.id)
          }}
        />
      )}
    </>
  )
}

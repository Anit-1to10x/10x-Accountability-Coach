'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle, Calendar, Clock, ArrowRight, Layers, GitMerge } from 'lucide-react'
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'

interface Session {
  id: string
  challengeName: string
  date: string
  time: string
  duration?: number
}

interface ConflictingEvent {
  id: string
  title: string
  time: string
  duration: number
}

type ConflictResolution = 'shift_all' | 'overlap' | 'cancel'

interface RescheduleModalProps {
  session: Session
  onClose: () => void
  onReschedule: () => void
}

// Parse time string "HH:MM" to minutes from midnight
const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Format duration for display
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default function RescheduleModal({ session, onClose, onReschedule }: RescheduleModalProps) {
  const [newDate, setNewDate] = useState(session.date)
  const [newTime, setNewTime] = useState(session.time)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictingEvent[]>([])
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution | null>(null)
  const [showConflictOptions, setShowConflictOptions] = useState(false)
  const profileId = useProfileId()

  // Check for conflicts when date/time changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (!newDate || !newTime) return

      setIsCheckingConflicts(true)
      try {
        const response = await fetch(
          `/api/schedule/smart-reschedule?date=${newDate}&time=${newTime}&duration=${session.duration || 30}&excludeId=${session.id}`
        )
        if (response.ok) {
          const data = await response.json()
          setConflicts(data.conflicts || [])
          setShowConflictOptions(data.conflicts?.length > 0)
          if (!data.conflicts?.length) {
            setConflictResolution(null)
          }
        }
      } catch (error) {
        console.error('Failed to check conflicts:', error)
      }
      setIsCheckingConflicts(false)
    }

    // Debounce conflict check
    const timer = setTimeout(checkConflicts, 300)
    return () => clearTimeout(timer)
  }, [newDate, newTime, session.duration, session.id])

  const handleSubmit = async () => {
    // If there are conflicts, require a resolution choice
    if (conflicts.length > 0 && !conflictResolution) {
      setShowConflictOptions(true)
      return
    }

    setIsSubmitting(true)

    try {
      const url = addProfileId('/api/schedule/smart-reschedule', profileId)
      await fetch(url, {
        method: 'POST',
        headers: getProfileHeaders(profileId),
        body: JSON.stringify({
          todoId: session.id,
          newDate,
          newTime,
          reason: reason || 'User rescheduled',
          conflictResolution: conflictResolution || 'overlap',
        }),
      })

      onReschedule()
    } catch (error) {
      console.error('Failed to reschedule:', error)
      setIsSubmitting(false)
    }
  }

  const hasTimeChanged = newDate !== session.date || newTime !== session.time

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-oa-dark rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Reschedule Todo</h2>
            <p className="text-white/60 text-sm">{session.challengeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Original Schedule */}
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-white/60 text-xs mb-2">Current Schedule</p>
            <div className="flex items-center gap-4 text-sm text-white">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(session.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {session.time}
              </div>
              {session.duration && (
                <div className="text-white/60 text-xs">
                  ({formatDuration(session.duration)})
                </div>
              )}
            </div>
          </div>

          {/* New Date */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              New Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-oa-primary"
            />
          </div>

          {/* New Time */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              New Time
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-oa-primary"
            />
          </div>

          {/* Conflict Detection */}
          {isCheckingConflicts && (
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Checking for conflicts...
              </div>
            </div>
          )}

          {/* Conflict Warning */}
          {conflicts.length > 0 && !isCheckingConflicts && (
            <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-orange-400 font-medium text-sm mb-2">
                    Time Conflict Detected
                  </p>
                  <div className="space-y-2">
                    {conflicts.map((conflict) => (
                      <div
                        key={conflict.id}
                        className="flex items-center gap-2 text-orange-300/80 text-xs bg-orange-500/10 px-2 py-1 rounded"
                      >
                        <Clock size={12} />
                        <span className="font-medium">{conflict.time}</span>
                        <span>-</span>
                        <span className="truncate">{conflict.title}</span>
                        <span className="text-orange-400/60">({formatDuration(conflict.duration)})</span>
                      </div>
                    ))}
                  </div>

                  {/* Conflict Resolution Options */}
                  {showConflictOptions && (
                    <div className="mt-4 space-y-2">
                      <p className="text-white/60 text-xs mb-2">How would you like to handle this?</p>

                      {/* Option 1: Shift All */}
                      <button
                        onClick={() => setConflictResolution('shift_all')}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          conflictResolution === 'shift_all'
                            ? 'bg-oa-primary/20 border-oa-primary text-white'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <GitMerge size={14} />
                          <span className="font-medium text-sm">Reschedule all remaining todos</span>
                        </div>
                        <p className="text-xs text-white/60 ml-6">
                          Shift all following todos to make room for this one
                        </p>
                      </button>

                      {/* Option 2: Overlap */}
                      <button
                        onClick={() => setConflictResolution('overlap')}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          conflictResolution === 'overlap'
                            ? 'bg-oa-primary/20 border-oa-primary text-white'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Layers size={14} />
                          <span className="font-medium text-sm">Let them overlap</span>
                        </div>
                        <p className="text-xs text-white/60 ml-6">
                          Keep both todos at the same time
                        </p>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Conflict - Good to go */}
          {hasTimeChanged && !isCheckingConflicts && conflicts.length === 0 && (
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">&#10003;</span>
                </div>
                No conflicts - this time slot is available
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Reason for Rescheduling <span className="text-white/40">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Unexpected work meeting, family emergency..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/40 resize-none focus:outline-none focus:border-oa-primary"
            />
          </div>

          {/* Preview of change */}
          {hasTimeChanged && (
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-white/60 text-xs mb-2">Change Preview</p>
              <div className="flex items-center gap-3 text-sm">
                <div className="text-white/60">
                  {new Date(session.date).toLocaleDateString()} {session.time}
                </div>
                <ArrowRight size={16} className="text-oa-primary" />
                <div className="text-oa-primary font-medium">
                  {new Date(newDate).toLocaleDateString()} {newTime}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || !hasTimeChanged || (conflicts.length > 0 && !conflictResolution)}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                isSubmitting || !hasTimeChanged || (conflicts.length > 0 && !conflictResolution)
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-oa-primary hover:bg-oa-secondary text-white'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Confirm Reschedule'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

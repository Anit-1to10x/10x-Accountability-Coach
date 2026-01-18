'use client'

import { motion } from 'framer-motion'
import { Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'

interface Session {
  id: string
  challengeName: string
  type: string
  date: string
  time: string
  duration: number
  status: 'upcoming' | 'completed' | 'missed'
  canReschedule: boolean
}

interface ScheduleListProps {
  sessions: Session[]
  onReschedule: (session: Session) => void
  onCancel: (sessionId: string) => void
}

export default function ScheduleList({ sessions, onReschedule, onCancel }: ScheduleListProps) {
  if (sessions.length === 0) {
    return (
      <div className="card text-center py-8">
        <CalendarIcon size={48} className="text-white/20 mx-auto mb-4" />
        <p className="text-white/60">No sessions scheduled for this day</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Today's Sessions</h3>

      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card hover:border-white/20 transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">
                {session.challengeName}
              </h4>
              <p className="text-white/60 text-sm capitalize">{session.type}</p>
            </div>

            <span
              className={`px-2 py-1 text-xs rounded-full ${
                session.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : session.status === 'missed'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {session.status}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-white/60 text-sm">
              <Clock size={16} className="mr-2" />
              {session.time} • {session.duration} min
            </div>
          </div>

          {session.status === 'upcoming' && (
            <>
              {!session.canReschedule && (
                <div className="flex items-start gap-2 mb-3 p-2 bg-yellow-500/10 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-400 mt-0.5" />
                  <p className="text-yellow-400 text-xs">
                    You've used your reschedule limit this week
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onReschedule(session)}
                  disabled={!session.canReschedule}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    session.canReschedule
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-white/5 text-white/40 cursor-not-allowed'
                  }`}
                >
                  Reschedule
                </button>
                <button
                  onClick={() => onCancel(session.id)}
                  className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  )
}

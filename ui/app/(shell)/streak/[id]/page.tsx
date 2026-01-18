'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Flame, Trophy, Calendar, TrendingUp, Clock, Target,
  AlertCircle, CheckCircle, XCircle, ArrowLeft, Pause, Play, Square
} from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import type { Challenge, Milestone } from '@/types/streak'

export default function StreakDetailPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [activityHistory, setActivityHistory] = useState<any[]>([])
  const [backlogTasks, setBacklogTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChallengeDetails()
  }, [challengeId])

  const loadChallengeDetails = async () => {
    try {
      // Load challenge
      const challengeRes = await fetch(`/api/challenges?id=${challengeId}`)
      const challengeData = await challengeRes.json()

      if (challengeData.challenges && challengeData.challenges.length > 0) {
        const found = challengeData.challenges.find((c: Challenge) => c.id === challengeId)
        setChallenge(found || null)
      }

      // Load activity history
      try {
        const activityRes = await fetch(`/api/challenges/${challengeId}/activity-log`)
        const activityData = await activityRes.json()
        setActivityHistory(activityData.activities || [])
      } catch (err) {
        console.error('Failed to load activity history:', err)
      }

      // Load milestones from progress.md
      try {
        const progressRes = await fetch(`/api/challenges/${challengeId}/progress`)
        const progressData = await progressRes.json()
        setMilestones(progressData.milestones || [])
      } catch (err) {
        console.error('Failed to load milestones:', err)
      }

      // Load backlog
      try {
        const backlogRes = await fetch(`/api/challenges/${challengeId}/backlog`)
        const backlogData = await backlogRes.json()
        setBacklogTasks(backlogData.tasks || [])
      } catch (err) {
        console.error('Failed to load backlog:', err)
      }
    } catch (error) {
      console.error('Failed to load challenge details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          date: new Date().toISOString(),
          notes: 'Manual check-in from streak page',
        }),
      })
      loadChallengeDetails()
    } catch (error) {
      console.error('Check-in failed:', error)
    }
  }

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'completed' | 'failed') => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setChallenge(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleToggleTask = async (
    challengeId: string,
    day: number,
    taskText: string,
    completed: boolean,
    activityIndex: number,
    taskIndex: number
  ) => {
    try {
      const res = await fetch('/api/todos/challenge-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          day,
          title: taskText,
          completed,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Update local state immediately for responsive UI
        setActivityHistory(prev => {
          const updated = [...prev]
          if (updated[activityIndex]?.tasks?.[taskIndex]) {
            updated[activityIndex].tasks[taskIndex].completed = completed

            // Check if all tasks in this day are completed
            const allCompleted = updated[activityIndex].tasks.every((t: any) => t.completed)
            updated[activityIndex].status = allCompleted ? 'completed' : 'pending'
          }
          return updated
        })

        // Update challenge progress
        if (challenge) {
          setChallenge({
            ...challenge,
            progress: data.progress || challenge.progress
          })
        }
      } else {
        console.error('Failed to toggle task:', data.error)
      }
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading streak details...</div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="w-16 h-16 text-oa-text-secondary mb-4" />
        <p className="text-oa-text-secondary mb-6">Challenge not found</p>
        <AnimatedButton variant="secondary" onClick={() => router.push('/streak')}>
          Back to Streaks
        </AnimatedButton>
      </div>
    )
  }

  const daysRemaining = challenge.targetDate
    ? Math.ceil((new Date(challenge.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500'
      case 'paused':
        return 'text-yellow-500'
      case 'completed':
        return 'text-blue-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-oa-border">
        <div className="flex items-center gap-4 mb-4">
          <AnimatedButton
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => router.push('/streak')}
          >
            Back
          </AnimatedButton>
        </div>
        <h1 className="text-2xl font-semibold text-oa-text-primary mb-2">
          {challenge.name}
        </h1>
        <p className="text-sm text-oa-text-secondary">{challenge.goal}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Streak */}
            <motion.div
              className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-oa-text-secondary">Current Streak</span>
              </div>
              <div className="text-3xl font-bold text-oa-text-primary">
                {challenge.streak.current}
              </div>
              <div className="text-xs text-oa-text-secondary">days</div>
            </motion.div>

            {/* Best Streak */}
            <motion.div
              className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-oa-text-secondary">Best Streak</span>
              </div>
              <div className="text-3xl font-bold text-oa-text-primary">
                {challenge.streak.best}
              </div>
              <div className="text-xs text-oa-text-secondary">days</div>
            </motion.div>

            {/* Progress */}
            <motion.div
              className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-oa-text-secondary">Progress</span>
              </div>
              <div className="text-3xl font-bold text-oa-text-primary">
                {challenge.progress}%
              </div>
              <div className="text-xs text-oa-text-secondary">complete</div>
            </motion.div>

            {/* Days Remaining */}
            <motion.div
              className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-oa-text-secondary">Days Left</span>
              </div>
              <div className="text-3xl font-bold text-oa-text-primary">
                {daysRemaining !== null ? daysRemaining : '∞'}
              </div>
              <div className="text-xs text-oa-text-secondary">
                {daysRemaining !== null ? 'days' : 'no deadline'}
              </div>
            </motion.div>
          </div>

          {/* Check-in Section */}
          <motion.div
            className="bg-oa-bg-secondary border border-oa-border rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-lg font-semibold text-oa-text-primary mb-4">
              Daily Check-in
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-oa-text-secondary mb-1">
                  Last check-in: {challenge.streak.lastCheckin ? new Date(challenge.streak.lastCheckin).toLocaleDateString() : 'Never'}
                </p>
                <p className="text-sm text-oa-text-secondary">
                  Status: <span className={`font-medium ${getStatusColor(challenge.status)}`}>
                    {challenge.status}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {challenge.status !== 'completed' && challenge.status !== 'failed' && (
                  <AnimatedButton variant="primary" onClick={handleCheckIn} disabled={challenge.status === 'paused'}>
                    <CheckCircle className="w-4 h-4" />
                    Check In Today
                  </AnimatedButton>
                )}
              </div>
            </div>

            {/* Status Controls */}
            <div className="mt-4 pt-4 border-t border-oa-border">
              <p className="text-xs text-oa-text-secondary mb-3">Challenge Controls:</p>
              <div className="flex flex-wrap gap-2">
                {challenge.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange('paused')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </button>
                )}
                {challenge.status === 'paused' && (
                  <button
                    onClick={() => handleStatusChange('active')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>
                )}
                {(challenge.status === 'active' || challenge.status === 'paused') && (
                  <>
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleStatusChange('failed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Stop
                    </button>
                  </>
                )}
                {(challenge.status === 'completed' || challenge.status === 'failed') && (
                  <button
                    onClick={() => handleStatusChange('active')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Restart Challenge
                  </button>
                )}
              </div>
              {challenge.status === 'paused' && (
                <p className="mt-2 text-xs text-yellow-500">
                  Challenge is paused. Tasks will still appear but check-ins are disabled.
                </p>
              )}
            </div>
          </motion.div>

          {/* Challenge Details */}
          <motion.div
            className="bg-oa-bg-secondary border border-oa-border rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-lg font-semibold text-oa-text-primary mb-4">
              Challenge Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-oa-text-secondary">Type:</span>
                <span className="text-sm font-medium text-oa-text-primary">
                  {challenge.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-oa-text-secondary">Start Date:</span>
                <span className="text-sm font-medium text-oa-text-primary">
                  {new Date(challenge.startDate).toLocaleDateString()}
                </span>
              </div>
              {challenge.targetDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-oa-text-secondary">Target Date:</span>
                  <span className="text-sm font-medium text-oa-text-primary">
                    {new Date(challenge.targetDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {challenge.dailyHours && (
                <div className="flex justify-between">
                  <span className="text-sm text-oa-text-secondary">Daily Commitment:</span>
                  <span className="text-sm font-medium text-oa-text-primary">
                    {challenge.dailyHours} hours/day
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-oa-text-secondary">Missed Days:</span>
                <span className="text-sm font-medium text-oa-text-primary">
                  {challenge.streak.missedDays}
                </span>
              </div>
              {challenge.gracePeriod !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-oa-text-secondary">Grace Period:</span>
                  <span className="text-sm font-medium text-oa-text-primary">
                    {challenge.gracePeriod} hours
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Milestones */}
          {milestones.length > 0 && (
            <motion.div
              className="bg-oa-bg-secondary border border-oa-border rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-lg font-semibold text-oa-text-primary mb-4">
                Milestones
              </h2>
              <div className="space-y-2">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-3">
                    {milestone.achieved ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-oa-border flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      milestone.achieved
                        ? 'text-oa-text-secondary line-through'
                        : 'text-oa-text-primary'
                    }`}>
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Daily Tasks - Show all days with their tasks */}
          {activityHistory.length > 0 && (
            <motion.div
              className="bg-oa-bg-secondary border border-oa-border rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-lg font-semibold text-oa-text-primary mb-4">
                Daily Tasks ({activityHistory.length} days)
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {activityHistory.map((activity, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${
                      activity.status === 'completed'
                        ? 'border-green-500/30 bg-green-500/5'
                        : activity.status === 'missed'
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-oa-border'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-oa-text-primary">
                          Day {activity.day}
                        </span>
                        {activity.title && activity.title !== `Day ${activity.day}` && (
                          <span className="text-sm text-oa-text-secondary">
                            - {activity.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.status === 'completed' ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Complete
                          </span>
                        ) : activity.status === 'missed' ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Missed
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Topics */}
                    {activity.topics && activity.topics.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {activity.topics.map((topic: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-oa-bg-tertiary text-oa-text-secondary">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    {activity.tasks && activity.tasks.length > 0 && (
                      <div className="space-y-1.5">
                        {activity.tasks.map((task: any, i: number) => (
                          <button
                            key={i}
                            className="flex items-start gap-2 w-full text-left hover:bg-oa-bg-tertiary/50 rounded p-1 -ml-1 transition-colors group"
                            onClick={() => handleToggleTask(challengeId, activity.day, task.text, !task.completed, idx, i)}
                          >
                            {task.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded border-2 border-oa-border group-hover:border-oa-accent mt-0.5 flex-shrink-0 transition-colors" />
                            )}
                            <span className={`text-sm ${task.completed ? 'text-oa-text-secondary line-through' : 'text-oa-text-primary'}`}>
                              {task.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Win */}
                    {activity.quickWin && (
                      <div className="mt-3 pt-2 border-t border-oa-border">
                        <span className="text-xs text-oa-text-secondary">Quick Win: </span>
                        <span className="text-xs text-oa-accent">{activity.quickWin}</span>
                      </div>
                    )}

                    {/* Time info */}
                    {activity.timeSpent && activity.timeSpent !== '0 hours' && (
                      <div className="mt-2 text-xs text-oa-text-secondary">
                        Time spent: {activity.timeSpent}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Punishment Contract */}
          {challenge.punishments && challenge.punishments.length > 0 && (
            <motion.div
              className="bg-red-500/5 border border-red-500/20 rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <h2 className="text-lg font-semibold text-oa-text-primary mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Accountability Contract
              </h2>
              {challenge.punishments.map((punishment) => (
                <div key={punishment.id} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-oa-text-primary">
                      {punishment.type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      punishment.status === 'active' ? 'bg-yellow-500/10 text-yellow-500' :
                      punishment.status === 'triggered' ? 'bg-orange-500/10 text-orange-500' :
                      punishment.status === 'executed' ? 'bg-red-500/10 text-red-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {punishment.status}
                    </span>
                  </div>
                  <p className="text-sm text-oa-text-secondary">
                    {punishment.consequence.description}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <AnimatedButton
              variant="secondary"
              fullWidth
              onClick={() => router.push(`/plan?challenge=${challengeId}`)}
            >
              <Target className="w-4 h-4" />
              View Plan
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              fullWidth
              onClick={() => router.push(`/schedule?challenge=${challengeId}`)}
            >
              <Clock className="w-4 h-4" />
              View Schedule
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  )
}

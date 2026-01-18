'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flame, Trophy, Calendar, TrendingUp, CheckCircle, Circle, ListTodo } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import type { Challenge } from '@/types/streak'
import { addProfileId, useProfileId } from '@/lib/useProfileId'

interface ChallengeWithTasks extends Challenge {
  todaysTasks?: { completed: boolean; text: string }[]
  totalDayFiles?: number
}

export default function StreakPage() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<ChallengeWithTasks[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const profileId = useProfileId()

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      // Use global challenges endpoint (not profile-specific)
      const res = await fetch('/api/challenges')
      const data = await res.json()
      const challengeList = data.challenges || []

      // Load today's tasks for each challenge
      const challengesWithTasks = await Promise.all(
        challengeList.map(async (challenge: Challenge) => {
          try {
            const activityRes = await fetch(`/api/challenges/${challenge.id}/activity-log`)
            const activityData = await activityRes.json()
            const activities = activityData.activities || []

            // Get the latest day's tasks (last in array is most recent)
            const latestDay = activities[activities.length - 1]
            return {
              ...challenge,
              todaysTasks: latestDay?.tasks || [],
              totalDayFiles: activities.length
            }
          } catch {
            return { ...challenge, todaysTasks: [], totalDayFiles: 0 }
          }
        })
      )

      setChallenges(challengesWithTasks)
    } catch (error) {
      console.error('Failed to load challenges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading streaks...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-oa-border">
        <h1 className="text-2xl font-semibold text-oa-text-primary mb-2">
          Your Streaks
        </h1>
        <p className="text-sm text-oa-text-secondary">
          Track all your active challenges and maintain your momentum
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {challenges.length === 0 ? (
          <div className="text-center py-12">
            <Flame className="w-16 h-16 text-oa-text-secondary mx-auto mb-4 opacity-50" />
            <p className="text-oa-text-secondary mb-6">
              No active challenges yet. Create your first challenge to start building streaks!
            </p>
            <AnimatedButton
              variant="primary"
              onClick={() => router.push('/app')}
            >
              Create Challenge
            </AnimatedButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                className="bg-oa-bg-secondary border border-oa-border rounded-lg p-6 cursor-pointer hover:border-oa-accent transition-colors"
                onClick={() => router.push(`/streak/${challenge.id}`)}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 17,
                }}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(challenge.status)}`}>
                    {challenge.status}
                  </span>
                  <span className="text-xs text-oa-text-secondary">
                    {challenge.type}
                  </span>
                </div>

                {/* Challenge Name */}
                <h3 className="text-lg font-semibold text-oa-text-primary mb-2">
                  {challenge.name}
                </h3>

                {/* Goal */}
                <p className="text-sm text-oa-text-secondary mb-4 line-clamp-2">
                  {challenge.goal}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Current Streak */}
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="text-xs text-oa-text-secondary">Current</div>
                      <div className="text-lg font-semibold text-oa-text-primary">
                        {challenge.streak.current} days
                      </div>
                    </div>
                  </div>

                  {/* Best Streak */}
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <div>
                      <div className="text-xs text-oa-text-secondary">Best</div>
                      <div className="text-lg font-semibold text-oa-text-primary">
                        {challenge.streak.best} days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-oa-text-secondary">Progress</span>
                    <span className="text-xs font-medium text-oa-text-primary">
                      {challenge.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-oa-bg-tertiary rounded-full h-2">
                    <motion.div
                      className="bg-oa-accent rounded-full h-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${challenge.progress}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* Deadline */}
                {challenge.targetDate && (
                  <div className="flex items-center gap-2 text-xs text-oa-text-secondary mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Due: {new Date(challenge.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Today's Tasks Preview */}
                {challenge.todaysTasks && challenge.todaysTasks.length > 0 && (
                  <div className="border-t border-oa-border pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ListTodo className="w-3 h-3 text-oa-text-secondary" />
                      <span className="text-xs text-oa-text-secondary">
                        Today's Tasks ({challenge.todaysTasks.filter(t => t.completed).length}/{challenge.todaysTasks.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {challenge.todaysTasks.slice(0, 3).map((task, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {task.completed ? (
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3 h-3 text-oa-text-secondary flex-shrink-0" />
                          )}
                          <span className={`text-xs truncate ${task.completed ? 'text-oa-text-secondary line-through' : 'text-oa-text-primary'}`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                      {challenge.todaysTasks.length > 3 && (
                        <span className="text-xs text-oa-text-secondary">
                          +{challenge.todaysTasks.length - 3} more tasks
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Total Days */}
                {challenge.totalDayFiles && challenge.totalDayFiles > 0 && (
                  <div className="text-xs text-oa-text-secondary mt-2">
                    {challenge.totalDayFiles} days planned
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

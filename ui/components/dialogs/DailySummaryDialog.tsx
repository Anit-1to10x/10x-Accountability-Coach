'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  X,
  Flame,
  Target,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Zap,
  ChevronRight,
  Sun,
  Moon,
  CloudSun,
  Sunrise,
  Award,
  BarChart3,
  Play,
  Loader2,
} from 'lucide-react'
import { useProfileId } from '@/lib/useProfileId'

interface Challenge {
  id: string
  name: string
  type?: string
  status: string
  currentDay: number
  totalDays: number
  streak: {
    current: number
    best: number
    lastCheckin?: string
  }
  progress: number
  todayCheckedIn?: boolean
}

interface Todo {
  id: string
  title: string
  completed: boolean
  priority?: string
  challengeName?: string
}

interface DailySummaryData {
  userName: string
  challenges: Challenge[]
  todos: Todo[]
  totalStreak: number
  longestStreak: number
  completedToday: number
  pendingToday: number
}

interface DailySummaryDialogProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Daily Summary Dialog for Returning Users
 *
 * Shows on every login with:
 * - Time-based greeting
 * - Streak cards for all active challenges
 * - Today's tasks summary
 * - Quick check-in button
 * - Motivational message
 */
export function DailySummaryDialog({ isOpen, onClose }: DailySummaryDialogProps) {
  const router = useRouter()
  const profileId = useProfileId()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DailySummaryData | null>(null)
  const [greeting, setGreeting] = useState({ text: '', icon: <Sun /> })

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting({ text: 'Good Morning', icon: <Sunrise className="w-6 h-6 text-amber-400" /> })
    } else if (hour >= 12 && hour < 17) {
      setGreeting({ text: 'Good Afternoon', icon: <Sun className="w-6 h-6 text-yellow-400" /> })
    } else if (hour >= 17 && hour < 21) {
      setGreeting({ text: 'Good Evening', icon: <CloudSun className="w-6 h-6 text-orange-400" /> })
    } else {
      setGreeting({ text: 'Good Night', icon: <Moon className="w-6 h-6 text-indigo-400" /> })
    }
  }, [])

  // Load data
  useEffect(() => {
    if (!isOpen) return

    async function loadData() {
      setLoading(true)
      try {
        const [profileRes, challengesRes, todosRes] = await Promise.all([
          fetch(`/api/user/profile?profileId=${profileId || 'default'}`).catch(() => null),
          fetch(`/api/challenges${profileId ? `?profileId=${profileId}` : ''}`).catch(() => null),
          fetch(`/api/todos${profileId ? `?profileId=${profileId}` : ''}`).catch(() => null),
        ])

        let userName = 'there'
        let challenges: Challenge[] = []
        let todos: Todo[] = []

        if (profileRes?.ok) {
          const profile = await profileRes.json()
          userName = profile.name || 'there'
        }

        if (challengesRes?.ok) {
          const challengeData = await challengesRes.json()
          challenges = Array.isArray(challengeData) ? challengeData.filter(c => c.status === 'active') : []
        }

        if (todosRes?.ok) {
          const todoData = await todosRes.json()
          todos = Array.isArray(todoData) ? todoData : []
        }

        // Calculate stats
        let totalStreak = 0
        let longestStreak = 0
        challenges.forEach(c => {
          if (c.streak?.current > totalStreak) totalStreak = c.streak.current
          if (c.streak?.best > longestStreak) longestStreak = c.streak.best
        })

        const completedToday = todos.filter(t => t.completed).length
        const pendingToday = todos.filter(t => !t.completed).length

        setData({
          userName,
          challenges,
          todos,
          totalStreak,
          longestStreak,
          completedToday,
          pendingToday,
        })
      } catch (error) {
        console.error('Failed to load daily summary:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, profileId])

  const handleCheckIn = (challengeId?: string) => {
    onClose()
    if (challengeId) {
      router.push(`/app?action=checkin&challenge=${challengeId}`)
    } else {
      router.push('/app?action=checkin')
    }
  }

  const handleViewChallenges = () => {
    onClose()
    router.push('/challenges')
  }

  const handleViewTodos = () => {
    onClose()
    router.push('/todos')
  }

  if (!isOpen) return null

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-b from-oa-bg-primary to-oa-bg-secondary border border-oa-border rounded-3xl shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-oa-text-secondary hover:text-oa-text-primary transition-colors rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[90vh] p-6 pb-24">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-oa-accent animate-spin" />
              </div>
            ) : (
              <>
                {/* Header with greeting */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-oa-bg-secondary rounded-full mb-4"
                  >
                    {greeting.icon}
                    <span className="text-sm font-medium text-oa-text-secondary">{dateStr}</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-oa-text-primary mb-2"
                  >
                    {greeting.text}, {data?.userName}!
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-oa-text-secondary"
                  >
                    Here's your daily overview
                  </motion.p>
                </div>

                {/* Quick Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-4 gap-3 mb-6"
                >
                  <QuickStatCard
                    icon={<Flame className="w-5 h-5" />}
                    value={data?.totalStreak || 0}
                    label="Day Streak"
                    color="orange"
                  />
                  <QuickStatCard
                    icon={<Award className="w-5 h-5" />}
                    value={data?.longestStreak || 0}
                    label="Best Streak"
                    color="yellow"
                  />
                  <QuickStatCard
                    icon={<CheckCircle className="w-5 h-5" />}
                    value={data?.completedToday || 0}
                    label="Completed"
                    color="green"
                  />
                  <QuickStatCard
                    icon={<Clock className="w-5 h-5" />}
                    value={data?.pendingToday || 0}
                    label="Pending"
                    color="blue"
                  />
                </motion.div>

                {/* Active Streak Cards */}
                {data?.challenges && data.challenges.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-oa-text-primary flex items-center gap-2">
                        <Target className="w-5 h-5 text-oa-accent" />
                        Active Challenges
                      </h2>
                      <button
                        onClick={handleViewChallenges}
                        className="text-sm text-oa-accent hover:underline flex items-center gap-1"
                      >
                        View all <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {data.challenges.slice(0, 3).map((challenge, idx) => (
                        <StreakCard
                          key={challenge.id}
                          challenge={challenge}
                          delay={0.5 + idx * 0.1}
                          onCheckIn={() => handleCheckIn(challenge.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Today's Tasks */}
                {data?.todos && data.todos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-oa-text-primary flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        Today's Tasks
                      </h2>
                      <button
                        onClick={handleViewTodos}
                        className="text-sm text-oa-accent hover:underline flex items-center gap-1"
                      >
                        View all <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {data.todos.filter(t => !t.completed).slice(0, 4).map((todo, idx) => (
                        <TaskItem key={todo.id} todo={todo} delay={0.7 + idx * 0.05} />
                      ))}
                      {data.pendingToday === 0 && (
                        <div className="text-center py-4 text-oa-text-secondary text-sm">
                          All tasks completed! Great job! 🎉
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Motivation Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-oa-accent/20 to-purple-500/20 rounded-2xl p-5 border border-oa-accent/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-oa-accent/20 rounded-xl">
                      <Zap className="w-6 h-6 text-oa-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-oa-text-primary mb-1">
                        {getMotivation(data)}
                      </h3>
                      <p className="text-sm text-oa-text-secondary">
                        {getMotivationSubtext(data)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Fixed bottom action bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-oa-bg-primary via-oa-bg-primary to-transparent">
            <div className="flex gap-3">
              <button
                onClick={() => handleCheckIn()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-oa-accent text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-oa-accent/30"
              >
                <Play className="w-5 h-5" />
                Quick Check-in
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 bg-oa-bg-secondary text-oa-text-primary rounded-xl font-medium hover:bg-oa-border transition-all"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Quick Stat Card Component
function QuickStatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'orange' | 'yellow' | 'green' | 'blue'
}) {
  const colorClasses = {
    orange: 'from-orange-500/20 to-red-500/20 text-orange-400',
    yellow: 'from-yellow-500/20 to-amber-500/20 text-yellow-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-3 text-center`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-2xl font-bold text-oa-text-primary">{value}</div>
      <div className="text-xs text-oa-text-secondary">{label}</div>
    </div>
  )
}

// Streak Card Component
function StreakCard({
  challenge,
  delay,
  onCheckIn,
}: {
  challenge: Challenge
  delay: number
  onCheckIn: () => void
}) {
  const progress = (challenge.currentDay / challenge.totalDays) * 100
  const needsCheckIn = !challenge.todayCheckedIn

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="bg-oa-bg-secondary/80 backdrop-blur rounded-xl p-4 border border-oa-border hover:border-oa-accent/50 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-oa-text-primary">{challenge.name}</h3>
            <p className="text-xs text-oa-text-secondary">
              Day {challenge.currentDay} of {challenge.totalDays}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 rounded-full">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{challenge.streak?.current || 0}</span>
          </div>

          {needsCheckIn && (
            <button
              onClick={onCheckIn}
              className="px-3 py-1.5 bg-oa-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Check in
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-oa-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: delay + 0.2, duration: 0.5 }}
          className="h-full bg-gradient-to-r from-oa-accent to-purple-500 rounded-full"
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-oa-text-secondary">{Math.round(progress)}% complete</span>
        <span className="text-xs text-oa-text-secondary">Best: {challenge.streak?.best || 0} days</span>
      </div>
    </motion.div>
  )
}

// Task Item Component
function TaskItem({ todo, delay }: { todo: Todo; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 bg-oa-bg-secondary/50 rounded-lg hover:bg-oa-bg-secondary transition-colors"
    >
      <div className="w-5 h-5 border-2 border-oa-border rounded-md flex-shrink-0" />
      <span className="text-sm text-oa-text-primary flex-1 truncate">{todo.title}</span>
      {todo.challengeName && (
        <span className="text-xs text-oa-text-secondary bg-oa-border px-2 py-0.5 rounded-full">
          {todo.challengeName}
        </span>
      )}
    </motion.div>
  )
}

// Motivation messages
function getMotivation(data: DailySummaryData | null): string {
  if (!data) return "Let's make today count!"

  if (data.totalStreak >= 30) return "🔥 Unstoppable! 30+ day streak!"
  if (data.totalStreak >= 14) return "🚀 Two weeks strong! Keep pushing!"
  if (data.totalStreak >= 7) return "⭐ One week down! You're building momentum!"
  if (data.totalStreak >= 3) return "💪 3-day streak! Consistency is key!"
  if (data.completedToday > 0) return "✨ Great progress today!"
  if (data.challenges.length > 0) return "🎯 Ready to crush your goals?"
  return "🌟 Let's start something amazing!"
}

function getMotivationSubtext(data: DailySummaryData | null): string {
  if (!data) return "Every expert was once a beginner."

  if (data.totalStreak >= 30) {
    return "You've proven that consistency beats intensity. Your discipline is inspiring!"
  }
  if (data.totalStreak >= 7) {
    return "A week of dedication shows real commitment. The compound effect is kicking in!"
  }
  if (data.pendingToday > 0) {
    return `You have ${data.pendingToday} task${data.pendingToday > 1 ? 's' : ''} to tackle. Small steps lead to big wins!`
  }
  if (data.challenges.length > 0) {
    return "Your challenges are waiting. One check-in at a time!"
  }
  return "The best time to start was yesterday. The second best time is now."
}

export default DailySummaryDialog

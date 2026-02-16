'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Flame,
  CheckCircle,
  Clock,
  TrendingUp,
  Sparkles,
  Calendar,
  Sun,
  Moon,
  CloudSun,
  Loader2,
} from 'lucide-react'
import { useProfileId } from '@/lib/useProfileId'

interface UserStats {
  name: string
  activeChallenges: number
  currentStreak: number
  longestStreak: number
  completedToday: number
  pendingTasks: number
  totalCheckIns: number
  recentMood?: string
  lastActive?: string
}

interface WelcomeSummaryProps {
  onGetStarted?: () => void
  agentName?: string
}

/**
 * Personalized Welcome Summary
 *
 * Shows a dynamic greeting based on:
 * - Time of day
 * - User's name from profile
 * - Active challenges and streaks
 * - Tasks completed/pending
 * - Recent activity
 */
export function WelcomeSummary({ onGetStarted, agentName }: WelcomeSummaryProps) {
  const profileId = useProfileId()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [timeIcon, setTimeIcon] = useState<React.ReactNode>(null)

  // Determine greeting based on time
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning')
      setTimeIcon(<Sun className="w-5 h-5 text-yellow-400" />)
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon')
      setTimeIcon(<CloudSun className="w-5 h-5 text-orange-400" />)
    } else if (hour >= 17 && hour < 21) {
      setGreeting('Good evening')
      setTimeIcon(<CloudSun className="w-5 h-5 text-amber-400" />)
    } else {
      setGreeting('Good night')
      setTimeIcon(<Moon className="w-5 h-5 text-indigo-400" />)
    }
  }, [])

  // Load user stats
  useEffect(() => {
    async function loadStats() {
      if (!profileId) {
        setStats({ name: 'there', activeChallenges: 0, currentStreak: 0, longestStreak: 0, completedToday: 0, pendingTasks: 0, totalCheckIns: 0 })
        setLoading(false)
        return
      }

      try {
        // Load stats in parallel
        const [profileRes, challengesRes, todosRes] = await Promise.allSettled([
          fetch(`/api/user/profile?profileId=${profileId}`),
          fetch(`/api/challenges?profileId=${profileId}`),
          fetch(`/api/todos?profileId=${profileId}`),
        ])

        let name = 'there'
        let activeChallenges = 0
        let currentStreak = 0
        let longestStreak = 0
        let totalCheckIns = 0
        let completedToday = 0
        let pendingTasks = 0

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const profile = await profileRes.value.json()
          name = profile.name || 'there'
        }

        if (challengesRes.status === 'fulfilled' && challengesRes.value.ok) {
          const challenges = await challengesRes.value.json()
          if (Array.isArray(challenges)) {
            activeChallenges = challenges.filter(c => c.status === 'active').length
            challenges.forEach(c => {
              if (c.streak?.current > currentStreak) currentStreak = c.streak.current
              if (c.streak?.best > longestStreak) longestStreak = c.streak.best
            })
          }
        }

        if (todosRes.status === 'fulfilled' && todosRes.value.ok) {
          const todos = await todosRes.value.json()
          if (Array.isArray(todos)) {
            const today = new Date().toISOString().split('T')[0]
            completedToday = todos.filter(t => t.completed && t.completedAt?.startsWith(today)).length
            pendingTasks = todos.filter(t => !t.completed).length
          }
        }

        setStats({
          name,
          activeChallenges,
          currentStreak,
          longestStreak,
          completedToday,
          pendingTasks,
          totalCheckIns,
        })
      } catch (error) {
        console.error('Failed to load welcome stats:', error)
        setStats({ name: 'there', activeChallenges: 0, currentStreak: 0, longestStreak: 0, completedToday: 0, pendingTasks: 0, totalCheckIns: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [profileId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-oa-accent animate-spin" />
      </div>
    )
  }

  const name = stats?.name || 'there'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      {/* Main Greeting */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
          {timeIcon}
          <h1 className="text-2xl font-bold text-oa-text-primary">
            {greeting}, {name}!
          </h1>
        </motion.div>

        <p className="text-oa-text-secondary">
          {agentName
            ? `I'm your ${agentName}. Let's make today count!`
            : "I'm your 10X Accountability Coach. Let's make today count!"}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (stats.activeChallenges > 0 || stats.currentStreak > 0 || stats.pendingTasks > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.activeChallenges > 0 && (
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Active Challenges"
              value={stats.activeChallenges}
              color="text-blue-400"
              bgColor="bg-blue-400/10"
            />
          )}

          {stats.currentStreak > 0 && (
            <StatCard
              icon={<Flame className="w-5 h-5" />}
              label="Current Streak"
              value={`${stats.currentStreak} days`}
              color="text-orange-400"
              bgColor="bg-orange-400/10"
            />
          )}

          {stats.completedToday > 0 && (
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Completed Today"
              value={stats.completedToday}
              color="text-green-400"
              bgColor="bg-green-400/10"
            />
          )}

          {stats.pendingTasks > 0 && (
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Pending Tasks"
              value={stats.pendingTasks}
              color="text-amber-400"
              bgColor="bg-amber-400/10"
            />
          )}
        </motion.div>
      )}

      {/* Motivational message based on context */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-oa-bg-secondary/50 rounded-xl p-6 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-oa-accent/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-oa-accent" />
          </div>
          <div>
            <h3 className="font-medium text-oa-text-primary mb-1">
              {getMotivationalTitle(stats)}
            </h3>
            <p className="text-sm text-oa-text-secondary">
              {getMotivationalMessage(stats)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {stats?.activeChallenges === 0 && (
          <QuickActionButton
            icon={<Target className="w-4 h-4" />}
            label="Start a Challenge"
            onClick={onGetStarted}
            primary
          />
        )}
        {(stats?.activeChallenges ?? 0) > 0 && (
          <QuickActionButton
            icon={<CheckCircle className="w-4 h-4" />}
            label="Quick Check-in"
            onClick={onGetStarted}
            primary
          />
        )}
        <QuickActionButton
          icon={<Calendar className="w-4 h-4" />}
          label="View Schedule"
          href="/schedule"
        />
        <QuickActionButton
          icon={<TrendingUp className="w-4 h-4" />}
          label="See Progress"
          href="/challenges"
        />
      </motion.div>
    </motion.div>
  )
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  bgColor: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-oa-bg-secondary rounded-xl p-4"
    >
      <div className={`${bgColor} ${color} p-2 rounded-lg w-fit mb-2`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-oa-text-primary">{value}</div>
      <div className="text-xs text-oa-text-secondary">{label}</div>
    </motion.div>
  )
}

// Quick Action Button
function QuickActionButton({
  icon,
  label,
  onClick,
  href,
  primary,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
  primary?: boolean
}) {
  const className = `
    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
    ${primary
      ? 'bg-oa-accent text-white hover:opacity-90'
      : 'bg-oa-bg-secondary text-oa-text-primary hover:bg-oa-border'
    }
  `

  if (href) {
    return (
      <a href={href} className={className}>
        {icon}
        {label}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  )
}

// Get motivational title based on user context
function getMotivationalTitle(stats: UserStats | null): string {
  if (!stats) return 'Ready to begin?'

  if (stats.currentStreak >= 7) {
    return `${stats.currentStreak} days strong!`
  }

  if (stats.completedToday > 0) {
    return "You're on fire today!"
  }

  if (stats.activeChallenges > 0) {
    return 'Keep the momentum going!'
  }

  return 'Ready to start your journey?'
}

// Get motivational message based on user context
function getMotivationalMessage(stats: UserStats | null): string {
  if (!stats) {
    return "Set up your first challenge and let's start building better habits together."
  }

  if (stats.currentStreak >= 30) {
    return `Incredible! You've maintained a ${stats.currentStreak}-day streak. You're proving that consistency is key to success!`
  }

  if (stats.currentStreak >= 7) {
    return `A week of dedication shows real commitment. Keep pushing and watch your progress compound!`
  }

  if (stats.completedToday >= 3) {
    return `${stats.completedToday} tasks done already! You're crushing it. What's next on your list?`
  }

  if (stats.pendingTasks > 0) {
    return `You have ${stats.pendingTasks} task${stats.pendingTasks > 1 ? 's' : ''} waiting. Let's tackle them one by one!`
  }

  if (stats.activeChallenges > 0) {
    return `You have ${stats.activeChallenges} active challenge${stats.activeChallenges > 1 ? 's' : ''}. Focus on progress, not perfection.`
  }

  return "Every journey begins with a single step. What will yours be today?"
}

export default WelcomeSummary

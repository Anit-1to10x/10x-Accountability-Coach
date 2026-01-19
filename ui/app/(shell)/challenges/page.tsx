'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Target,
  Flame,
  Trophy,
  Calendar,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import type { Challenge } from '@/types/streak'

// Challenge templates for quick start
const CHALLENGE_TEMPLATES = [
  {
    id: 'template-30day',
    name: '30-Day Accountability',
    description: 'Build consistent habits with daily check-ins and progress tracking',
    duration: 30,
    icon: '🎯',
    category: 'habits'
  },
  {
    id: 'template-fitness',
    name: '30-Day Fitness',
    description: 'Transform your body with structured workout routines',
    duration: 30,
    icon: '💪',
    category: 'health'
  },
  {
    id: 'template-learning',
    name: '21-Day Learning Sprint',
    description: 'Master a new skill with focused daily practice',
    duration: 21,
    icon: '📚',
    category: 'learning'
  },
  {
    id: 'template-mindfulness',
    name: '14-Day Mindfulness',
    description: 'Develop a daily meditation practice',
    duration: 14,
    icon: '🧘',
    category: 'wellness'
  }
]

export default function ChallengesPage() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'failed'>('all')
  const hasLoaded = React.useRef(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; challenge: Challenge | null }>({
    isOpen: false,
    challenge: null
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      loadChallenges()
    }
  }, [])

  const loadChallenges = async () => {
    try {
      const res = await fetch('/api/challenges')
      const data = await res.json()
      setChallenges(data.challenges || [])
    } catch (error) {
      console.error('Failed to load challenges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, challenge: Challenge) => {
    e.stopPropagation() // Prevent navigation to challenge detail
    setDeleteModal({ isOpen: true, challenge })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.challenge) return

    setIsDeleting(true)
    try {
      const profileId = localStorage.getItem('activeProfileId')
      const url = profileId
        ? `/api/challenges/${deleteModal.challenge.id}?profileId=${profileId}`
        : `/api/challenges/${deleteModal.challenge.id}`

      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        // Remove from local state
        setChallenges(prev => prev.filter(c => c.id !== deleteModal.challenge?.id))
        setDeleteModal({ isOpen: false, challenge: null })
      } else {
        console.error('Failed to delete challenge:', data.error)
      }
    } catch (error) {
      console.error('Failed to delete challenge:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      case 'completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />
      case 'paused':
        return <Pause className="w-3 h-3" />
      case 'completed':
        return <CheckCircle className="w-3 h-3" />
      case 'failed':
        return <XCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const filteredChallenges = filter === 'all'
    ? challenges
    : challenges.filter(c => c.status === filter)

  // Stats calculations
  const activeCount = challenges.filter(c => c.status === 'active').length
  const completedCount = challenges.filter(c => c.status === 'completed').length
  const totalStreak = challenges.reduce((sum, c) => sum + (c.streak?.current || 0), 0)
  const bestStreak = Math.max(...challenges.map(c => c.streak?.best || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading challenges...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-oa-border">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-oa-text-primary">
            Challenges
          </h1>
          <AnimatedButton
            variant="primary"
            onClick={() => router.push('/app')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Challenge
          </AnimatedButton>
        </div>
        <p className="text-sm text-oa-text-secondary">
          Manage all your challenges - active, completed, and templates
        </p>
      </div>

      {/* Stats Bar */}
      <div className="px-8 py-4 border-b border-oa-border bg-oa-bg-secondary/50">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-oa-text-primary">{activeCount}</div>
              <div className="text-xs text-oa-text-secondary">Active</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-oa-text-primary">{completedCount}</div>
              <div className="text-xs text-oa-text-secondary">Completed</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-oa-text-primary">{totalStreak}</div>
              <div className="text-xs text-oa-text-secondary">Total Days</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-oa-text-primary">{bestStreak}</div>
              <div className="text-xs text-oa-text-secondary">Best Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'paused', 'completed', 'failed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-oa-accent text-white'
                  : 'bg-oa-bg-secondary text-oa-text-secondary hover:text-oa-text-primary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className="ml-2 text-xs opacity-75">
                  ({challenges.filter(c => c.status === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        {filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredChallenges.map((challenge) => {
              const daysSinceStart = Math.ceil(
                (new Date().getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24)
              )
              const totalDays = challenge.totalDays || 30
              const currentDay = Math.min(Math.max(1, daysSinceStart), totalDays)
              const isCompleted = daysSinceStart > totalDays

              return (
                <motion.div
                  key={challenge.id}
                  className="bg-oa-bg-secondary border border-oa-border rounded-lg p-5 cursor-pointer hover:border-oa-accent group transition-all"
                  onClick={() => router.push(`/streak/${challenge.id}`)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(challenge.status)}`}>
                        {getStatusIcon(challenge.status)}
                        {challenge.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-semibold">{challenge.streak?.current || 0}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(e, challenge)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-oa-text-secondary hover:text-red-400 transition-all"
                        title="Delete challenge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-oa-text-primary mb-2 group-hover:text-oa-accent transition-colors">
                    {challenge.name}
                  </h3>

                  {/* Goal */}
                  <p className="text-sm text-oa-text-secondary mb-4 line-clamp-2">
                    {challenge.goal}
                  </p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-oa-text-secondary">
                        {isCompleted ? 'Completed' : `Day ${currentDay}/${totalDays}`}
                      </span>
                      <span className="text-xs font-medium text-oa-accent">
                        {challenge.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-oa-bg-tertiary rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-oa-accent to-blue-400 h-full rounded-full transition-all"
                        style={{ width: `${challenge.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-oa-text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(challenge.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-500" />
                      <span>Best: {challenge.streak?.best || 0}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 mb-8">
            <Target className="w-12 h-12 text-oa-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-oa-text-secondary">
              {filter === 'all'
                ? 'No challenges yet. Create your first challenge!'
                : `No ${filter} challenges found.`}
            </p>
          </div>
        )}

        {/* Challenge Templates */}
        <div className="border-t border-oa-border pt-6">
          <h2 className="text-lg font-semibold text-oa-text-primary mb-4">
            Quick Start Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHALLENGE_TEMPLATES.map((template) => (
              <motion.div
                key={template.id}
                className="bg-oa-bg-secondary/50 border border-oa-border rounded-lg p-4 cursor-pointer hover:border-oa-accent hover:bg-oa-bg-secondary transition-all group"
                onClick={() => router.push('/app')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-3xl mb-3">{template.icon}</div>
                <h3 className="text-sm font-semibold text-oa-text-primary mb-1 group-hover:text-oa-accent">
                  {template.name}
                </h3>
                <p className="text-xs text-oa-text-secondary mb-2 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-oa-text-secondary">
                  <Clock className="w-3 h-3" />
                  <span>{template.duration} days</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.challenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-md overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="p-6 border-b border-oa-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-oa-text-primary">
                    Delete Challenge
                  </h2>
                </div>
                <button
                  onClick={() => setDeleteModal({ isOpen: false, challenge: null })}
                  className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-oa-text-secondary" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-oa-text-primary mb-2">
                Are you sure you want to delete <span className="font-semibold">"{deleteModal.challenge.name}"</span>?
              </p>
              <p className="text-sm text-oa-text-secondary mb-4">
                This action cannot be undone. The following will be permanently deleted:
              </p>
              <ul className="text-sm text-oa-text-secondary space-y-1 mb-6 list-disc list-inside">
                <li>All challenge data and progress</li>
                <li>Related todos and tasks</li>
                <li>Calendar events and schedules</li>
                <li>Check-in history</li>
              </ul>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, challenge: null })}
                  className="px-4 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Challenge
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

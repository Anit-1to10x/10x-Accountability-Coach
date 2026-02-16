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
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'
import { useChallengeStore } from '@/lib/store'
import { formatDateSafe, getCurrentDay } from '@/lib/datetime'
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

// formatDateSafe and getCurrentDay imported from @/lib/datetime

export default function ChallengesPage() {
  const router = useRouter()
  const profileId = useProfileId()
  const { challenges: storeChallenges, loadChallenges: storeLoadChallenges } = useChallengeStore()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'paused' | 'completed' | 'failed'>('all')
  const hasLoaded = React.useRef(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; challenge: Challenge | null }>({
    isOpen: false,
    challenge: null
  })
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; challenge: Challenge | null }>({
    isOpen: false,
    challenge: null
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadChallenges = async () => {
    try {
      let url = addProfileId('/api/challenges', profileId)
      url += (url.includes('?') ? '&' : '?') + 'activeOnly=false'
      const res = await fetch(url)
      const data = await res.json()
      setChallenges(data.challenges || [])
    } catch (error) {
      console.error('Failed to load challenges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      loadChallenges()
    }
  }, [])

  // Sync from Zustand store when it updates (e.g. from file-sync SSE)
  useEffect(() => {
    if (storeChallenges && storeChallenges.length > 0) {
      setChallenges(storeChallenges)
      setIsLoading(false)
    }
  }, [storeChallenges])

  // Re-fetch when files change via CLI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.category === 'challenge') {
        loadChallenges()
      }
    }
    window.addEventListener('file-sync', handler)
    return () => window.removeEventListener('file-sync', handler)
  }, [])

  const handleChallengeClick = (challenge: Challenge) => {
    setDetailModal({ isOpen: true, challenge })
  }

  const handleDeleteClick = (e: React.MouseEvent, challenge: Challenge) => {
    e.stopPropagation() // Prevent navigation to challenge detail
    setDeleteModal({ isOpen: true, challenge })
  }

  const handleUpdateStatus = async (challengeId: string, newStatus: 'active' | 'paused' | 'completed' | 'upcoming') => {
    setIsUpdating(true)
    try {
      const pid = localStorage.getItem('activeProfileId')
      // Use the status API which handles date resolution on activation
      const url = pid
        ? `/api/challenges/${challengeId}/status?profileId=${pid}`
        : `/api/challenges/${challengeId}/status`

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, profileId: pid })
      })
      const data = await res.json()

      if (data.success) {
        // Reload challenges to get updated dates from server
        await loadChallenges()
        // Update modal state if open
        if (detailModal.challenge?.id === challengeId) {
          setDetailModal(prev => ({
            ...prev,
            challenge: prev.challenge ? { ...prev.challenge, status: newStatus } : null
          }))
        }
      } else {
        console.error('Failed to update challenge:', data.error)
      }
    } catch (error) {
      console.error('Failed to update challenge:', error)
    } finally {
      setIsUpdating(false)
    }
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
      case 'upcoming':
      case 'pending':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      case 'coming_soon':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
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
      case 'upcoming':
      case 'pending':
        return <Clock className="w-3 h-3" />
      case 'coming_soon':
        return <Clock className="w-3 h-3" />
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
          {(['all', 'active', 'upcoming', 'paused', 'completed', 'failed'] as const).map((tab) => (
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
              const totalDays = challenge.totalDays || 30
              const { currentDay, isCompleted } = getCurrentDay(challenge.startDate, totalDays)
              const isUpcoming = challenge.status === 'upcoming' || challenge.status === 'pending'

              return (
                <motion.div
                  key={challenge.id}
                  className="bg-oa-bg-secondary border border-oa-border rounded-lg p-5 cursor-pointer hover:border-oa-accent group transition-all"
                  onClick={() => handleChallengeClick(challenge)}
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

                  {/* Progress or Start Button */}
                  {isUpcoming ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateStatus(challenge.id, 'active')
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-oa-accent/10 text-oa-accent border border-oa-accent/30 rounded-lg hover:bg-oa-accent/20 transition-colors text-sm font-medium mb-3"
                    >
                      <Play className="w-4 h-4" />
                      Start Challenge from Today
                    </button>
                  ) : (
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
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-oa-text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateSafe(challenge.startDate)}</span>
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

      {/* Challenge Detail Modal */}
      {detailModal.isOpen && detailModal.challenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            className="bg-oa-bg-primary border border-oa-border rounded-xl w-full max-w-lg overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="p-6 border-b border-oa-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    detailModal.challenge.status === 'active' ? 'bg-green-500/10' :
                    detailModal.challenge.status === 'paused' ? 'bg-yellow-500/10' :
                    detailModal.challenge.status === 'completed' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                  }`}>
                    <Target className={`w-6 h-6 ${
                      detailModal.challenge.status === 'active' ? 'text-green-400' :
                      detailModal.challenge.status === 'paused' ? 'text-yellow-400' :
                      detailModal.challenge.status === 'completed' ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-oa-text-primary">
                      {detailModal.challenge.name}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(detailModal.challenge.status)}`}>
                      {detailModal.challenge.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModal({ isOpen: false, challenge: null })}
                  className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-oa-text-secondary" />
                </button>
              </div>
            </div>

            {/* Challenge Stats */}
            <div className="p-6 border-b border-oa-border">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-oa-bg-secondary rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                    <Flame className="w-5 h-5" />
                    <span className="text-xl font-bold">{detailModal.challenge.streak?.current || 0}</span>
                  </div>
                  <div className="text-xs text-oa-text-secondary">Current Streak</div>
                </div>
                <div className="text-center p-3 bg-oa-bg-secondary rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                    <Trophy className="w-5 h-5" />
                    <span className="text-xl font-bold">{detailModal.challenge.streak?.best || 0}</span>
                  </div>
                  <div className="text-xs text-oa-text-secondary">Best Streak</div>
                </div>
                <div className="text-center p-3 bg-oa-bg-secondary rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xl font-bold">{detailModal.challenge.progress || 0}%</span>
                  </div>
                  <div className="text-xs text-oa-text-secondary">Progress</div>
                </div>
              </div>
            </div>

            {/* Goal & Details */}
            <div className="p-6 border-b border-oa-border">
              <h3 className="text-sm font-semibold text-oa-text-primary mb-2">Goal</h3>
              <p className="text-sm text-oa-text-secondary mb-4">
                {detailModal.challenge.goal || 'No goal set'}
              </p>

              <div className="flex items-center gap-4 text-sm text-oa-text-secondary">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Start: {formatDateSafe(detailModal.challenge.startDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{detailModal.challenge.totalDays || 30} days total</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-oa-text-primary mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {detailModal.challenge.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(detailModal.challenge!.id, 'paused')}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                    >
                      <Pause className="w-4 h-4" />
                      Pause Challenge
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(detailModal.challenge!.id, 'completed')}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </button>
                  </>
                )}
                {detailModal.challenge.status === 'paused' && (
                  <button
                    onClick={() => handleUpdateStatus(detailModal.challenge!.id, 'active')}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    Resume Challenge
                  </button>
                )}
                {(detailModal.challenge.status === 'upcoming' || detailModal.challenge.status === 'pending') && (
                  <button
                    onClick={() => handleUpdateStatus(detailModal.challenge!.id, 'active')}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent/80 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    Start Challenge from Today
                  </button>
                )}
                {(detailModal.challenge.status === 'completed' || detailModal.challenge.status === 'failed') && (
                  <button
                    onClick={() => handleUpdateStatus(detailModal.challenge!.id, 'active')}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    Restart Challenge
                  </button>
                )}
                <button
                  onClick={() => router.push(`/streak/${detailModal.challenge!.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-oa-accent/10 text-oa-accent border border-oa-accent/30 rounded-lg hover:bg-oa-accent/20 transition-colors"
                >
                  <Flame className="w-4 h-4" />
                  View Streak Details
                </button>
                <button
                  onClick={(e) => {
                    handleDeleteClick(e, detailModal.challenge!)
                    setDetailModal({ isOpen: false, challenge: null })
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>

              {isUpdating && (
                <div className="mt-3 flex items-center gap-2 text-sm text-oa-text-secondary">
                  <div className="w-4 h-4 border-2 border-oa-accent/30 border-t-oa-accent rounded-full animate-spin" />
                  Updating...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

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

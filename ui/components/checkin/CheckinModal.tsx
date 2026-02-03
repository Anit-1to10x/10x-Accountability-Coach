'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Button } from '@/components/ui'
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Trophy,
  X,
  ChevronRight,
  Sparkles,
  Target
} from 'lucide-react'

interface Task {
  id: string
  title: string
  text?: string
  challengeId: string
  challengeName: string
  day: number
  dayTitle?: string
  duration: number
  priority: string
  completed: boolean
  status: string
}

interface CheckinModalProps {
  isOpen: boolean
  onClose: () => void
  challenge?: any
  todayTask?: any
}

const MOODS = [
  { emoji: '🔥', label: 'On Fire', value: 5, color: 'text-orange-500' },
  { emoji: '✅', label: 'Great', value: 4, color: 'text-green-500' },
  { emoji: '😊', label: 'Good', value: 3, color: 'text-blue-500' },
  { emoji: '😐', label: 'Okay', value: 2, color: 'text-yellow-500' },
  { emoji: '😓', label: 'Struggling', value: 1, color: 'text-red-500' },
]

export function CheckinModal({ isOpen, onClose, challenge }: CheckinModalProps) {
  const profileId = useProfileId()
  const [step, setStep] = useState(1)
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [mood, setMood] = useState<number | null>(null)
  const [wins, setWins] = useState('')
  const [blockers, setBlockers] = useState('')
  const [tomorrowCommitment, setTomorrowCommitment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [checkinResult, setCheckinResult] = useState<any>(null)

  // Load today's tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTodaysTasks()
      // Reset state
      setStep(1)
      setSelectedTasks(new Set())
      setMood(null)
      setWins('')
      setBlockers('')
      setTomorrowCommitment('')
      setCheckinResult(null)
    }
  }, [isOpen])

  const loadTodaysTasks = async () => {
    setLoading(true)
    try {
      // Load all challenge tasks
      const tasksUrl = addProfileId('/api/todos/from-challenges', profileId)
      const res = await fetch(tasksUrl)
      const data = await res.json()
      const allTasks = data.tasks || []

      // Load challenges to get start dates
      const challengesUrl = addProfileId('/api/challenges', profileId)
      const challengesRes = await fetch(challengesUrl)
      const challengesData = await challengesRes.json()
      const challenges = challengesData.challenges || []

      // Filter tasks for today based on challenge start date
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todaysTasks = allTasks.filter((task: Task) => {
        const challengeInfo = challenges.find((c: any) => c.id === task.challengeId)
        if (!challengeInfo) return false

        const startDate = challengeInfo.startDate || challengeInfo.start_date
        if (!startDate) return false

        const baseDate = new Date(startDate)
        baseDate.setHours(0, 0, 0, 0)

        const taskDate = new Date(baseDate)
        taskDate.setDate(taskDate.getDate() + (task.day - 1))

        return taskDate.getTime() === today.getTime()
      })

      setTasks(todaysTasks)

      // Pre-select already completed tasks
      const completedIds = new Set<string>(
        todaysTasks.filter((t: Task) => t.completed).map((t: Task) => t.id)
      )
      setSelectedTasks(completedIds)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedTasks(new Set(tasks.map(t => t.id)))
  }

  const deselectAll = () => {
    setSelectedTasks(new Set())
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Prepare check-in data
      const checkinData = {
        challengeId: challenge?.id || tasks[0]?.challengeId,
        completedTaskIds: Array.from(selectedTasks),
        mood,
        wins,
        blockers,
        tomorrowCommitment,
        timestamp: new Date().toISOString(),
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          challengeId: t.challengeId,
          day: t.day,
          completed: selectedTasks.has(t.id)
        }))
      }

      const checkinUrl = addProfileId('/api/checkin/complete', profileId)
      const res = await fetch(checkinUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getProfileHeaders(profileId) },
        body: JSON.stringify({ ...checkinData, profileId }),
      })

      const result = await res.json()

      if (result.success) {
        setCheckinResult(result)
        setStep(5) // Show success screen
      } else {
        throw new Error(result.error || 'Check-in failed')
      }
    } catch (error) {
      console.error('Check-in failed:', error)
      alert('Check-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const completedCount = selectedTasks.size
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-2xl w-full bg-oa-bg-secondary border border-oa-border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-oa-border bg-oa-bg-tertiary/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-oa-accent/10 rounded-lg">
                <Target className="w-5 h-5 text-oa-accent" />
              </div>
              <div>
                <h2 className="font-semibold text-oa-text-primary">Daily Check-in</h2>
                <p className="text-xs text-oa-text-secondary">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-oa-bg-tertiary rounded-lg transition-colors">
              <X className="w-5 h-5 text-oa-text-secondary" />
            </button>
          </div>

          {/* Progress Bar */}
          {step < 5 && (
            <div className="px-4 pt-4">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      s <= step ? 'bg-oa-accent' : 'bg-oa-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-oa-text-secondary text-center">
                Step {step} of 4
              </p>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Task Selection */}
            {step === 1 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-oa-text-primary mb-1">
                      What did you complete today?
                    </h3>
                    <p className="text-sm text-oa-text-secondary">
                      Select all tasks you've finished
                    </p>
                  </div>
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAll}
                        className="text-xs text-oa-accent hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-oa-text-secondary">|</span>
                      <button
                        onClick={deselectAll}
                        className="text-xs text-oa-text-secondary hover:text-oa-text-primary"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress summary */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-oa-bg-tertiary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      <span className="font-medium text-oa-text-primary">{completedCount}</span>
                      <span className="text-oa-text-secondary">/{totalCount} tasks</span>
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-oa-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-oa-text-primary">{progressPercent}%</span>
                </div>

                {/* Task List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {loading ? (
                    <div className="text-center py-8 text-oa-text-secondary">
                      Loading tasks...
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-8 text-oa-text-secondary">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No tasks scheduled for today</p>
                    </div>
                  ) : (
                    tasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleTask(task.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTasks.has(task.id)
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-oa-bg-primary border-oa-border hover:border-oa-accent/30'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {selectedTasks.has(task.id) ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-oa-text-secondary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${
                            selectedTasks.has(task.id)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-oa-text-primary'
                          }`}>
                            {task.title}
                          </div>
                          <div className="text-xs text-oa-text-secondary mt-0.5">
                            {task.challengeName} • Day {task.day}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs px-2 py-1 rounded bg-oa-bg-tertiary text-oa-text-secondary">
                            {task.duration}m
                          </span>
                          <span className={`text-xs px-2 py-1 rounded border ${
                            task.priority === 'high'
                              ? 'border-red-500/30 text-red-500 bg-red-500/5'
                              : task.priority === 'medium'
                              ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'
                              : 'border-green-500/30 text-green-500 bg-green-500/5'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full mt-4"
                  disabled={tasks.length === 0}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Mood Selection */}
            {step === 2 && (
              <div>
                <h3 className="text-lg font-semibold text-oa-text-primary mb-2">
                  How are you feeling?
                </h3>
                <p className="text-sm text-oa-text-secondary mb-6">
                  Rate your energy and motivation today
                </p>

                <div className="grid grid-cols-5 gap-3 mb-6">
                  {MOODS.map((m) => (
                    <motion.button
                      key={m.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMood(m.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        mood === m.value
                          ? 'border-oa-accent bg-oa-accent/10 shadow-lg'
                          : 'border-oa-border hover:border-oa-text-secondary bg-oa-bg-primary'
                      }`}
                    >
                      <div className="text-3xl mb-2">{m.emoji}</div>
                      <div className={`text-xs font-medium ${m.color}`}>{m.label}</div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={mood === null} className="flex-1">
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Wins & Blockers */}
            {step === 3 && (
              <div>
                <h3 className="text-lg font-semibold text-oa-text-primary mb-6">
                  Quick Reflection
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Wins (what went well?)
                    </label>
                    <textarea
                      value={wins}
                      onChange={(e) => setWins(e.target.value)}
                      placeholder="Celebrate your achievements..."
                      className="w-full px-4 py-3 border border-oa-border bg-oa-bg-primary text-oa-text-primary rounded-lg resize-none focus:outline-none focus:border-oa-accent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Target className="w-4 h-4 text-red-500" />
                      Blockers (what held you back?)
                    </label>
                    <textarea
                      value={blockers}
                      onChange={(e) => setBlockers(e.target.value)}
                      placeholder="Any challenges or obstacles..."
                      className="w-full px-4 py-3 border border-oa-border bg-oa-bg-primary text-oa-text-primary rounded-lg resize-none focus:outline-none focus:border-oa-accent"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Tomorrow's Commitment */}
            {step === 4 && (
              <div>
                <h3 className="text-lg font-semibold text-oa-text-primary mb-2">
                  Tomorrow's Commitment
                </h3>
                <p className="text-sm text-oa-text-secondary mb-6">
                  Set your intention for tomorrow
                </p>

                <textarea
                  value={tomorrowCommitment}
                  onChange={(e) => setTomorrowCommitment(e.target.value)}
                  placeholder="Tomorrow I will..."
                  className="w-full px-4 py-3 border border-oa-border bg-oa-bg-primary text-oa-text-primary rounded-lg resize-none focus:outline-none focus:border-oa-accent mb-6"
                  rows={4}
                />

                {/* Summary */}
                <div className="p-4 bg-oa-bg-tertiary/50 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-oa-text-primary mb-3">Check-in Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-oa-text-secondary">
                        {completedCount}/{totalCount} tasks
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MOODS.find(m => m.value === mood)?.emoji}</span>
                      <span className="text-oa-text-secondary">
                        {MOODS.find(m => m.value === mood)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Saving...' : 'Complete Check-in'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && checkinResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Trophy className="w-10 h-10 text-green-500" />
                </motion.div>

                <h3 className="text-2xl font-bold text-oa-text-primary mb-2">
                  Check-in Complete!
                </h3>
                <p className="text-oa-text-secondary mb-6">
                  Great job staying accountable
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-oa-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-green-500">
                      {checkinResult.tasksCompleted || completedCount}
                    </div>
                    <div className="text-xs text-oa-text-secondary">Tasks Done</div>
                  </div>
                  <div className="p-4 bg-oa-bg-tertiary rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
                      <Flame className="w-6 h-6" />
                      {checkinResult.streak || 1}
                    </div>
                    <div className="text-xs text-oa-text-secondary">Day Streak</div>
                  </div>
                  <div className="p-4 bg-oa-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-oa-accent">
                      {checkinResult.progress || progressPercent}%
                    </div>
                    <div className="text-xs text-oa-text-secondary">Progress</div>
                  </div>
                </div>

                {checkinResult.streakMessage && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-6">
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {checkinResult.streakMessage}
                    </p>
                  </div>
                )}

                <Button onClick={onClose} className="w-full">
                  Done
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

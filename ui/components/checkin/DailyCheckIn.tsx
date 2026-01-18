'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Circle, Clock, Calendar, TrendingUp } from 'lucide-react'
import { AnimatedButton } from '../ui/AnimatedButton'
import { addProfileId, useProfileId } from '@/lib/useProfileId'
import { LateCheckinDialog } from './LateCheckinDialog'

interface Todo {
  id: string
  title: string
  date: string
  time?: string
  challengeId?: string
  challengeName?: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
}

interface DailyCheckInProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
}

export function DailyCheckIn({ isOpen, onClose, agentId }: DailyCheckInProps) {
  const [step, setStep] = useState<'context' | 'tasks' | 'confirmation'>('context')
  const [contextAnswers, setContextAnswers] = useState({
    energy: '',
    focus: '',
    challenges: ''
  })
  const [availableTasks, setAvailableTasks] = useState<Todo[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showLateDialog, setShowLateDialog] = useState(false)
  const [lateCheckInHours, setLateCheckInHours] = useState(0)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const profileId = useProfileId()

  // Load incomplete tasks based on current time
  useEffect(() => {
    if (step === 'tasks') {
      loadRelevantTasks()
    }
  }, [step])

  const loadRelevantTasks = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const currentHour = now.getHours()
      const today = now.toISOString().split('T')[0]

      // Load challenges to map names to IDs
      const challengesUrl = addProfileId('/api/challenges', profileId)
      const challengesResponse = await fetch(challengesUrl)
      const challengesData = await challengesResponse.json()
      const challenges = challengesData.challenges || []

      // Create name -> ID mapping
      const challengeNameToId: Record<string, string> = {}
      challenges.forEach((c: any) => {
        challengeNameToId[c.name] = c.id
        // Also map partial names (e.g., "Getting Started Challenge" -> "getting-started")
        if (c.name.includes('Getting Started')) challengeNameToId['Getting Started Challenge'] = c.id
        if (c.name.includes('Agentic')) challengeNameToId['Agentic Analysis Skills Challenge'] = c.id
      })

      // Fetch all incomplete todos for today
      const url = addProfileId('/api/todos', profileId)
      const response = await fetch(url)
      const data = await response.json()

      // Filter tasks for today that are incomplete and map challenge names to IDs
      let todayTasks = (data || []).filter((todo: Todo) => {
        const taskDate = todo.date?.split('T')[0]
        return taskDate === today && !todo.completed
      }).map((todo: Todo) => {
        // Map challenge name to ID if present
        if (todo.challengeName && challengeNameToId[todo.challengeName]) {
          return {
            ...todo,
            challengeId: challengeNameToId[todo.challengeName]
          }
        }
        return todo
      })

      // Intelligent filtering based on time of day
      todayTasks = todayTasks.filter((task: Todo) => {
        if (!task.time) return true // Include tasks without specific time

        const taskHour = parseInt(task.time.split(':')[0])

        // Morning (5-12): Show morning and afternoon tasks
        if (currentHour >= 5 && currentHour < 12) {
          return taskHour >= 5 && taskHour < 17
        }
        // Afternoon (12-17): Show afternoon and evening tasks
        else if (currentHour >= 12 && currentHour < 17) {
          return taskHour >= 12 && taskHour < 21
        }
        // Evening (17-21): Show evening tasks
        else if (currentHour >= 17 && currentHour < 21) {
          return taskHour >= 17 && taskHour < 24
        }
        // Night (21+): Show any remaining tasks
        else {
          return true
        }
      })

      setAvailableTasks(todayTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContextSubmit = () => {
    if (contextAnswers.energy && contextAnswers.focus) {
      setStep('tasks')
    }
  }

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleCheckIn = async (aiAccepted: boolean = false) => {
    if (selectedTasks.size === 0) return

    setSubmitting(true)
    try {
      // First, validate the check-in
      const firstTask = availableTasks.find(t => selectedTasks.has(t.id))
      const challengeId = firstTask?.challengeId

      if (challengeId) {
        const validationResponse = await fetch('/api/checkin/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId, aiAccepted })
        })

        const validation = await validationResponse.json()

        // If already checked in today, show error and stop
        if (validation.alreadyCheckedIn) {
          setAlreadyCheckedIn(true)
          setSubmitting(false)
          setTimeout(() => {
            onClose()
            resetCheckIn()
          }, 3000)
          return
        }

        // If requires AI acceptance and not yet accepted, show dialog
        if (validation.requiresAIAcceptance && !aiAccepted) {
          setLateCheckInHours(validation.hoursLate || 0)
          setShowLateDialog(true)
          setSubmitting(false)
          return
        }

        // If not allowed for other reasons, show error
        if (!validation.allowed) {
          alert(validation.message)
          setSubmitting(false)
          return
        }
      }

      const checkInData = {
        date: new Date().toISOString(),
        agentId: agentId || 'unified',
        context: contextAnswers,
        completedTasks: Array.from(selectedTasks),
        tasksCount: selectedTasks.size
      }

      // Load challenges again to get start dates for day calculation
      const challengesUrl = addProfileId('/api/challenges', profileId)
      const challengesResponse = await fetch(challengesUrl)
      const challengesData = await challengesResponse.json()
      const challenges = challengesData.challenges || []

      // Create challenge ID -> start date mapping
      const challengeStartDates: Record<string, string> = {}
      challenges.forEach((c: any) => {
        challengeStartDates[c.id] = c.startDate || c.start_date
      })

      // Calculate current day for each challenge
      const today = new Date()
      const calculateDayNumber = (challengeId: string) => {
        const startDate = challengeStartDates[challengeId]
        if (!startDate) return 1

        const start = new Date(startDate)
        const diffTime = today.getTime() - start.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(1, diffDays + 1) // Day 1 = start date
      }

      // Prepare task information for challenge updates
      const taskInfos = availableTasks
        .filter(t => selectedTasks.has(t.id))
        .map(t => ({
          id: t.id,
          title: t.title,
          challengeId: t.challengeId || '',
          day: t.challengeId ? calculateDayNumber(t.challengeId) : 1,
          completed: true
        }))

      // Mark regular todos as completed (in active.md)
      const regularTodos = taskInfos.filter(t => !t.challengeId)
      if (regularTodos.length > 0) {
        const updatePromises = regularTodos.map(task =>
          fetch(`/api/todos/${task.id}?profileId=${profileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true })
          })
        )

        const results = await Promise.all(updatePromises)
        const failedResults = await Promise.all(results.map(r => r.json()))
        const immutableError = failedResults.find(r => r.immutable)

        if (immutableError) {
          alert(immutableError.error)
          setSubmitting(false)
          return
        }
      }

      // Get challenge IDs to update
      const challengeIds = [...new Set(taskInfos.filter(t => t.challengeId).map(t => t.challengeId))]

      // Call checkin/complete for each challenge to update streaks and challenge files
      if (challengeIds.length > 0) {
        for (const challengeId of challengeIds) {
          const challengeTasks = taskInfos.filter(t => t.challengeId === challengeId)

          await fetch('/api/checkin/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              challengeId,
              completedTaskIds: challengeTasks.map(t => t.id),
              tasks: challengeTasks,
              mood: contextAnswers.energy === 'high' ? 5 : contextAnswers.energy === 'medium' ? 3 : 2,
              wins: `Completed ${challengeTasks.length} tasks`,
              blockers: contextAnswers.challenges || '',
              tomorrowCommitment: 'Continue the streak',
              timestamp: new Date().toISOString(),
              aiAccepted
            })
          })
        }
      }

      // Save check-in log to file
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData)
      })

      setStep('confirmation')

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
        resetCheckIn()
      }, 2000)
    } catch (error) {
      console.error('Check-in failed:', error)
      alert('Failed to save check-in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLateCheckInAccept = () => {
    setShowLateDialog(false)
    handleCheckIn(true)
  }

  const handleLateCheckInCancel = () => {
    setShowLateDialog(false)
    setSubmitting(false)
  }

  const resetCheckIn = () => {
    setStep('context')
    setContextAnswers({ energy: '', focus: '', challenges: '' })
    setSelectedTasks(new Set())
    setAvailableTasks([])
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon'
    if (hour < 21) return 'Evening'
    return 'Night'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-oa-bg-primary border border-oa-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-oa-border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-oa-text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold text-oa-text-primary">
                      Daily Check-In
                    </h2>
                    <p className="text-sm text-oa-text-secondary mt-1">
                      {getTimeOfDay()} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Step 1: Context Questions */}
                {step === 'context' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <p className="text-sm text-oa-text-secondary mb-6">
                      Let me understand your current state before we review your tasks.
                    </p>

                    <div className="space-y-5">
                      {/* Energy Level */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          How's your energy level right now?
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Low', 'Medium', 'High'].map((level) => (
                            <button
                              key={level}
                              onClick={() => setContextAnswers({ ...contextAnswers, energy: level })}
                              className={`p-3 rounded-lg border transition-all ${
                                contextAnswers.energy === level
                                  ? 'border-oa-text-primary bg-oa-bg-secondary'
                                  : 'border-oa-border hover:border-oa-text-secondary'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Focus Level */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          How focused do you feel?
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Distracted', 'Okay', 'Laser-focused'].map((level) => (
                            <button
                              key={level}
                              onClick={() => setContextAnswers({ ...contextAnswers, focus: level })}
                              className={`p-3 rounded-lg border transition-all ${
                                contextAnswers.focus === level
                                  ? 'border-oa-text-primary bg-oa-bg-secondary'
                                  : 'border-oa-border hover:border-oa-text-secondary'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Current Challenges (Optional) */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Any challenges or blockers? (Optional)
                        </label>
                        <textarea
                          value={contextAnswers.challenges}
                          onChange={(e) => setContextAnswers({ ...contextAnswers, challenges: e.target.value })}
                          placeholder="e.g., Feeling overwhelmed, need to prioritize better..."
                          className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg focus:outline-none focus:border-oa-text-primary resize-none"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <AnimatedButton
                        onClick={handleContextSubmit}
                        disabled={!contextAnswers.energy || !contextAnswers.focus}
                        variant="primary"
                      >
                        Continue to Tasks
                      </AnimatedButton>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Task Selection */}
                {step === 'tasks' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <p className="text-sm text-oa-text-secondary mb-4">
                      Based on your {contextAnswers.energy.toLowerCase()} energy and it being {getTimeOfDay().toLowerCase()},
                      here are your relevant tasks:
                    </p>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-oa-text-primary border-t-transparent"></div>
                      </div>
                    ) : availableTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-oa-text-secondary">No pending tasks for now!</p>
                        <p className="text-sm text-oa-text-secondary mt-1">You're all caught up.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {availableTasks.map((task) => (
                            <motion.button
                              key={task.id}
                              onClick={() => toggleTask(task.id)}
                              whileHover={{ x: 4 }}
                              className={`w-full p-4 rounded-lg border transition-all text-left ${
                                selectedTasks.has(task.id)
                                  ? 'border-oa-text-primary bg-oa-bg-secondary'
                                  : 'border-oa-border hover:border-oa-text-secondary'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {selectedTasks.has(task.id) ? (
                                  <CheckCircle2 className="w-5 h-5 text-oa-text-primary flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-5 h-5 text-oa-text-secondary flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{task.title}</p>
                                  {task.time && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-oa-text-secondary">
                                      <Clock className="w-3 h-3" />
                                      <span>{task.time}</span>
                                    </div>
                                  )}
                                </div>
                                {task.priority && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    task.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                    task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                    'bg-gray-500/10 text-gray-500'
                                  }`}>
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                          <p className="text-sm text-oa-text-secondary">
                            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                          </p>
                          <div className="flex gap-3">
                            <AnimatedButton
                              onClick={() => setStep('context')}
                              variant="secondary"
                            >
                              Back
                            </AnimatedButton>
                            <AnimatedButton
                              onClick={handleCheckIn}
                              disabled={selectedTasks.size === 0 || submitting}
                              variant="primary"
                            >
                              {submitting ? 'Saving...' : 'Complete Check-In'}
                            </AnimatedButton>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Confirmation */}
                {step === 'confirmation' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Check-In Complete!</h3>
                    <p className="text-oa-text-secondary">
                      {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} marked as completed
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-oa-text-secondary">
                      <TrendingUp className="w-4 h-4" />
                      <span>Keep up the great work!</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Late Check-In Dialog */}
          {showLateDialog && (
            <LateCheckinDialog
              hoursLate={lateCheckInHours}
              onAccept={handleLateCheckInAccept}
              onCancel={handleLateCheckInCancel}
            />
          )}

          {/* Already Checked In Message */}
          {alreadyCheckedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center"
              >
                <CheckCircle2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-3">
                  Already Checked In
                </h2>
                <p className="text-gray-300">
                  You've already completed your check-in for today. Great job staying consistent!
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  Check-ins are limited to once per day
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

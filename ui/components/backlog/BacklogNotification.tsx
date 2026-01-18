'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, ChevronRight } from 'lucide-react'
import { BacklogDialog } from './BacklogDialog'

interface BacklogTask {
  id: string
  title: string
  day: number
  challengeId: string
  challengeName: string
  duration: number
}

interface BacklogNotificationProps {
  challengeId?: string
}

export function BacklogNotification({ challengeId }: BacklogNotificationProps) {
  const [backlogTasks, setBacklogTasks] = useState<BacklogTask[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkForBacklog()
  }, [challengeId])

  const checkForBacklog = async () => {
    try {
      // Fetch all challenge tasks
      const res = await fetch('/api/todos/from-challenges')
      const data = await res.json()
      const allTasks = data.tasks || []

      // Get today's date and yesterday's date
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Fetch challenges to get start dates
      const challengesRes = await fetch('/api/challenges')
      const challengesData = await challengesRes.json()
      const challenges = challengesData.challenges || []

      // Find tasks from previous days that are not completed
      const incompleteTasks = allTasks.filter((task: any) => {
        if (task.completed) return false

        // Calculate task's scheduled date
        const challenge = challenges.find((c: any) => c.id === task.challengeId)
        const startDate = challenge?.startDate || challenge?.start_date
        if (!startDate) return false

        const baseDate = new Date(startDate)
        baseDate.setHours(0, 0, 0, 0)

        const taskDate = new Date(baseDate)
        taskDate.setDate(taskDate.getDate() + (task.day - 1))

        // Check if task date is before today (backlog)
        return taskDate < today
      })

      if (incompleteTasks.length > 0 && !dismissed) {
        setBacklogTasks(incompleteTasks)
        setShowNotification(true)
      } else {
        setShowNotification(false)
      }
    } catch (error) {
      console.error('Failed to check backlog:', error)
    }
  }

  const handleDismiss = () => {
    setShowNotification(false)
    setDismissed(true)
    // Store dismissal in session storage so it doesn't show again this session
    sessionStorage.setItem('backlogDismissed', 'true')
  }

  const handleAdjustTomorrow = async (tasks: BacklogTask[]) => {
    try {
      const res = await fetch('/api/challenges/adjust-backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_tomorrow',
          tasks,
        }),
      })

      if (!res.ok) throw new Error('Failed to adjust')

      // Refresh the page to show updated schedule
      window.location.reload()
    } catch (error) {
      console.error('Failed to adjust tomorrow:', error)
      throw error
    }
  }

  const handleChangePlan = async (tasks: BacklogTask[]) => {
    try {
      const res = await fetch('/api/challenges/adjust-backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_plan',
          tasks,
        }),
      })

      if (!res.ok) throw new Error('Failed to regenerate plan')

      // Refresh the page to show updated schedule
      window.location.reload()
    } catch (error) {
      console.error('Failed to change plan:', error)
      throw error
    }
  }

  // Check session storage on mount
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('backlogDismissed')
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  if (!showNotification || dismissed) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-3 mb-4"
        >
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => setShowDialog(true)}
            >
              <div className="p-1.5 bg-orange-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-oa-text-primary">
                  You have {backlogTasks.length} incomplete task{backlogTasks.length > 1 ? 's' : ''} from previous days
                </p>
                <p className="text-xs text-oa-text-secondary">
                  Click to manage your backlog and adjust your plan
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDismiss()
              }}
              className="p-1.5 hover:bg-oa-bg-tertiary rounded-lg transition-colors ml-2"
            >
              <X className="w-4 h-4 text-oa-text-secondary" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <BacklogDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        backlogTasks={backlogTasks}
        onAdjustTomorrow={handleAdjustTomorrow}
        onChangePlan={handleChangePlan}
      />
    </>
  )
}

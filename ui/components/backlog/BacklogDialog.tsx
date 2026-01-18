'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, RefreshCw, Clock, AlertTriangle, Lightbulb } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface BacklogTask {
  id: string
  title: string
  day: number
  challengeId: string
  challengeName: string
  duration: number
}

interface BacklogDialogProps {
  isOpen: boolean
  onClose: () => void
  backlogTasks: BacklogTask[]
  onAdjustTomorrow: (tasks: BacklogTask[]) => Promise<void>
  onChangePlan: (tasks: BacklogTask[]) => Promise<void>
}

export function BacklogDialog({
  isOpen,
  onClose,
  backlogTasks,
  onAdjustTomorrow,
  onChangePlan,
}: BacklogDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'adjust' | 'change' | null>(null)

  const totalBacklogMinutes = backlogTasks.reduce((sum, t) => sum + (t.duration || 10), 0)
  const totalBacklogHours = (totalBacklogMinutes / 60).toFixed(1)

  const handleAdjustTomorrow = async () => {
    setIsProcessing(true)
    setSelectedAction('adjust')
    try {
      await onAdjustTomorrow(backlogTasks)
      onClose()
    } catch (error) {
      console.error('Failed to adjust tomorrow:', error)
    } finally {
      setIsProcessing(false)
      setSelectedAction(null)
    }
  }

  const handleChangePlan = async () => {
    setIsProcessing(true)
    setSelectedAction('change')
    try {
      await onChangePlan(backlogTasks)
      onClose()
    } catch (error) {
      console.error('Failed to change plan:', error)
    } finally {
      setIsProcessing(false)
      setSelectedAction(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-oa-bg-secondary border border-oa-border rounded-xl max-w-lg w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-oa-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-oa-text-primary">
                  Backlog Detected
                </h2>
                <p className="text-sm text-oa-text-secondary">
                  {backlogTasks.length} task{backlogTasks.length > 1 ? 's' : ''} from yesterday
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-oa-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-oa-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Backlog Summary */}
            <div className="bg-oa-bg-tertiary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-oa-text-secondary" />
                <span className="text-sm font-medium text-oa-text-primary">
                  Incomplete Tasks ({totalBacklogHours} hours)
                </span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {backlogTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-oa-text-secondary truncate flex-1">
                      {task.title}
                    </span>
                    <span className="text-oa-text-secondary ml-2">
                      {task.duration || 10}m
                    </span>
                  </div>
                ))}
                {backlogTasks.length > 5 && (
                  <div className="text-xs text-oa-text-secondary">
                    +{backlogTasks.length - 5} more tasks
                  </div>
                )}
              </div>
            </div>

            {/* Action Options */}
            <div className="space-y-3">
              {/* Option 1: Adjust Tomorrow */}
              <Card
                className={`p-4 cursor-pointer transition-all hover:border-oa-accent/50 ${
                  selectedAction === 'adjust' ? 'border-oa-accent bg-oa-accent/5' : ''
                }`}
                onClick={() => !isProcessing && handleAdjustTomorrow()}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-oa-text-primary mb-1">
                      Adjust for Tomorrow
                    </h3>
                    <p className="text-sm text-oa-text-secondary mb-3">
                      Move leftover tasks to tomorrow's schedule. Tomorrow will include
                      both the backlog and originally planned tasks.
                    </p>
                    <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        <strong>Tip:</strong> You may need to allocate more time tomorrow.
                        Consider extending your available hours or starting earlier.
                      </p>
                    </div>
                  </div>
                </div>
                {isProcessing && selectedAction === 'adjust' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-oa-accent">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adjusting tomorrow's schedule...
                  </div>
                )}
              </Card>

              {/* Option 2: Change All Plan */}
              <Card
                className={`p-4 cursor-pointer transition-all hover:border-oa-accent/50 ${
                  selectedAction === 'change' ? 'border-oa-accent bg-oa-accent/5' : ''
                }`}
                onClick={() => !isProcessing && handleChangePlan()}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-oa-text-primary mb-1">
                      Regenerate Entire Plan
                    </h3>
                    <p className="text-sm text-oa-text-secondary mb-3">
                      Analyze your progress from completed days and create a new
                      optimized plan for remaining tasks. Keeps completed work intact.
                    </p>
                    <div className="flex items-start gap-2 p-2 bg-purple-500/10 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        <strong>Smart:</strong> Uses your completion patterns to create
                        a more realistic pace for the remaining challenge.
                      </p>
                    </div>
                  </div>
                </div>
                {isProcessing && selectedAction === 'change' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-oa-accent">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing progress and regenerating plan...
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-oa-border bg-oa-bg-tertiary/30 rounded-b-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-oa-text-secondary">
                You can also manually adjust tasks in the Schedule view
              </p>
              <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

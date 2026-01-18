'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, FolderPlus, FileText, Zap, Sparkles } from 'lucide-react'

interface SetupStep {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'in-progress' | 'completed' | 'error'
}

interface AgentSetupWizardProps {
  isOpen: boolean
  agentName: string
  onComplete: () => void
}

export function AgentSetupWizard({ isOpen, agentName, onComplete }: AgentSetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'folder',
      label: 'Creating Agent Folder',
      description: 'Setting up directory structure...',
      icon: <FolderPlus className="w-5 h-5" />,
      status: 'pending',
    },
    {
      id: 'structure',
      label: 'Creating File Structure',
      description: 'Initializing configuration files...',
      icon: <FileText className="w-5 h-5" />,
      status: 'pending',
    },
    {
      id: 'skills',
      label: 'Adding Skills',
      description: 'Attaching selected skills to agent...',
      icon: <Zap className="w-5 h-5" />,
      status: 'pending',
    },
    {
      id: 'prompts',
      label: 'Setting Up Prompts',
      description: 'Configuring default prompts...',
      icon: <Sparkles className="w-5 h-5" />,
      status: 'pending',
    },
    {
      id: 'finalize',
      label: 'Finalizing Setup',
      description: 'Completing agent initialization...',
      icon: <Check className="w-5 h-5" />,
      status: 'pending',
    },
  ])

  useEffect(() => {
    if (!isOpen) return

    // Simulate setup process
    const setupProcess = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i)

        // Mark current step as in-progress
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === i ? 'in-progress' : idx < i ? 'completed' : 'pending'
        })))

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

        // Mark current step as completed
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx <= i ? 'completed' : 'pending'
        })))
      }

      // Wait a moment before completing
      await new Promise(resolve => setTimeout(resolve, 500))
      onComplete()
    }

    setupProcess()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-2xl shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-oa-border">
          <h2 className="text-2xl font-semibold text-oa-text-primary mb-2">
            Creating {agentName}
          </h2>
          <p className="text-sm text-oa-text-secondary">
            Setting up your new agent. This will only take a moment...
          </p>
        </div>

        {/* Progress Steps */}
        <div className="p-6 space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = step.status === 'completed'
            const isInProgress = step.status === 'in-progress'

            return (
              <motion.div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  isActive
                    ? 'border-oa-accent bg-oa-accent/5'
                    : isCompleted
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-oa-border bg-oa-bg-secondary'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isInProgress
                      ? 'bg-oa-accent text-white'
                      : 'bg-oa-bg-tertiary text-oa-text-secondary'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : isInProgress ? (
                      <motion.div
                        key="loader"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div key="icon">{step.icon}</motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-semibold mb-1 ${
                      isActive || isCompleted ? 'text-oa-text-primary' : 'text-oa-text-secondary'
                    }`}
                  >
                    {step.label}
                  </h3>
                  <p className="text-xs text-oa-text-secondary">{step.description}</p>

                  {/* Progress bar for active step */}
                  {isInProgress && (
                    <div className="mt-2 h-1 bg-oa-bg-tertiary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-oa-accent"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                      />
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {isCompleted && (
                  <motion.div
                    className="flex-shrink-0 text-green-500 text-xs font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    Done
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Footer with overall progress */}
        <div className="p-6 border-t border-oa-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-oa-text-primary">Overall Progress</span>
            <span className="text-sm text-oa-text-secondary">
              {steps.filter(s => s.status === 'completed').length} / {steps.length}
            </span>
          </div>
          <div className="h-2 bg-oa-bg-tertiary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-oa-accent to-green-500"
              initial={{ width: '0%' }}
              animate={{
                width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

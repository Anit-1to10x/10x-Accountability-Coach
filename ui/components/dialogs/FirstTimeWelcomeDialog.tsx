'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  X,
  Sparkles,
  Target,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Zap,
  Calendar,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'

interface FirstTimeWelcomeDialogProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  onComplete: () => void
}

/**
 * First-Time User Welcome Dialog
 *
 * Shows only ONCE for new users when they create their profile.
 * Guides them through the system with links to:
 * - Settings (to read system info)
 * - Create first challenge
 * - Understand the app features
 *
 * Once dismissed, it never shows again for this user.
 */
export function FirstTimeWelcomeDialog({
  isOpen,
  onClose,
  userName,
  onComplete,
}: FirstTimeWelcomeDialogProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      id: 'welcome',
      title: `Welcome to 10X Accountability Coach, ${userName}!`,
      description: "I'm your personal accountability partner. Let me show you around so you can get the most out of your journey.",
      icon: <Sparkles className="w-12 h-12 text-oa-accent" />,
    },
    {
      id: 'features',
      title: 'What You Can Do Here',
      description: 'Track challenges, build streaks, manage tasks, and get personalized coaching to achieve your goals.',
      icon: <Target className="w-12 h-12 text-blue-400" />,
      features: [
        { icon: <Target className="w-5 h-5" />, text: 'Create accountability challenges' },
        { icon: <Zap className="w-5 h-5" />, text: 'Build daily streaks' },
        { icon: <Calendar className="w-5 h-5" />, text: 'Plan your schedule' },
        { icon: <MessageSquare className="w-5 h-5" />, text: 'Chat with your AI coach' },
      ],
    },
    {
      id: 'help',
      title: 'Learn How It Works',
      description: 'First, let\'s help you understand the system. Visit the Help page to learn about all features, slash commands, and how to get the most out of your coach.',
      icon: <BookOpen className="w-12 h-12 text-amber-400" />,
      action: {
        label: 'Go to Help Guide',
        onClick: () => {
          onComplete()
          router.push('/help')
        },
      },
    },
    {
      id: 'ready',
      title: "You're All Set!",
      description: 'Your journey to 10X productivity starts now. Create your first challenge or explore the app at your own pace.',
      icon: <CheckCircle className="w-12 h-12 text-green-400" />,
      actions: [
        {
          label: 'Create First Challenge',
          primary: true,
          onClick: () => {
            onComplete()
            router.push('/app?onboarding=true')
          },
        },
        {
          label: 'Explore on My Own',
          primary: false,
          onClick: () => {
            onComplete()
            onClose()
          },
        },
      ],
    },
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
      onClose()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-oa-bg-primary border border-oa-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-oa-border">
            <motion.div
              className="h-full bg-oa-accent"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Skip & Close button */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => {
                onComplete()
                onClose()
              }}
              className="px-3 py-1.5 text-xs text-oa-text-secondary hover:text-oa-text-primary transition-colors rounded-lg hover:bg-oa-bg-secondary"
            >
              Skip All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-oa-text-secondary hover:text-oa-text-primary transition-colors rounded-lg hover:bg-oa-bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 pt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-oa-bg-secondary rounded-2xl">
                    {currentStepData.icon}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-oa-text-primary mb-3">
                  {currentStepData.title}
                </h2>

                {/* Description */}
                <p className="text-oa-text-secondary mb-6">
                  {currentStepData.description}
                </p>

                {/* Features list (if any) */}
                {currentStepData.features && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {currentStepData.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-oa-bg-secondary rounded-lg text-left"
                      >
                        <div className="text-oa-accent">{feature.icon}</div>
                        <span className="text-sm text-oa-text-primary">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Single action button */}
                {currentStepData.action && (
                  <button
                    onClick={currentStepData.action.onClick}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-oa-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity mb-4"
                  >
                    {currentStepData.action.label}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Multiple action buttons */}
                {currentStepData.actions && (
                  <div className="space-y-3 mb-4">
                    {currentStepData.actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={action.onClick}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                          action.primary
                            ? 'bg-oa-accent text-white hover:opacity-90'
                            : 'bg-oa-bg-secondary text-oa-text-primary hover:bg-oa-border'
                        }`}
                      >
                        {action.label}
                        {action.primary && <ArrowRight className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          <div className="px-8 py-4 border-t border-oa-border flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isFirstStep
                  ? 'text-oa-text-secondary/50 cursor-not-allowed'
                  : 'text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary'
              }`}
            >
              Back
            </button>

            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-oa-accent w-6'
                      : idx < currentStep
                      ? 'bg-oa-accent/50'
                      : 'bg-oa-border'
                  }`}
                />
              ))}
            </div>

            {!currentStepData.action && !currentStepData.actions && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-oa-accent hover:bg-oa-accent/10 rounded-lg transition-all"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {(currentStepData.action || currentStepData.actions) && (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary rounded-lg transition-all"
              >
                Skip
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FirstTimeWelcomeDialog

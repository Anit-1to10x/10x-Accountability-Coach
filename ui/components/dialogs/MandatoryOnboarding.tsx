'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  User,
  Target,
  ArrowRight,
  CheckCircle,
  Mail,
} from 'lucide-react'

interface OnboardingData {
  name: string
  email: string
}

interface MandatoryOnboardingProps {
  onComplete: (data: OnboardingData) => void
}

/**
 * Mandatory Onboarding Dialog
 *
 * This dialog CANNOT be skipped or closed.
 * Users must complete their profile setup before using the app.
 * Collects: name, email
 */
export function MandatoryOnboarding({ onComplete }: MandatoryOnboardingProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to 10X Coach!',
      description: "I'm your personal accountability partner. Before we begin, let me get to know you a bit.",
      icon: <Sparkles className="w-12 h-12 text-oa-accent" />,
      isIntro: true,
    },
    {
      id: 'name',
      title: "What's your name?",
      description: "I'll use this to personalize your coaching experience.",
      icon: <User className="w-12 h-12 text-blue-400" />,
      field: 'name',
      placeholder: 'Enter your name',
      required: true,
    },
    {
      id: 'email',
      title: "What's your email?",
      description: "We'll use this to identify your account and sync your progress.",
      icon: <Mail className="w-12 h-12 text-green-400" />,
      field: 'email',
      placeholder: 'Enter your email',
      type: 'email',
      required: true,
    },
    {
      id: 'complete',
      title: "You're all set!",
      description: "Let's create your first challenge and start building accountability habits.",
      icon: <CheckCircle className="w-12 h-12 text-green-400" />,
      isComplete: true,
    },
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const canProceed = () => {
    if (currentStepData.isIntro || currentStepData.isComplete) return true
    if (currentStepData.field) {
      const value = formData[currentStepData.field as keyof OnboardingData]
      if (currentStepData.required && !value?.trim()) return false
      if (currentStepData.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value)
      }
    }
    return true
  }

  const handleNext = async () => {
    setError('')

    if (isLastStep) {
      // Submit the onboarding data
      setIsSubmitting(true)
      try {
        const response = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            completed: true,
            completedAt: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create profile')
        }

        const data = await response.json()

        // Save profile ID to localStorage
        if (data.userId) {
          localStorage.setItem('activeProfileId', data.userId)
        }

        onComplete(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsSubmitting(false)
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleInputChange = (value: string) => {
    if (currentStepData.field) {
      setFormData(prev => ({
        ...prev,
        [currentStepData.field as keyof OnboardingData]: value,
      }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed() && !isSubmitting) {
      handleNext()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-oa-bg-primary border border-oa-border rounded-2xl shadow-2xl overflow-hidden"
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

              {/* Input field (if applicable) */}
              {currentStepData.field && (
                <div className="mb-6">
                  <input
                    type={currentStepData.type || 'text'}
                    value={formData[currentStepData.field as keyof OnboardingData] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStepData.placeholder}
                    autoFocus
                    className="w-full px-4 py-3 bg-oa-bg-secondary border border-oa-border rounded-xl text-oa-text-primary placeholder-oa-text-secondary/50 focus:outline-none focus:border-oa-accent focus:ring-1 focus:ring-oa-accent text-center text-lg"
                  />
                  {currentStepData.type === 'email' && formData.email && !canProceed() && (
                    <p className="mt-2 text-sm text-red-400">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Action button */}
              <button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  canProceed() && !isSubmitting
                    ? 'bg-oa-accent text-white hover:opacity-90'
                    : 'bg-oa-bg-secondary text-oa-text-secondary cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating your profile...</span>
                  </>
                ) : isLastStep ? (
                  <>
                    <span>Start My Journey</span>
                    <Target className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicators */}
        <div className="px-8 py-4 border-t border-oa-border flex items-center justify-center">
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
        </div>

        {/* Note about mandatory onboarding */}
        <div className="px-8 pb-4 text-center">
          <p className="text-xs text-oa-text-secondary/50">
            This setup is required to use 10X Coach
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default MandatoryOnboarding

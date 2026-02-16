'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  User,
  Mail,
  Clock,
  Zap,
  Target,
  ArrowRight,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'

interface OnboardingData {
  name: string
  email: string
  timezone: string
  productiveTime: string
  dailyHours: string
  accountabilityStyle: string
  bigGoal: string
}

interface MandatoryOnboardingProps {
  onComplete: (data: { name: string; email: string }) => void
}

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

/**
 * Mandatory Onboarding Dialog
 *
 * This dialog CANNOT be skipped or closed.
 * Users must complete their profile setup before using the app.
 */
export function MandatoryOnboarding({ onComplete }: MandatoryOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    email: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    productiveTime: '',
    dailyHours: '',
    accountabilityStyle: '',
    bigGoal: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to 10X Accountability Coach!',
      description: "Your personal AI accountability partner. Let's set up your profile in under a minute.",
      icon: <Sparkles className="w-12 h-12 text-oa-accent" />,
      type: 'intro' as const,
    },
    {
      id: 'name',
      title: "What's your name?",
      description: "I'll use this to personalize your coaching experience.",
      icon: <User className="w-12 h-12 text-blue-400" />,
      type: 'text' as const,
      field: 'name' as const,
      placeholder: 'Enter your name',
    },
    {
      id: 'email',
      title: "What's your email?",
      description: "Used to identify your profile. Stays local on your machine.",
      icon: <Mail className="w-12 h-12 text-green-400" />,
      type: 'email' as const,
      field: 'email' as const,
      placeholder: 'your@email.com',
    },
    {
      id: 'timezone',
      title: 'Your timezone?',
      description: "So I can send check-in reminders at the right time.",
      icon: <Clock className="w-12 h-12 text-amber-400" />,
      type: 'select' as const,
      field: 'timezone' as const,
      options: TIMEZONE_OPTIONS,
    },
    {
      id: 'productiveTime',
      title: 'When are you most productive?',
      description: "I'll schedule your most important tasks during peak hours.",
      icon: <Zap className="w-12 h-12 text-yellow-400" />,
      type: 'options' as const,
      field: 'productiveTime' as const,
      options: [
        'Morning (6am-12pm)',
        'Afternoon (12-6pm)',
        'Evening (6pm-12am)',
        'Night (12-6am)',
      ],
    },
    {
      id: 'dailyHours',
      title: 'Daily hours for growth?',
      description: 'How much time can you realistically commit each day?',
      icon: <Clock className="w-12 h-12 text-purple-400" />,
      type: 'options' as const,
      field: 'dailyHours' as const,
      options: ['1-2 hours', '2-4 hours', '4-6 hours', '6+ hours'],
    },
    {
      id: 'accountabilityStyle',
      title: 'Your coaching style?',
      description: 'How do you want me to hold you accountable?',
      icon: <Target className="w-12 h-12 text-red-400" />,
      type: 'options' as const,
      field: 'accountabilityStyle' as const,
      options: ['Tough Love', 'Balanced', 'Gentle & Supportive'],
    },
    {
      id: 'bigGoal',
      title: "What's your biggest goal?",
      description: "The one thing you want to achieve. We'll build a plan around it.",
      icon: <Target className="w-12 h-12 text-oa-accent" />,
      type: 'text' as const,
      field: 'bigGoal' as const,
      placeholder: 'e.g., Launch my SaaS product in 30 days',
    },
    {
      id: 'complete',
      title: "You're all set!",
      description: "Your profile is ready. Let's start building accountability habits.",
      icon: <CheckCircle className="w-12 h-12 text-green-400" />,
      type: 'complete' as const,
    },
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const canProceed = () => {
    if (currentStepData.type === 'intro' || currentStepData.type === 'complete') return true
    if (currentStepData.type === 'select') {
      const field = currentStepData.field as keyof OnboardingData
      return !!formData[field]?.trim()
    }
    if (currentStepData.field) {
      const field = currentStepData.field as keyof OnboardingData
      const value = formData[field]
      if (!value?.trim()) return false
      if (currentStepData.type === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      }
    }
    return true
  }

  const handleNext = async () => {
    setError('')

    if (isLastStep) {
      setIsSubmitting(true)
      try {
        const response = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            timezone: formData.timezone,
            productiveTime: formData.productiveTime,
            dailyHours: formData.dailyHours,
            accountabilityStyle: formData.accountabilityStyle,
            bigGoal: formData.bigGoal.trim(),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create profile')
        }

        const data = await response.json()

        if (data.userId) {
          localStorage.setItem('activeProfileId', data.userId)
        }

        onComplete({ name: formData.name, email: formData.email })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsSubmitting(false)
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setError('')
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

              {/* Text input */}
              {(currentStepData.type === 'text' || currentStepData.type === 'email') && (
                <div className="mb-6">
                  <input
                    type={currentStepData.type === 'email' ? 'email' : 'text'}
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

              {/* Option buttons */}
              {currentStepData.type === 'options' && currentStepData.options && (
                <div className="space-y-2 mb-6">
                  {currentStepData.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleInputChange(option)}
                      className={`w-full text-left px-4 py-3 border rounded-xl transition-all ${
                        formData[currentStepData.field as keyof OnboardingData] === option
                          ? 'border-oa-accent bg-oa-accent/10 text-oa-accent'
                          : 'border-oa-border hover:border-oa-text-secondary hover:bg-oa-bg-secondary text-oa-text-primary'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Select dropdown (timezone) */}
              {currentStepData.type === 'select' && currentStepData.options && (
                <div className="mb-6">
                  <select
                    value={formData[currentStepData.field as keyof OnboardingData] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full px-4 py-3 bg-oa-bg-secondary border border-oa-border rounded-xl text-oa-text-primary focus:outline-none focus:border-oa-accent focus:ring-1 focus:ring-oa-accent text-center text-lg appearance-none cursor-pointer"
                  >
                    {currentStepData.options.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-oa-text-secondary/60">
                    Auto-detected from your browser
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-oa-border text-oa-text-secondary hover:bg-oa-bg-secondary transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    canProceed() && !isSubmitting
                      ? 'bg-oa-accent text-white hover:opacity-90'
                      : 'bg-oa-bg-secondary text-oa-text-secondary cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating profile...</span>
                    </>
                  ) : isLastStep ? (
                    <>
                      <span>Start My Journey</span>
                      <Target className="w-5 h-5" />
                    </>
                  ) : currentStepData.type === 'intro' ? (
                    <>
                      <span>Let&apos;s Go</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicators */}
        <div className="px-8 py-4 border-t border-oa-border flex items-center justify-center">
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-oa-accent w-6'
                    : idx < currentStep
                    ? 'bg-oa-accent/50 w-2'
                    : 'bg-oa-border w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-8 pb-4 text-center">
          <p className="text-xs text-oa-text-secondary/50">
            All data stays on your machine
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default MandatoryOnboarding

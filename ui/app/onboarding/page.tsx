'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const AVATAR_COLORS = [
  { id: 'purple', gradient: 'from-purple-500 to-pink-500' },
  { id: 'blue', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'green', gradient: 'from-green-500 to-emerald-500' },
  { id: 'orange', gradient: 'from-orange-500 to-red-500' },
  { id: 'indigo', gradient: 'from-indigo-500 to-purple-500' },
  { id: 'teal', gradient: 'from-teal-500 to-green-500' },
]

const AVATAR_EMOJIS = ['😎', '🚀', '💪', '🎯', '⚡', '🔥', '🌟', '🏆']

type Step = {
  id: string
  question: string
  type: 'avatar' | 'text' | 'email' | 'options' | 'select'
  placeholder?: string
  options?: string[]
}

const STEPS: Step[] = [
  { id: 'avatar', question: 'Create your profile', type: 'avatar' },
  { id: 'name', question: "What's your name?", type: 'text', placeholder: 'Your name' },
  { id: 'email', question: "What's your email?", type: 'email', placeholder: 'your@email.com' },
  { id: 'timezone', question: 'What timezone are you in?', type: 'select' },
  { id: 'productiveTime', question: 'When are you most productive?', type: 'options', options: ['Morning (6-12pm)', 'Afternoon (12-6pm)', 'Evening (6-12am)', 'Night (12-6am)'] },
  { id: 'dailyHours', question: 'How many hours daily can you commit?', type: 'options', options: ['1-2 hours', '2-4 hours', '4-6 hours', '6+ hours'] },
  { id: 'accountabilityStyle', question: 'What coaching style works for you?', type: 'options', options: ['Tough Love', 'Balanced', 'Gentle & Supportive'] },
  { id: 'bigGoal', question: "What's your biggest goal right now?", type: 'text', placeholder: 'Describe your main goal' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({
    avatarColor: 'purple',
    avatarEmoji: '😎',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const canProceed = () => {
    if (step.type === 'avatar') return answers.avatarColor && answers.avatarEmoji
    if (step.type === 'select') return answers.timezone
    return inputValue.trim().length > 0
  }

  const handleNext = async () => {
    if (!canProceed()) return

    const newAnswers = { ...answers }
    if (step.type !== 'avatar' && step.type !== 'select') {
      newAnswers[step.id] = inputValue
    }
    setAnswers(newAnswers)

    if (isLast) {
      setSaving(true)
      try {
        const res = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnswers),
        })
        const data = await res.json()
        if (data.userId) {
          localStorage.setItem('activeProfileId', data.userId)
          localStorage.setItem('activeProfileName', newAnswers.name || '')
        }
        router.push('/app')
      } catch (error) {
        console.error('Failed to save:', error)
        setSaving(false)
      }
    } else {
      setCurrentStep(currentStep + 1)
      setInputValue(answers[STEPS[currentStep + 1]?.id] || '')
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      const prevStep = STEPS[currentStep - 1]
      if (prevStep.type !== 'avatar' && prevStep.type !== 'select') {
        setInputValue(answers[prevStep.id] || '')
      }
    }
  }

  // Common timezone list
  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Calcutta', 'Asia/Shanghai', 'Asia/Tokyo',
    'Australia/Sydney', 'Pacific/Auckland',
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-2xl font-semibold text-white mb-6">{step.question}</h1>

          {/* Avatar Step */}
          {step.type === 'avatar' && (
            <div className="space-y-6">
              {/* Emoji selection */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Choose your avatar</p>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setAnswers({ ...answers, avatarEmoji: emoji })}
                      className={`w-14 h-14 rounded-xl text-2xl flex items-center justify-center transition-all ${
                        answers.avatarEmoji === emoji
                          ? 'bg-purple-500/20 ring-2 ring-purple-500 scale-110'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selection */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Choose your color</p>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setAnswers({ ...answers, avatarColor: color.id })}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.gradient} transition-all ${
                        answers.avatarColor === color.id
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex justify-center pt-2">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${
                  AVATAR_COLORS.find(c => c.id === answers.avatarColor)?.gradient || AVATAR_COLORS[0].gradient
                } flex items-center justify-center text-4xl shadow-lg`}>
                  {answers.avatarEmoji}
                </div>
              </div>
            </div>
          )}

          {/* Text/Email input */}
          {(step.type === 'text' || step.type === 'email') && (
            <input
              type={step.type}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={step.placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              autoFocus
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          )}

          {/* Options */}
          {step.type === 'options' && (
            <div className="space-y-3">
              {step.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => setInputValue(option)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    inputValue === option
                      ? 'bg-purple-500/20 border border-purple-500 text-purple-300'
                      : 'bg-gray-900 border border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Timezone select */}
          {step.type === 'select' && (
            <div>
              <p className="text-sm text-gray-400 mb-2">
                Detected: <span className="text-purple-400">{answers.timezone}</span>
              </p>
              <select
                value={answers.timezone}
                onChange={(e) => setAnswers({ ...answers, timezone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
                {!timezones.includes(answers.timezone) && (
                  <option value={answers.timezone}>{answers.timezone}</option>
                )}
              </select>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              canProceed() && !saving
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {saving ? 'Creating profile...' : isLast ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

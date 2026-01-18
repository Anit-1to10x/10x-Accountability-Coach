'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'

const ONBOARDING_QUESTIONS = [
  {
    id: 'name',
    question: "What's your name?",
    type: 'text',
    placeholder: 'Your name',
  },
  {
    id: 'email',
    question: "What's your email?",
    type: 'email',
    placeholder: 'your@email.com',
  },
  {
    id: 'timezone',
    question: 'What timezone are you in?',
    type: 'text',
    placeholder: 'e.g., America/New_York',
  },
  {
    id: 'productiveTime',
    question: 'When are you most productive?',
    type: 'options',
    options: ['Morning (6-12pm)', 'Afternoon (12-6pm)', 'Evening (6-12am)', 'Night (12-6am)'],
  },
  {
    id: 'dailyHours',
    question: 'How many hours daily can you commit to growth?',
    type: 'options',
    options: ['1-2 hours', '2-4 hours', '4-6 hours', '6+ hours'],
  },
  {
    id: 'accountabilityStyle',
    question: 'What accountability style works for you?',
    type: 'options',
    options: ['Tough Love', 'Balanced', 'Gentle & Supportive'],
  },
  {
    id: 'bigGoal',
    question: "What's your biggest goal right now?",
    type: 'text',
    placeholder: 'Describe your main goal',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [inputValue, setInputValue] = useState('')

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep]
  const isLastQuestion = currentStep === ONBOARDING_QUESTIONS.length - 1

  const handleNext = async () => {
    if (!inputValue.trim()) return

    const newAnswers = { ...answers, [currentQuestion.id]: inputValue }
    setAnswers(newAnswers)

    if (isLastQuestion) {
      // Save onboarding data
      try {
        const res = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnswers),
        })
        const data = await res.json()

        // Set active profile ID in localStorage
        if (data.userId) {
          localStorage.setItem('activeProfileId', data.userId)
        }

        router.push('/app')
      } catch (error) {
        console.error('Failed to save onboarding:', error)
      }
    } else {
      setCurrentStep(currentStep + 1)
      setInputValue('')
    }
  }

  const handleOptionSelect = (option: string) => {
    setInputValue(option)
  }

  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100

  return (
    <div className="h-screen w-screen bg-oa-bg-primary flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-oa-border rounded-full overflow-hidden">
            <div
              className="h-full bg-oa-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-oa-text-secondary mt-2">
            Question {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
          </p>
        </div>

        <Card>
          <h1 className="text-2xl font-semibold mb-6 text-oa-text-primary">{currentQuestion.question}</h1>

          {currentQuestion.type === 'text' || currentQuestion.type === 'email' ? (
            <Input
              type={currentQuestion.type}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentQuestion.placeholder}
              onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              className="mb-6"
              autoFocus
            />
          ) : (
            <div className="space-y-3 mb-6">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full text-left px-4 py-3 border rounded-lg transition-colors ${
                    inputValue === option
                      ? 'border-oa-accent bg-oa-accent/10 text-oa-accent'
                      : 'border-oa-border hover:border-oa-text-secondary hover:bg-oa-bg-secondary'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setCurrentStep(currentStep - 1)
                  setInputValue(answers[ONBOARDING_QUESTIONS[currentStep - 1].id] || '')
                }}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!inputValue.trim()}
              className="flex-1"
            >
              {isLastQuestion ? 'Complete' : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * Onboarding State Machine
 *
 * Manages step-by-step conversational onboarding flow
 * with dynamic question generation based on user responses
 */

import type { ChatMessageOption } from '@/types/chat'

export interface OnboardingState {
  currentStep: string
  responses: Record<string, string>
  isComplete: boolean
}

export interface StepConfig {
  id: string
  getMessage: (responses: Record<string, string>) => string
  options?: ChatMessageOption[]
  inputType?: 'text' | 'date' | 'number' | 'select' | 'multi-select'
  nextStep: (response: string, responses: Record<string, string>) => string | null
  required?: boolean
}

// First-time user onboarding steps
export const USER_ONBOARDING_STEPS: StepConfig[] = [
  {
    id: 'name',
    getMessage: () => "Hey! I'm your accountability coach. What should I call you?",
    inputType: 'text',
    nextStep: () => 'persona',
    required: true,
  },
  {
    id: 'persona',
    getMessage: (r) =>
      `Nice to meet you, ${r.name}! How would you like me to hold you accountable?`,
    options: [
      {
        label: 'Strict - No excuses',
        value: 'strict',
        description: "I'll be tough on you, hold you to high standards",
      },
      {
        label: 'Balanced - Firm but fair',
        value: 'balanced',
        description: 'Understanding but demanding, supportive yet challenging',
      },
      {
        label: 'Friendly - Gentle encouragement',
        value: 'friendly',
        description: 'Supportive and encouraging, celebrating small wins',
      },
    ],
    inputType: 'select',
    nextStep: () => 'has_resolution',
    required: true,
  },
  {
    id: 'has_resolution',
    getMessage: () =>
      "Have you set any New Year resolutions or big goals for this year?",
    options: [
      { label: 'Yes, I have specific goals', value: 'yes' },
      { label: 'No, I want to figure it out', value: 'no' },
    ],
    inputType: 'select',
    nextStep: (response) => (response === 'yes' ? 'resolution_text' : 'challenge_name'),
    required: true,
  },
  {
    id: 'resolution_text',
    getMessage: () =>
      "What's your New Year resolution or main goal? Share as much detail as you'd like - this will guide ALL your plans.",
    inputType: 'text',
    nextStep: () => 'challenge_name',
    required: true,
  },
  {
    id: 'challenge_name',
    getMessage: (r) =>
      r.resolution_text
        ? `Great! Now let's create your first challenge to work towards that goal.\n\nWhat skill or habit do you want to build?`
        : "Let's create your first challenge! What skill or habit do you want to build?",
    inputType: 'text',
    nextStep: () => 'challenge_type',
    required: true,
  },
  {
    id: 'challenge_type',
    getMessage: () => 'What type of challenge is this?',
    options: [
      { label: 'Learning', value: 'learning' },
      { label: 'Building', value: 'building' },
      { label: 'Fitness', value: 'fitness' },
      { label: 'Habit', value: 'habit' },
      { label: 'Creative', value: 'creative' },
      { label: 'Custom', value: 'custom' },
    ],
    inputType: 'select',
    nextStep: () => 'deadline',
    required: true,
  },
  {
    id: 'deadline',
    getMessage: () =>
      'When do you want to achieve this by? Be specific - deadlines create urgency!',
    inputType: 'date',
    nextStep: () => 'daily_hours',
    required: true,
  },
  {
    id: 'daily_hours',
    getMessage: () => 'How many hours per day can you realistically dedicate to this?',
    options: [
      { label: '30 minutes', value: '0.5' },
      { label: '1 hour', value: '1' },
      { label: '2 hours', value: '2' },
      { label: '3+ hours', value: '3' },
    ],
    inputType: 'select',
    nextStep: () => 'available_slots',
    required: true,
  },
  {
    id: 'available_slots',
    getMessage: () => 'When are you most productive? Select all that apply:',
    options: [
      { label: 'Early Morning (5-8am)', value: 'early-morning' },
      { label: 'Morning (8-12pm)', value: 'morning' },
      { label: 'Afternoon (12-5pm)', value: 'afternoon' },
      { label: 'Evening (5-9pm)', value: 'evening' },
      { label: 'Night (9pm+)', value: 'night' },
    ],
    inputType: 'multi-select',
    nextStep: () => 'punishment_type',
    required: true,
  },
  {
    id: 'punishment_type',
    getMessage: () =>
      `Now for accountability! What should happen if you break your streak or miss too many days?\n\n• **Mild** - Encouraging reminder\n• **Moderate** - Shame message + progress reset\n• **Severe** - Custom punishment (you define it)`,
    options: [
      { label: 'Mild - Gentle reminder', value: 'mild' },
      { label: 'Moderate - Progress reset', value: 'moderate' },
      { label: 'Severe - Custom punishment', value: 'severe' },
    ],
    inputType: 'select',
    nextStep: (response) => (response === 'severe' ? 'custom_punishment' : 'grace_period'),
    required: true,
  },
  {
    id: 'custom_punishment',
    getMessage: () =>
      "What's your custom punishment? Make it something you REALLY don't want to do!\n\nExamples:\n• Donate $50 to charity\n• No Netflix for a week\n• Post confession on social media",
    inputType: 'text',
    nextStep: () => 'grace_period',
    required: true,
  },
  {
    id: 'grace_period',
    getMessage: () => "How many 'grace' days should I allow before punishment triggers?",
    options: [
      { label: '0 - No mercy!', value: '0' },
      { label: '1 day', value: '1' },
      { label: '2 days', value: '2' },
      { label: '3 days', value: '3' },
    ],
    inputType: 'select',
    nextStep: () => null, // End of flow
    required: true,
  },
]

// Challenge onboarding steps (for subsequent challenges)
export const CHALLENGE_ONBOARDING_STEPS: StepConfig[] = [
  {
    id: 'challenge_name',
    getMessage: (r) => {
      if (r.existingChallenges && r.existingChallenges.length > 0) {
        return `I see you're already working on: ${r.existingChallenges}.\n\nWhat new skill or habit would you like to add?`
      }
      return 'What skill or habit do you want to build?'
    },
    inputType: 'text',
    nextStep: () => 'challenge_type',
    required: true,
  },
  {
    id: 'challenge_type',
    getMessage: () => 'What type of challenge is this?',
    options: [
      { label: 'Learning', value: 'learning' },
      { label: 'Building', value: 'building' },
      { label: 'Fitness', value: 'fitness' },
      { label: 'Habit', value: 'habit' },
      { label: 'Creative', value: 'creative' },
      { label: 'Custom', value: 'custom' },
    ],
    inputType: 'select',
    nextStep: () => 'deadline',
    required: true,
  },
  {
    id: 'deadline',
    getMessage: () => 'When do you want to achieve this by?',
    inputType: 'date',
    nextStep: () => 'daily_hours',
    required: true,
  },
  {
    id: 'daily_hours',
    getMessage: (r) => {
      const remaining = r.remainingHours ? parseInt(r.remainingHours) : 8
      return remaining > 0
        ? `You have about ${remaining} hours of capacity left per day. How much time will you dedicate to this challenge?`
        : "How many hours per day will you dedicate to this? (Note: You're already quite committed!)"
    },
    options: [
      { label: '30 minutes', value: '0.5' },
      { label: '1 hour', value: '1' },
      { label: '2 hours', value: '2' },
      { label: '3+ hours', value: '3' },
    ],
    inputType: 'select',
    nextStep: () => 'punishment_type',
    required: true,
  },
  {
    id: 'punishment_type',
    getMessage: () => 'What should happen if you break this streak?',
    options: [
      { label: 'Mild - Gentle reminder', value: 'mild' },
      { label: 'Moderate - Progress reset', value: 'moderate' },
      { label: 'Severe - Custom punishment', value: 'severe' },
    ],
    inputType: 'select',
    nextStep: (response) => (response === 'severe' ? 'custom_punishment' : 'grace_period'),
    required: true,
  },
  {
    id: 'custom_punishment',
    getMessage: () => 'Define your custom punishment:',
    inputType: 'text',
    nextStep: () => 'grace_period',
    required: true,
  },
  {
    id: 'grace_period',
    getMessage: () => 'Grace period before punishment?',
    options: [
      { label: '0 - No mercy!', value: '0' },
      { label: '1 day', value: '1' },
      { label: '2 days', value: '2' },
      { label: '3 days', value: '3' },
    ],
    inputType: 'select',
    nextStep: () => null, // End of flow
    required: true,
  },
]

/**
 * Get the next step based on current step and response
 */
export function getNextStep(
  currentStepId: string,
  response: string,
  responses: Record<string, string>,
  flowType: 'user' | 'challenge' = 'user'
): StepConfig | null {
  const steps = flowType === 'user' ? USER_ONBOARDING_STEPS : CHALLENGE_ONBOARDING_STEPS
  const currentStep = steps.find((s) => s.id === currentStepId)

  if (!currentStep) return null

  const nextStepId = currentStep.nextStep(response, responses)
  if (!nextStepId) return null

  return steps.find((s) => s.id === nextStepId) || null
}

/**
 * Get the first step of the flow
 */
export function getFirstStep(flowType: 'user' | 'challenge' = 'user'): StepConfig {
  const steps = flowType === 'user' ? USER_ONBOARDING_STEPS : CHALLENGE_ONBOARDING_STEPS
  return steps[0]
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(currentStepId: string, flowType: 'user' | 'challenge' = 'user'): boolean {
  const steps = flowType === 'user' ? USER_ONBOARDING_STEPS : CHALLENGE_ONBOARDING_STEPS
  const currentStep = steps.find((s) => s.id === currentStepId)

  if (!currentStep) return false

  // Check if nextStep returns null (end of flow)
  const testNext = currentStep.nextStep('', {})
  return testNext === null
}

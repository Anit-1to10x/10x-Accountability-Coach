/**
 * Onboarding Flow Definitions
 *
 * Conversational onboarding for creating challenges
 */

export interface OnboardingStep {
  id: string
  question: string
  type: 'text' | 'select' | 'multi-select' | 'date' | 'number'
  options?: string[]
  dependsOn?: { step: string; value: string | string[] }
  required: boolean
  placeholder?: string
  helpText?: string
}

export const FIRST_TIME_ONBOARDING: OnboardingStep[] = [
  // Step 1: Agent Selection (if multiple)
  {
    id: 'agent_select',
    question:
      "I see you have multiple agents available. Which one would you like to work with for your first challenge?",
    type: 'select',
    options: ['{{agents}}'], // Dynamic - populated from available agents
    required: true,
    helpText: 'You can always switch agents later.',
  },

  // Step 2: Persona Selection
  {
    id: 'persona',
    question: `How would you like me to hold you accountable?

• **Strict** - I'll be tough on you, no excuses accepted
• **Balanced** - Firm but understanding, supportive yet demanding
• **Friendly** - Gentle encouragement, supportive approach

Choose your accountability style:`,
    type: 'select',
    options: ['strict', 'balanced', 'friendly'],
    required: true,
    helpText: 'This affects how I communicate with you throughout your journey.',
  },

  // Step 3: New Year Resolution (Contextual)
  {
    id: 'has_resolution',
    question: "Have you set any New Year resolutions or big goals for this year?",
    type: 'select',
    options: ['Yes, I have specific goals', 'No, I want to figure it out'],
    required: true,
    helpText:
      'Your resolution will guide ALL your plans and challenges. It\'s your North Star.',
  },

  // Step 3a: If YES to resolution
  {
    id: 'resolution_text',
    question:
      "What's your New Year resolution or main goal? Share as much detail as you'd like - this will guide ALL your plans.",
    type: 'text',
    dependsOn: { step: 'has_resolution', value: 'Yes, I have specific goals' },
    required: true,
    placeholder: 'e.g., "Become a senior software engineer" or "Run a marathon"',
    helpText:
      'Be specific! The more detail you provide, the better I can help you achieve it.',
  },

  // Step 4: Goal/Challenge Name
  {
    id: 'challenge_name',
    question:
      "Let's create your first challenge! What skill or habit do you want to build?",
    type: 'text',
    required: true,
    placeholder: 'e.g., "Learn Python", "Build a SaaS product", "Wake up at 5am"',
    helpText: 'Keep it clear and specific.',
  },

  // Step 5: Challenge Type
  {
    id: 'challenge_type',
    question: "What type of challenge is this?",
    type: 'select',
    options: ['learning', 'building', 'fitness', 'habit', 'creative', 'custom'],
    required: true,
    helpText: 'This helps me tailor the approach to your specific challenge.',
  },

  // Step 6: Deadline
  {
    id: 'deadline',
    question: "When do you want to achieve this by? Be specific - deadlines create urgency!",
    type: 'date',
    required: true,
    helpText: 'Pick a realistic but challenging deadline.',
  },

  // Step 7: Time Commitment
  {
    id: 'daily_hours',
    question: "How many hours per day can you realistically dedicate to this?",
    type: 'select',
    options: ['30 mins', '1 hour', '2 hours', '3+ hours'],
    required: true,
    helpText: 'Be honest! It\'s better to start small and stay consistent.',
  },

  // Step 8: Available Slots
  {
    id: 'available_slots',
    question: "When are you most productive? Select all that apply:",
    type: 'multi-select',
    options: [
      'Early Morning (5-8am)',
      'Morning (8-12pm)',
      'Afternoon (12-5pm)',
      'Evening (5-9pm)',
      'Night (9pm+)',
    ],
    required: true,
    helpText: 'I\'ll schedule your tasks during these times.',
  },

  // Step 9: Punishment Setup
  {
    id: 'punishment_type',
    question: `Now for accountability! What should happen if you break your streak or miss too many days?

• **Mild** - Encouraging reminder, gentle nudge
• **Moderate** - Shame message + progress visibility reset
• **Severe** - Custom punishment (you define it)

Choose your accountability level:`,
    type: 'select',
    options: ['mild', 'moderate', 'severe'],
    required: true,
    helpText: 'Punishments keep you honest. Choose wisely!',
  },

  // Step 9a: Custom punishment (if severe)
  {
    id: 'custom_punishment',
    question: `What's your custom punishment? Make it something you REALLY don't want to do!

Examples:
• "Donate $50 to charity"
• "No Netflix for a week"
• "Post confession on social media"

Your punishment:`,
    type: 'text',
    dependsOn: { step: 'punishment_type', value: 'severe' },
    required: true,
    placeholder: 'Type your custom punishment...',
    helpText: 'The more you fear it, the more effective it will be.',
  },

  // Step 10: Grace Period
  {
    id: 'grace_period',
    question: "How many 'grace' days should I allow before punishment triggers?",
    type: 'select',
    options: ['0 - No mercy!', '1 day', '2 days', '3 days'],
    required: true,
    helpText: 'Grace days give you a buffer for emergencies.',
  },
]

/**
 * Generate adaptive questions for subsequent challenges
 * based on existing user data
 */
export function generateAdaptiveQuestions(context: {
  userName?: string
  existingChallenges: string[]
  totalDailyHours: number
  preferredTimes?: string[]
  persona?: string
  hasResolution: boolean
}): OnboardingStep[] {
  const questions: OnboardingStep[] = []

  // Skip persona if already set
  if (!context.persona) {
    questions.push({
      id: 'persona',
      question: 'How would you like me to hold you accountable this time?',
      type: 'select',
      options: ['strict', 'balanced', 'friendly'],
      required: true,
    })
  }

  // Always ask for challenge name
  questions.push({
    id: 'challenge_name',
    question:
      context.existingChallenges.length > 0
        ? `I see you're already working on: ${context.existingChallenges.join(', ')}.\n\nWhat new skill or habit would you like to add?`
        : "What skill or habit do you want to build?",
    type: 'text',
    required: true,
    placeholder: 'e.g., "Learn React", "Morning meditation"',
  })

  // Challenge type
  questions.push({
    id: 'challenge_type',
    question: "What type of challenge is this?",
    type: 'select',
    options: ['learning', 'building', 'fitness', 'habit', 'creative', 'custom'],
    required: true,
  })

  // Deadline
  questions.push({
    id: 'deadline',
    question: "When do you want to achieve this by?",
    type: 'date',
    required: true,
  })

  // Time commitment with context
  const remainingHours = Math.max(0, 8 - context.totalDailyHours)
  questions.push({
    id: 'daily_hours',
    question:
      remainingHours > 0
        ? `You have about ${remainingHours} hours of capacity left per day. How much time will you dedicate to this challenge?`
        : "How many hours per day will you dedicate to this? (Note: You're already quite committed!)",
    type: 'select',
    options: ['30 mins', '1 hour', '2 hours', '3+ hours'],
    required: true,
  })

  // Skip time slots if already set
  if (!context.preferredTimes || context.preferredTimes.length === 0) {
    questions.push({
      id: 'available_slots',
      question: "When are you most productive?",
      type: 'multi-select',
      options: [
        'Early Morning (5-8am)',
        'Morning (8-12pm)',
        'Afternoon (12-5pm)',
        'Evening (5-9pm)',
        'Night (9pm+)',
      ],
      required: true,
    })
  }

  // Punishment
  questions.push({
    id: 'punishment_type',
    question: "What should happen if you break this streak?",
    type: 'select',
    options: ['mild', 'moderate', 'severe'],
    required: true,
  })

  questions.push({
    id: 'custom_punishment',
    question: "Define your custom punishment:",
    type: 'text',
    dependsOn: { step: 'punishment_type', value: 'severe' },
    required: true,
    placeholder: 'e.g., "Donate $25 to charity"',
  })

  questions.push({
    id: 'grace_period',
    question: "Grace period before punishment?",
    type: 'select',
    options: ['0 - No mercy!', '1 day', '2 days', '3 days'],
    required: true,
  })

  return questions
}

/**
 * Parse punishment details from user responses
 */
export function parsePunishment(responses: Record<string, any>) {
  const punishmentType = responses.punishment_type
  const customPunishment = responses.custom_punishment
  const gracePeriod = parseInt(responses.grace_period?.split(' ')[0] || '0')

  let consequence: any = {
    type: 'message',
    description: 'Gentle reminder to get back on track',
    severity: 'mild',
  }

  switch (punishmentType) {
    case 'mild':
      consequence = {
        type: 'message',
        description: 'Encouraging reminder to get back on track',
        severity: 'mild',
      }
      break
    case 'moderate':
      consequence = {
        type: 'restriction',
        description: 'Progress visibility reset + shame message',
        severity: 'moderate',
      }
      break
    case 'severe':
      consequence = {
        type: 'custom',
        description: customPunishment || 'Custom punishment not specified',
        severity: 'severe',
      }
      break
  }

  return {
    punishment: {
      id: `pun-${Date.now()}`,
      type: 'streak_break',
      trigger: {
        type: 'streak_days',
        value: 3, // Default: 3 missed days
      },
      consequence,
      status: 'active',
    },
    gracePeriod: gracePeriod * 24, // Convert days to hours
  }
}

/**
 * Parse daily hours from user response
 */
export function parseDailyHours(response: string): number {
  if (response.includes('30 mins')) return 0.5
  if (response.includes('1 hour')) return 1
  if (response.includes('2 hours')) return 2
  if (response.includes('3+')) return 3
  return 1
}

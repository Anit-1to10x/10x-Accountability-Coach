/**
 * Adaptive Onboarding System
 *
 * Generates context-aware questions based on existing user data
 */

import type { Challenge } from '@/types/streak'
import { addProfileId } from './useProfileId'

interface UserContext {
  hasResolution: boolean
  resolution?: string
  existingChallenges: Array<{ id: string; name: string; dailyHours: number }>
  preferredTimes: string[]
  persona?: 'strict' | 'balanced' | 'friendly'
  totalDailyHours: number
  userName?: string
}

/**
 * Load user context from profile and challenges
 */
export async function loadUserContext(): Promise<UserContext> {
  try {
    // Load profile
    let userName: string | undefined
    let persona: 'strict' | 'balanced' | 'friendly' | undefined
    let hasResolution = false
    let resolution: string | undefined

    try {
      const profileRes = await fetch('/api/user/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        userName = profileData.name
        persona = profileData.persona
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }

    // Load resolution
    try {
      const resolutionRes = await fetch('/api/user/resolution')
      if (resolutionRes.ok) {
        const resolutionData = await resolutionRes.json()
        if (resolutionData.resolution) {
          hasResolution = true
          resolution = resolutionData.resolution
        }
      }
    } catch (error) {
      // Resolution doesn't exist yet
    }

    // Load challenges
    let existingChallenges: Array<{ id: string; name: string; dailyHours: number }> = []
    let totalDailyHours = 0

    try {
      const profileId = typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') : null
      const url = addProfileId('/api/challenges', profileId)
      const challengesRes = await fetch(url)
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json()
        existingChallenges = (challengesData.challenges || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          dailyHours: c.dailyHours || 1,
        }))
        totalDailyHours = existingChallenges.reduce((sum, c) => sum + c.dailyHours, 0)
      }
    } catch (error) {
      console.error('Failed to load challenges:', error)
    }

    // Load preferred times from profile
    let preferredTimes: string[] = []
    try {
      const availabilityRes = await fetch('/api/user/availability')
      if (availabilityRes.ok) {
        const availabilityData = await availabilityRes.json()
        preferredTimes = availabilityData.slots || []
      }
    } catch (error) {
      // Availability not set yet
    }

    return {
      hasResolution,
      resolution,
      existingChallenges,
      preferredTimes,
      persona,
      totalDailyHours,
      userName,
    }
  } catch (error) {
    console.error('Error loading user context:', error)
    return {
      hasResolution: false,
      existingChallenges: [],
      preferredTimes: [],
      totalDailyHours: 0,
    }
  }
}

/**
 * Generate contextual opening message based on user data
 */
export function generateContextualOpening(context: UserContext, isFirstTime: boolean): string {
  if (isFirstTime) {
    return `Welcome to OpenAnalyst! I'm your Accountability Coach.

Before we begin, I need to set up your first challenge. This is **mandatory** - you can't skip it!

Don't worry, it'll only take a few minutes, and I'll help you create a solid plan.

Let's start!`
  }

  // Subsequent challenges
  const parts: string[] = []

  if (context.existingChallenges.length > 0) {
    const challengeNames = context.existingChallenges.map(c => c.name).join(', ')
    parts.push(`I see you're already working on: **${challengeNames}**.`)
  }

  if (context.totalDailyHours > 0) {
    const remainingHours = Math.max(0, 8 - context.totalDailyHours)
    if (remainingHours > 0) {
      parts.push(`You have about **${remainingHours} hours** of capacity left per day.`)
    } else {
      parts.push(
        `You're already dedicating **${context.totalDailyHours} hours** per day to your challenges! Are you sure you want to add more? 😅`
      )
    }
  }

  if (context.hasResolution && context.resolution) {
    parts.push(`Your resolution is: *"${context.resolution}"*`)
    parts.push(`Let's make sure this new challenge aligns with that goal.`)
  }

  if (parts.length === 0) {
    parts.push(`Ready to create a new challenge?`)
  }

  return parts.join('\n\n')
}

/**
 * Generate persona-specific message
 */
export function getPersonaMessage(
  persona: 'strict' | 'balanced' | 'friendly' | undefined,
  messageType: 'encouragement' | 'reminder' | 'punishment'
): string {
  const messages = {
    strict: {
      encouragement: 'Good. Keep pushing.',
      reminder: 'You committed to this. No excuses.',
      punishment: 'You failed. Time to face the consequences.',
    },
    balanced: {
      encouragement: 'Great work! Keep it up.',
      reminder: "Don't forget your commitment. You've got this!",
      punishment: 'You missed the mark. Let\'s get back on track.',
    },
    friendly: {
      encouragement: 'Amazing job! I\'m proud of you! 🎉',
      reminder: 'Hey! Just a friendly reminder about your goal today.',
      punishment: "It's okay to stumble. Let's learn from this and move forward!",
    },
  }

  return messages[persona || 'balanced'][messageType]
}

/**
 * Calculate recommended daily hours based on existing commitments
 */
export function getRecommendedHours(context: UserContext): string[] {
  const remainingHours = Math.max(0, 8 - context.totalDailyHours)

  if (remainingHours >= 3) {
    return ['30 mins', '1 hour', '2 hours', '3+ hours']
  } else if (remainingHours >= 2) {
    return ['30 mins', '1 hour', '2 hours']
  } else if (remainingHours >= 1) {
    return ['30 mins', '1 hour']
  } else {
    return ['30 mins'] // At capacity, suggest minimum
  }
}

/**
 * Check if onboarding is required (no challenges exist)
 */
export async function isOnboardingRequired(): Promise<boolean> {
  try {
    const profileId = typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') : null
    const url = addProfileId('/api/challenges', profileId)
    const res = await fetch(url)
    if (!res.ok) return true

    const data = await res.json()
    return !data.challenges || data.challenges.length === 0
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return true
  }
}

/**
 * Get appropriate punishment options based on existing punishments
 */
export function getPunishmentOptions(context: UserContext): {
  label: string
  value: string
  description: string
}[] {
  const options = [
    {
      label: 'Mild',
      value: 'mild',
      description: 'Encouraging reminder - gentle nudge to get back on track',
    },
    {
      label: 'Moderate',
      value: 'moderate',
      description: 'Shame message + progress reset - visible accountability',
    },
    {
      label: 'Severe',
      value: 'severe',
      description: 'Custom punishment - define your own consequence',
    },
  ]

  // If user has strict persona, recommend severe punishment
  if (context.persona === 'strict') {
    options[2].label += ' (Recommended for you)'
  }

  return options
}

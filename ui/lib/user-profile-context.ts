/**
 * User Profile Context System
 *
 * Integrates user profile settings into AI context.
 * User preferences override default system prompt settings.
 */

import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { DATA_DIR, getProfilePaths } from './paths'

// User profile structure
export interface UserProfile {
  id: string
  name: string
  email?: string
  timezone?: string
  preferences: UserPreferences
  accountability: AccountabilitySettings
  communication: CommunicationPreferences
  schedule: ScheduleSettings
  challenges: ChallengeContext[]
  stats: UserStats
}

export interface UserPreferences {
  // Personality overrides
  coachingStyle: 'gentle' | 'balanced' | 'tough-love'
  motivationLevel: 'high' | 'medium' | 'low'
  detailLevel: 'brief' | 'detailed' | 'comprehensive'

  // Communication
  preferredTone: string
  avoidTopics: string[]
  focusAreas: string[]

  // Behavior
  reminderFrequency: 'minimal' | 'moderate' | 'frequent'
  celebrateWins: boolean
  pushOnMissedDays: boolean
}

export interface AccountabilitySettings {
  strictMode: boolean
  allowExcuses: boolean
  dailyCheckInRequired: boolean
  streakImportance: 'low' | 'medium' | 'high'
  failureHandling: 'gentle' | 'honest' | 'firm'
}

export interface CommunicationPreferences {
  messageLength: 'short' | 'medium' | 'long'
  useEmoji: boolean
  formalityLevel: 'casual' | 'balanced' | 'formal'
  encouragementStyle: 'subtle' | 'moderate' | 'enthusiastic'
}

export interface ScheduleSettings {
  timezone: string
  preferredCheckInTime?: string
  workDays: string[]
  focusHours?: { start: string; end: string }
}

export interface ChallengeContext {
  id: string
  name: string
  currentDay: number
  totalDays: number
  streak: number
  progress: number
  status: 'active' | 'completed' | 'paused'
}

export interface UserStats {
  totalCheckIns: number
  currentStreak: number
  longestStreak: number
  completedChallenges: number
  averageMood: number
  lastActive: string
}

/**
 * Load complete user profile with all settings
 */
export async function loadUserProfile(profileId: string): Promise<UserProfile | null> {
  try {
    const profilePaths = getProfilePaths(profileId)

    // Load profile.md
    const profileData = await loadProfileMd(profilePaths.profile)

    // Load preferences.md
    const preferences = await loadPreferences(path.join(profilePaths.profile, 'preferences.md'))

    // Load availability.md
    const schedule = await loadSchedule(profilePaths.availability)

    // Load active challenges
    const challenges = await loadActiveChallenges(profileId)

    // Calculate stats
    const stats = await calculateUserStats(profileId)

    return {
      id: profileId,
      name: profileData.name || 'User',
      email: profileData.email,
      timezone: profileData.timezone || schedule.timezone,
      preferences: preferences.userPreferences,
      accountability: preferences.accountability,
      communication: preferences.communication,
      schedule,
      challenges,
      stats,
    }
  } catch (error) {
    console.error('Failed to load user profile:', error)
    return null
  }
}

/**
 * Load profile.md file
 */
async function loadProfileMd(profileDir: string): Promise<Record<string, string>> {
  try {
    const profilePath = path.join(profileDir, 'profile.md')
    const content = (await fs.readFile(profilePath, 'utf-8')).replace(/\r\n/g, '\n')

    const result: Record<string, string> = {}

    // Parse key-value pairs from markdown
    const patterns = [
      /\*\*Name:\*\*\s*(.+)/i,
      /\*\*Email:\*\*\s*(.+)/i,
      /\*\*Timezone:\*\*\s*(.+)/i,
      /-\s*\*\*Name:\*\*\s*(.+)/i,
      /-\s*\*\*Email:\*\*\s*(.+)/i,
      /-\s*\*\*Timezone:\*\*\s*(.+)/i,
    ]

    const keys = ['name', 'email', 'timezone', 'name', 'email', 'timezone']

    patterns.forEach((pattern, i) => {
      const match = content.match(pattern)
      if (match) {
        result[keys[i]] = match[1].trim()
      }
    })

    return result
  } catch {
    return {}
  }
}

/**
 * Load preferences.md file
 */
async function loadPreferences(prefsPath: string): Promise<{
  userPreferences: UserPreferences
  accountability: AccountabilitySettings
  communication: CommunicationPreferences
}> {
  const defaults: {
    userPreferences: UserPreferences
    accountability: AccountabilitySettings
    communication: CommunicationPreferences
  } = {
    userPreferences: {
      coachingStyle: 'balanced',
      motivationLevel: 'medium',
      detailLevel: 'detailed',
      preferredTone: 'supportive',
      avoidTopics: [],
      focusAreas: [],
      reminderFrequency: 'moderate',
      celebrateWins: true,
      pushOnMissedDays: true,
    },
    accountability: {
      strictMode: false,
      allowExcuses: true,
      dailyCheckInRequired: false,
      streakImportance: 'medium',
      failureHandling: 'honest',
    },
    communication: {
      messageLength: 'medium',
      useEmoji: false,
      formalityLevel: 'balanced',
      encouragementStyle: 'moderate',
    },
  }

  try {
    const content = (await fs.readFile(prefsPath, 'utf-8')).replace(/\r\n/g, '\n')
    const { data } = matter(content)

    // Merge with defaults
    return {
      userPreferences: { ...defaults.userPreferences, ...data.preferences },
      accountability: { ...defaults.accountability, ...data.accountability },
      communication: { ...defaults.communication, ...data.communication },
    }
  } catch {
    return defaults
  }
}

/**
 * Load schedule/availability settings
 */
async function loadSchedule(availabilityPath: string): Promise<ScheduleSettings> {
  const defaults: ScheduleSettings = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  }

  try {
    const content = (await fs.readFile(availabilityPath, 'utf-8')).replace(/\r\n/g, '\n')

    // Extract timezone
    const tzMatch = content.match(/Timezone[:\s]+([^\n]+)/i)
    if (tzMatch) {
      defaults.timezone = tzMatch[1].trim()
    }

    // Extract preferred check-in time
    const timeMatch = content.match(/Check.?in\s*Time[:\s]+([^\n]+)/i)
    if (timeMatch) {
      defaults.preferredCheckInTime = timeMatch[1].trim()
    }

    return defaults
  } catch {
    return defaults
  }
}

/**
 * Load active challenges for user
 * Reads challenge.md files (not JSON config) from profile-specific directory first
 */
async function loadActiveChallenges(profileId: string): Promise<ChallengeContext[]> {
  const challenges: ChallengeContext[] = []

  // Try profile-specific challenges first, then global
  const profilePaths = getProfilePaths(profileId)
  const challengesDirs = [profilePaths.challenges, path.join(DATA_DIR, 'challenges')]
  const seenIds = new Set<string>()

  for (const challengesDir of challengesDirs) {
    try {
      const folders = await fs.readdir(challengesDir)

      for (const folder of folders) {
        if (seenIds.has(folder)) continue
        seenIds.add(folder)

        try {
          const challengePath = path.join(challengesDir, folder, 'challenge.md')
          const content = (await fs.readFile(challengePath, 'utf-8')).replace(/\r\n/g, '\n')

          // Parse status
          const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/i)
          const status = statusMatch ? statusMatch[1].trim().toLowerCase() : 'unknown'

          if (status === 'active') {
            const nameMatch = content.match(/^#\s+(.+)$/m)
            const startMatch = content.match(/\*\*Start Date:\*\*\s*(.+)/i)
            const currentMatch = content.match(/\*\*Current:\*\*\s*(\d+)/i)
            const bestMatch = content.match(/\*\*Best:\*\*\s*(\d+)/i)
            const progressMatch = content.match(/\*\*Overall:\*\*\s*(\d+)%/i)
            const daysCompletedMatch = content.match(/\*\*Days Completed:\*\*\s*(\d+)\/(\d+)/i)

            const totalDays = daysCompletedMatch ? parseInt(daysCompletedMatch[2]) : 30
            const startDate = startMatch ? startMatch[1].trim() : undefined

            // Calculate current day
            let currentDay = 1
            if (startDate && startDate !== 'dynamic' && startDate !== 'today') {
              const start = new Date(startDate)
              const now = new Date()
              const diff = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
              currentDay = Math.min(Math.max(1, diff), totalDays)
            }

            challenges.push({
              id: folder,
              name: nameMatch ? nameMatch[1].trim() : folder,
              currentDay,
              totalDays,
              streak: currentMatch ? parseInt(currentMatch[1]) : 0,
              progress: progressMatch ? parseInt(progressMatch[1]) : 0,
              status: 'active',
            })
          }
        } catch {
          // Skip invalid folders
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return challenges
}

/**
 * Calculate user statistics
 * Reads challenge.md files from profile-specific directory first
 */
async function calculateUserStats(profileId: string): Promise<UserStats> {
  const stats: UserStats = {
    totalCheckIns: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedChallenges: 0,
    averageMood: 0,
    lastActive: new Date().toISOString(),
  }

  try {
    // Count check-ins
    const profilePaths = getProfilePaths(profileId)
    const checkinsDir = profilePaths.checkins

    try {
      const checkinFiles = await fs.readdir(checkinsDir)
      stats.totalCheckIns = checkinFiles.filter(f => f.endsWith('.md')).length
    } catch {
      // No checkins
    }

    // Get challenge stats - try profile-specific first, then global
    const challengesDirs = [profilePaths.challenges, path.join(DATA_DIR, 'challenges')]
    const seenIds = new Set<string>()

    for (const challengesDir of challengesDirs) {
      try {
        const folders = await fs.readdir(challengesDir)
        for (const folder of folders) {
          if (seenIds.has(folder)) continue
          seenIds.add(folder)

          try {
            const challengePath = path.join(challengesDir, folder, 'challenge.md')
            const content = (await fs.readFile(challengePath, 'utf-8')).replace(/\r\n/g, '\n')

            const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/i)
            const status = statusMatch ? statusMatch[1].trim().toLowerCase() : 'unknown'

            if (status === 'completed') {
              stats.completedChallenges++
            }

            const currentMatch = content.match(/\*\*Current:\*\*\s*(\d+)/i)
            const bestMatch = content.match(/\*\*Best:\*\*\s*(\d+)/i)
            const current = currentMatch ? parseInt(currentMatch[1]) : 0
            const best = bestMatch ? parseInt(bestMatch[1]) : 0

            if (current > stats.currentStreak) {
              stats.currentStreak = current
            }
            if (best > stats.longestStreak) {
              stats.longestStreak = best
            }
          } catch {
            // Skip
          }
        }
      } catch {
        // No challenges
      }
    }
  } catch {
    // Default stats
  }

  return stats
}

/**
 * Build user context for AI prompt
 * This takes priority over default system prompt settings
 */
export function buildUserContext(profile: UserProfile): string {
  let context = `## User Profile Context (HIGH PRIORITY - Override defaults with these)\n\n`

  // Basic info
  context += `**User:** ${profile.name}\n`
  if (profile.timezone) {
    context += `**Timezone:** ${profile.timezone}\n`
  }
  context += '\n'

  // Communication preferences (override defaults)
  context += `### Communication Style (USE THESE SETTINGS)\n`

  switch (profile.preferences.coachingStyle) {
    case 'gentle':
      context += `- Be very gentle and supportive. Avoid pressure.\n`
      break
    case 'tough-love':
      context += `- Be direct and firm. Push for accountability.\n`
      break
    default:
      context += `- Balance support with honest feedback.\n`
  }

  switch (profile.communication.messageLength) {
    case 'short':
      context += `- Keep responses brief and to the point.\n`
      break
    case 'long':
      context += `- Provide detailed, comprehensive responses.\n`
      break
    default:
      context += `- Use moderate-length responses.\n`
  }

  switch (profile.communication.formalityLevel) {
    case 'casual':
      context += `- Use casual, friendly language.\n`
      break
    case 'formal':
      context += `- Maintain professional, formal tone.\n`
      break
    default:
      context += `- Use a balanced, conversational tone.\n`
  }

  if (!profile.communication.useEmoji) {
    context += `- DO NOT use emojis in responses.\n`
  }

  context += '\n'

  // Accountability settings
  context += `### Accountability Approach\n`

  if (profile.accountability.strictMode) {
    context += `- Strict mode enabled. Hold user firmly accountable.\n`
  }

  if (!profile.accountability.allowExcuses) {
    context += `- Don't accept excuses. Focus on solutions.\n`
  }

  switch (profile.accountability.failureHandling) {
    case 'gentle':
      context += `- When user fails, be understanding and supportive.\n`
      break
    case 'firm':
      context += `- When user fails, address it directly but constructively.\n`
      break
    default:
      context += `- When user fails, be honest but not harsh.\n`
  }

  if (profile.preferences.celebrateWins) {
    context += `- Celebrate achievements, no matter how small.\n`
  }

  context += '\n'

  // Topics to avoid
  if (profile.preferences.avoidTopics.length > 0) {
    context += `### Topics to Avoid\n`
    context += profile.preferences.avoidTopics.map(t => `- ${t}`).join('\n')
    context += '\n\n'
  }

  // Focus areas
  if (profile.preferences.focusAreas.length > 0) {
    context += `### Focus Areas (prioritize these)\n`
    context += profile.preferences.focusAreas.map(a => `- ${a}`).join('\n')
    context += '\n\n'
  }

  // Current challenges
  if (profile.challenges.length > 0) {
    context += `### Active Challenges\n`
    for (const challenge of profile.challenges) {
      context += `- **${challenge.name}**: Day ${challenge.currentDay}/${challenge.totalDays}`
      context += ` (${challenge.streak}-day streak, ${challenge.progress}% complete)\n`
    }
    context += '\n'
  }

  // User stats
  context += `### User Stats\n`
  context += `- Total check-ins: ${profile.stats.totalCheckIns}\n`
  context += `- Current streak: ${profile.stats.currentStreak} days\n`
  context += `- Longest streak: ${profile.stats.longestStreak} days\n`
  context += `- Completed challenges: ${profile.stats.completedChallenges}\n`
  context += '\n'

  // Schedule awareness
  if (profile.schedule.preferredCheckInTime) {
    context += `### Schedule\n`
    context += `- Preferred check-in time: ${profile.schedule.preferredCheckInTime}\n`
    context += '\n'
  }

  return context
}

/**
 * Get profile-specific system prompt overrides
 */
export function getProfileOverrides(profile: UserProfile): Record<string, any> {
  return {
    tone: profile.communication.formalityLevel,
    messageLength: profile.communication.messageLength,
    useEmoji: profile.communication.useEmoji,
    coachingStyle: profile.preferences.coachingStyle,
    strictMode: profile.accountability.strictMode,
    celebrateWins: profile.preferences.celebrateWins,
    avoidTopics: profile.preferences.avoidTopics,
    focusAreas: profile.preferences.focusAreas,
  }
}

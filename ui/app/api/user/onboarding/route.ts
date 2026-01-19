import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getProfilePaths, SHARED_PATHS } from '@/lib/paths'

interface OnboardingData {
  name: string
  email: string
  timezone: string
  productiveTime: string
  dailyHours: string
  motivation: string
  accountabilityStyle: string
  bigGoal: string
}

function generateUserId(email: string): string {
  // Create a simple hash-like ID from email
  return email.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

/**
 * GET: Read all onboarding data for a profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    }

    const profilePaths = getProfilePaths(profileId)
    const profileDir = profilePaths.profile

    // Initialize response object
    const onboardingData: Record<string, any> = {
      profileId,
      name: null,
      email: null,
      timezone: null,
      productiveTime: null,
      dailyHours: null,
      accountabilityStyle: null,
      bigGoal: null,
      motivation: null,
      createdAt: null,
      completedAt: null,
      persona: null,
      resolution: null,
      available_slots: [],
      daily_hours: null,
      preferences: {},
    }

    // Read profile.md
    try {
      const profileContent = await fs.readFile(path.join(profileDir, 'profile.md'), 'utf-8')

      const nameMatch = profileContent.match(/\*\*Name:\*\*\s*(.+)/i)
      const emailMatch = profileContent.match(/\*\*Email:\*\*\s*(.+)/i)
      const timezoneMatch = profileContent.match(/\*\*Timezone:\*\*\s*(.+)/i)
      const createdMatch = profileContent.match(/\*\*Created:\*\*\s*(.+)/i)
      const onboardingMatch = profileContent.match(/\*\*Onboarding Completed:\*\*\s*(.+)/i)
      const bigGoalMatch = profileContent.match(/Big goal:\s*(.+)/i)

      onboardingData.name = nameMatch ? nameMatch[1].trim() : null
      onboardingData.email = emailMatch ? emailMatch[1].trim() : null
      onboardingData.timezone = timezoneMatch ? timezoneMatch[1].trim() : null
      onboardingData.createdAt = createdMatch ? createdMatch[1].trim() : null
      onboardingData.bigGoal = bigGoalMatch ? bigGoalMatch[1].trim() : null

      if (onboardingMatch && onboardingMatch[1].trim().toLowerCase() === 'true') {
        onboardingData.completedAt = onboardingData.createdAt
      }
    } catch {
      // profile.md doesn't exist
    }

    // Read availability.md
    try {
      const availContent = await fs.readFile(path.join(profileDir, 'availability.md'), 'utf-8')

      const peakHoursMatch = availContent.match(/\*\*Peak Hours:\*\*\s*(.+)/i)
      const dailyCapacityMatch = availContent.match(/\*\*Daily Capacity:\*\*\s*(.+)/i)

      onboardingData.productiveTime = peakHoursMatch ? peakHoursMatch[1].trim() : null
      onboardingData.dailyHours = dailyCapacityMatch ? dailyCapacityMatch[1].trim() : null
      onboardingData.daily_hours = dailyCapacityMatch ? dailyCapacityMatch[1].trim() : null

      // Parse weekly schedule
      const scheduleMatch = availContent.match(/## Weekly Schedule\n\|([\s\S]+?)(?:\n\n|$)/)
      if (scheduleMatch) {
        const rows = scheduleMatch[1].split('\n').filter(row => row.includes('|'))
        const availableDays: string[] = []
        rows.forEach(row => {
          const cells = row.split('|').map(c => c.trim()).filter(c => c)
          if (cells.length >= 2 && cells[1].toLowerCase() === 'yes') {
            availableDays.push(cells[0])
          }
        })
        onboardingData.availableDays = availableDays
      }
    } catch {
      // availability.md doesn't exist
    }

    // Read preferences.md
    try {
      const prefsContent = await fs.readFile(path.join(profileDir, 'preferences.md'), 'utf-8')

      const styleMatch = prefsContent.match(/\*\*Type:\*\*\s*(.+)/i)
      const frequencyMatch = prefsContent.match(/\*\*Check-in Frequency:\*\*\s*(.+)/i)
      const reminderToneMatch = prefsContent.match(/\*\*Reminder Tone:\*\*\s*(.+)/i)
      const dailyCheckinMatch = prefsContent.match(/\*\*Daily Check-in:\*\*\s*(.+)/i)
      const streakAlertsMatch = prefsContent.match(/\*\*Streak Alerts:\*\*\s*(.+)/i)

      onboardingData.accountabilityStyle = styleMatch ? styleMatch[1].trim() : null
      onboardingData.persona = styleMatch ? styleMatch[1].trim().toLowerCase() : null

      onboardingData.preferences = {
        checkInFrequency: frequencyMatch ? frequencyMatch[1].trim() : 'Daily',
        reminderTone: reminderToneMatch ? reminderToneMatch[1].trim() : null,
        dailyCheckinTime: dailyCheckinMatch ? dailyCheckinMatch[1].trim() : null,
        streakAlerts: streakAlertsMatch ? streakAlertsMatch[1].trim().toLowerCase() === 'enabled' : true,
      }
    } catch {
      // preferences.md doesn't exist
    }

    // Read motivation-triggers.md
    try {
      const motivationContent = await fs.readFile(path.join(profileDir, 'motivation-triggers.md'), 'utf-8')

      const whatWorksMatch = motivationContent.match(/## What Works\n-\s*(.+)/i)
      const currentGoalMatch = motivationContent.match(/## Current Big Goal\n(.+)/i)

      onboardingData.motivation = whatWorksMatch ? whatWorksMatch[1].trim() : null
      if (!onboardingData.bigGoal && currentGoalMatch) {
        onboardingData.bigGoal = currentGoalMatch[1].trim()
      }
    } catch {
      // motivation-triggers.md doesn't exist
    }

    // Read resolution.md if exists
    try {
      const resolutionContent = await fs.readFile(path.join(profileDir, 'resolution.md'), 'utf-8')

      const resolutionMatch = resolutionContent.match(/## Resolution\n(.+)/i)
      onboardingData.resolution = resolutionMatch ? resolutionMatch[1].trim() : null
    } catch {
      // resolution.md doesn't exist
    }

    return NextResponse.json(onboardingData)
  } catch (error) {
    console.error('Error reading onboarding data:', error)
    return NextResponse.json({ error: 'Failed to read onboarding data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: OnboardingData = await request.json()

    // Generate user ID from email
    const userId = generateUserId(data.email)

    // Get profile-specific paths
    const profilePaths = getProfilePaths(userId)
    const profileDir = profilePaths.profile
    await fs.mkdir(profileDir, { recursive: true })

    const profileMdPath = path.join(profileDir, 'profile.md')

    // Check if profile already exists
    try {
      const existingContent = await fs.readFile(profileMdPath, 'utf-8')
      const emailMatch = existingContent.match(/\*\*Email:\*\*\s*(.+)/i)
      const existingEmail = emailMatch ? emailMatch[1].trim() : null

      if (existingEmail === data.email) {
        return NextResponse.json({
          success: true,
          existingUser: true,
          userId,
          message: 'Welcome back! Your profile has been updated.'
        })
      }
    } catch {
      // No existing profile, continue with new user creation
    }

    // Create all profile subdirectories
    await fs.mkdir(profilePaths.challenges, { recursive: true })
    await fs.mkdir(profilePaths.todos, { recursive: true })
    await fs.mkdir(profilePaths.chats, { recursive: true })
    await fs.mkdir(profilePaths.checkins, { recursive: true })
    await fs.mkdir(profilePaths.visionboards, { recursive: true })
    await fs.mkdir(profilePaths.schedule, { recursive: true })
    await fs.mkdir(profilePaths.contracts, { recursive: true })
    await fs.mkdir(profilePaths.punishments, { recursive: true })

    // Create profile.md
    const profileContent = `# User Profile

- **Name:** ${data.name}
- **Email:** ${data.email}
- **User ID:** ${userId}
- **Timezone:** ${data.timezone}
- **Created:** ${new Date().toISOString().split('T')[0]}
- **Onboarding Completed:** true

## About
Big goal: ${data.bigGoal}
`
    await fs.writeFile(profileMdPath, profileContent)

    // Create availability.md
    const productiveLabels: Record<string, string> = {
      early_morning: 'Early morning (5-9am)',
      morning: 'Morning (9am-12pm)',
      afternoon: 'Afternoon (12-5pm)',
      evening: 'Evening (5-9pm)',
      night: 'Night (9pm+)',
    }

    const availabilityContent = `# Availability

## Productivity Pattern
- **Peak Hours:** ${productiveLabels[data.productiveTime] || data.productiveTime}
- **Daily Capacity:** ${data.dailyHours} hours
- **Timezone:** ${data.timezone}

## Weekly Schedule
| Day | Available | Notes |
|-----|-----------|-------|
| Mon | Yes | |
| Tue | Yes | |
| Wed | Yes | |
| Thu | Yes | |
| Fri | Flexible | |
| Sat | Yes | |
| Sun | Yes | |
`
    await fs.writeFile(path.join(profileDir, 'availability.md'), availabilityContent)

    // Create preferences.md
    const styleLabels: Record<string, string> = {
      tough: 'Tough Love',
      balanced: 'Balanced',
      gentle: 'Gentle',
    }

    const preferencesContent = `# Preferences

## Accountability Style
- **Type:** ${styleLabels[data.accountabilityStyle] || data.accountabilityStyle}
- **Check-in Frequency:** Daily
- **Reminder Tone:** ${data.accountabilityStyle === 'tough' ? 'Direct and challenging' : data.accountabilityStyle === 'gentle' ? 'Warm and supportive' : 'Firm but encouraging'}

## Communication
- **Preferred:** Short, actionable messages
- **Celebrations:** Brief acknowledgment
- **Missed Goals:** ${data.accountabilityStyle === 'tough' ? 'Call out directly' : 'Encourage recommitment'}

## Notifications
- **Daily Check-in:** ${data.productiveTime === 'night' ? '9:00 PM' : data.productiveTime === 'evening' ? '7:00 PM' : '8:00 AM'}
- **Streak Alerts:** Enabled
`
    await fs.writeFile(path.join(profileDir, 'preferences.md'), preferencesContent)

    // Create motivation-triggers.md
    const motivationLabels: Record<string, string> = {
      progress: 'Visible progress tracking',
      deadlines: 'Deadline pressure',
      accountability: 'External accountability',
      rewards: 'Rewards and treats',
    }

    const motivationContent = `# Motivation Triggers

## What Works
- ${motivationLabels[data.motivation] || data.motivation}

## Current Big Goal
${data.bigGoal}

## Notes
User prefers ${styleLabels[data.accountabilityStyle]} accountability style.
Most productive during ${productiveLabels[data.productiveTime]}.
`
    await fs.writeFile(path.join(profileDir, 'motivation-triggers.md'), motivationContent)

    // Add profile to registry via profiles API
    try {
      await fetch('http://localhost:3000/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: data.name,
          email: data.email,
        }),
      })
    } catch (error) {
      console.error('Failed to add profile to registry:', error)
    }

    // Set as active profile
    // Note: This will be set by the frontend after redirect

    return NextResponse.json({
      success: true,
      existingUser: false,
      userId,
      message: 'Welcome! Your profile has been created.'
    })
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 })
  }
}

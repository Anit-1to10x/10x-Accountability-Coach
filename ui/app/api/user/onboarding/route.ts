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

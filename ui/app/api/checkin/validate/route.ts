import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

interface CheckinValidationResult {
  allowed: boolean
  requiresAIAcceptance: boolean
  alreadyCheckedIn: boolean
  message: string
  hoursLate?: number
  lastCheckinDate?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { challengeId, aiAccepted } = body

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Missing challengeId' },
        { status: 400 }
      )
    }

    // Read challenge file to check last check-in
    const challengeFile = path.join(PATHS.challenges, challengeId, 'challenge.md')
    let content: string

    try {
      content = await fs.readFile(challengeFile, 'utf-8')
    } catch (error) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Extract last check-in date
    const lastCheckinMatch = content.match(/Last Check-in:\*\*\s*(.+)/i)
    const lastCheckin = lastCheckinMatch ? lastCheckinMatch[1].trim() : 'None'

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentHour = now.getHours()

    // Check if already checked in today
    if (lastCheckin === today) {
      return NextResponse.json<CheckinValidationResult>({
        allowed: false,
        requiresAIAcceptance: false,
        alreadyCheckedIn: true,
        message: 'You have already checked in today. Check-ins are limited to once per day.',
        lastCheckinDate: lastCheckin
      })
    }

    // Calculate if this is a late check-in
    // Consider "late" if checking in after expected time window
    // For example: if it's past midnight and they're checking in for "yesterday"
    let isLate = false
    let hoursLate = 0

    if (lastCheckin !== 'None') {
      const lastDate = new Date(lastCheckin)
      const daysSinceLastCheckin = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      // If more than 1 day has passed, it's late
      if (daysSinceLastCheckin > 1) {
        isLate = true
        hoursLate = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60))
      }
    }

    // Also consider late if checking in very late at night (after 11 PM)
    // This prevents gaming the system by checking in just before midnight
    if (currentHour >= 23 || currentHour < 4) {
      isLate = true
      if (currentHour >= 23) {
        hoursLate = currentHour - 21 // Hours past 9 PM (reasonable check-in cutoff)
      } else {
        hoursLate = (23 - 21) + (currentHour + 1) // Past midnight hours
      }
    }

    // If late and AI acceptance not yet provided, require it
    if (isLate && !aiAccepted) {
      return NextResponse.json<CheckinValidationResult>({
        allowed: false,
        requiresAIAcceptance: true,
        alreadyCheckedIn: false,
        message: 'This check-in is late. Please confirm you actually completed the tasks.',
        hoursLate,
        lastCheckinDate: lastCheckin !== 'None' ? lastCheckin : undefined
      })
    }

    // If late but AI accepted, or if not late, allow check-in
    return NextResponse.json<CheckinValidationResult>({
      allowed: true,
      requiresAIAcceptance: false,
      alreadyCheckedIn: false,
      message: isLate ? 'Late check-in accepted with AI confirmation' : 'Check-in allowed',
      hoursLate: isLate ? hoursLate : undefined,
      lastCheckinDate: lastCheckin !== 'None' ? lastCheckin : undefined
    })

  } catch (error: any) {
    console.error('Error validating check-in:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

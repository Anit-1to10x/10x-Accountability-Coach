import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

const AVAILABILITY_FILE = path.join(PATHS.profile, 'availability.md')

// GET: Read user availability preferences
export async function GET() {
  try {
    const content = await fs.readFile(AVAILABILITY_FILE, 'utf-8')

    // Parse availability data
    const slotsMatch = content.match(/## Available Time Slots\n\n([\s\S]+?)(?:\n##|$)/)
    const hoursMatch = content.match(/## Daily Hours\n\n\*\*Total available:\*\* (.+) hours/)
    const preferencesMatch = content.match(/## Preferences\n\n([\s\S]+?)(?:\n##|$)/)

    const availableSlots = slotsMatch
      ? slotsMatch[1]
          .split('\n')
          .filter((line) => line.trim().startsWith('-'))
          .map((line) => line.replace(/^-\s*/, '').trim())
      : []

    const dailyHours = hoursMatch ? parseFloat(hoursMatch[1]) : 0

    const preferences: Record<string, any> = {}
    if (preferencesMatch) {
      const prefLines = preferencesMatch[1].split('\n').filter((line) => line.includes(':'))
      prefLines.forEach((line) => {
        const [key, value] = line.split(':').map((s) => s.trim())
        if (key && value) {
          preferences[key.replace(/^-\s*\*\*/, '').replace(/\*\*$/, '')] = value
        }
      })
    }

    return NextResponse.json({
      availableSlots,
      dailyHours,
      preferences,
      hasAvailability: availableSlots.length > 0,
    })
  } catch (error) {
    // File doesn't exist - return defaults
    return NextResponse.json({
      availableSlots: [],
      dailyHours: 0,
      preferences: {},
      hasAvailability: false,
    })
  }
}

// POST: Save user availability preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { availableSlots, dailyHours, preferences } = body

    if (!availableSlots || !Array.isArray(availableSlots)) {
      return NextResponse.json(
        { error: 'availableSlots array is required' },
        { status: 400 }
      )
    }

    // Ensure profile directory exists
    await fs.mkdir(path.dirname(AVAILABILITY_FILE), { recursive: true })

    // Create availability file
    const content = `# User Availability

**Last updated:** ${new Date().toISOString().split('T')[0]}

## Available Time Slots

${availableSlots.map((slot) => `- ${slot}`).join('\n')}

## Daily Hours

**Total available:** ${dailyHours || 0} hours per day

## Preferences

${Object.entries(preferences || {})
  .map(([key, value]) => `- **${key}:** ${value}`)
  .join('\n')}

---

This profile helps the system schedule your tasks and challenges optimally.
`

    await fs.writeFile(AVAILABILITY_FILE, content, 'utf-8')

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file_created',
          data: {
            filePath: 'profile/availability.md',
            purpose: 'User availability preferences',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      availableSlots,
      dailyHours,
    })
  } catch (error: any) {
    console.error('Failed to save availability:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update existing availability
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { availableSlots, dailyHours, preferences } = body

    // Read existing file to preserve data
    let existingSlots: string[] = []
    let existingHours = 0
    let existingPreferences: Record<string, any> = {}

    try {
      const existingContent = await fs.readFile(AVAILABILITY_FILE, 'utf-8')

      const slotsMatch = existingContent.match(/## Available Time Slots\n\n([\s\S]+?)(?:\n##|$)/)
      if (slotsMatch) {
        existingSlots = slotsMatch[1]
          .split('\n')
          .filter((line) => line.trim().startsWith('-'))
          .map((line) => line.replace(/^-\s*/, '').trim())
      }

      const hoursMatch = existingContent.match(/\*\*Total available:\*\* (.+) hours/)
      if (hoursMatch) existingHours = parseFloat(hoursMatch[1])
    } catch {
      // File doesn't exist, use defaults
    }

    // Merge with new data
    const updatedSlots = availableSlots || existingSlots
    const updatedHours = dailyHours !== undefined ? dailyHours : existingHours
    const updatedPreferences = { ...existingPreferences, ...preferences }

    // Update availability
    const content = `# User Availability

**Last updated:** ${new Date().toISOString().split('T')[0]}

## Available Time Slots

${updatedSlots.map((slot: string) => `- ${slot}`).join('\n')}

## Daily Hours

**Total available:** ${updatedHours} hours per day

## Preferences

${Object.entries(updatedPreferences)
  .map(([key, value]) => `- **${key}:** ${value}`)
  .join('\n')}

---

This profile helps the system schedule your tasks and challenges optimally.
`

    await fs.writeFile(AVAILABILITY_FILE, content, 'utf-8')

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file_modified',
          data: {
            filePath: 'profile/availability.md',
            changes: 'Updated availability preferences',
            date: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      availableSlots: updatedSlots,
      dailyHours: updatedHours,
    })
  } catch (error: any) {
    console.error('Failed to update availability:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

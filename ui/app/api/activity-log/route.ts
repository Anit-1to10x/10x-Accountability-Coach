import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { PATHS } from '@/lib/paths'

const ACTIVITY_FILE = path.join(PATHS.profile, 'activity-log.md')

interface Activity {
  id: string
  action: string
  description: string
  timestamp: string
  type: 'checkin' | 'todo_complete' | 'streak_update' | 'challenge_start' | 'chat' | 'skill_used'
  metadata?: Record<string, any>
}

// Parse MD file to extract activities
function parseActivitiesMd(content: string): Activity[] {
  const activities: Activity[] = []
  const sections = content.split(/^## /m).slice(1) // Skip header

  for (const section of sections) {
    const lines = section.split('\n')
    const titleMatch = lines[0]?.match(/(.+?)\s*-\s*(.+)/)

    if (!titleMatch) continue

    const activity: any = {
      id: '',
      action: titleMatch[1].trim(),
      description: '',
      timestamp: '',
      type: 'chat'
    }

    for (const line of lines) {
      const match = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/i)
      if (match) {
        const key = match[1].toLowerCase().replace(/\s+/g, '_')
        const value = match[2].trim()

        if (key === 'id') activity.id = value
        else if (key === 'description') activity.description = value
        else if (key === 'timestamp') activity.timestamp = value
        else if (key === 'type') activity.type = value
        else if (key === 'metadata') {
          try {
            activity.metadata = JSON.parse(value)
          } catch {
            activity.metadata = {}
          }
        }
      }
    }

    if (activity.id) {
      activities.push(activity)
    }
  }

  return activities
}

async function loadActivityFile(): Promise<Activity[]> {
  try {
    await fs.access(ACTIVITY_FILE)
    const content = await fs.readFile(ACTIVITY_FILE, 'utf-8')
    return parseActivitiesMd(content)
  } catch {
    // No activity file exists yet - return empty array
    // Activities will be created when real actions happen
    return []
  }
}

export async function GET() {
  try {
    const activities = await loadActivityFile()

    // Sort by timestamp descending (most recent first)
    const sortedActivities = activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json({
      activities: sortedActivities,
      count: sortedActivities.length
    })
  } catch (error) {
    console.error('Error loading activity log:', error)
    return NextResponse.json({ activities: [], count: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, description, type, metadata } = body

    if (!action || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: action, description, type' },
        { status: 400 }
      )
    }

    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      action,
      description,
      timestamp: new Date().toISOString(),
      type,
      metadata
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(ACTIVITY_FILE), { recursive: true })

    // Read existing content or create header
    let content = ''
    try {
      content = await fs.readFile(ACTIVITY_FILE, 'utf-8')
    } catch {
      content = `# Activity Log

`
    }

    // Append new activity (prepend to show most recent first)
    const activityEntry = `## ${action} - ${new Date(newActivity.timestamp).toLocaleString()}
- **ID:** ${newActivity.id}
- **Description:** ${description}
- **Timestamp:** ${newActivity.timestamp}
- **Type:** ${type}
${metadata ? `- **Metadata:** ${JSON.stringify(metadata)}` : ''}

`

    // Insert after header (keep most recent at top)
    const headerEnd = content.indexOf('\n\n') + 2
    content = content.slice(0, headerEnd) + activityEntry + content.slice(headerEnd)

    // Keep only last 100 activities (count ## sections, keep first 100)
    const sections = content.split(/^## /m)
    if (sections.length > 101) { // +1 for header
      const kept = sections.slice(0, 101)
      content = kept[0] + '## ' + kept.slice(1).join('## ')
    }

    await fs.writeFile(ACTIVITY_FILE, content, 'utf-8')

    return NextResponse.json({
      activity: newActivity,
      success: true
    })
  } catch (error) {
    console.error('Error saving activity:', error)
    return NextResponse.json(
      { error: 'Failed to save activity' },
      { status: 500 }
    )
  }
}

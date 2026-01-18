import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

// Parse a daily MD file to extract activity data
function parseDayFile(content: string, filename: string, dayNumber: number) {
  // Extract day number from filename like "day-01.md" or use provided number
  const fileDay = filename.match(/day-(\d+)\.md/i)?.[1]
  const actualDay = fileDay ? parseInt(fileDay) : dayNumber

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+Day\s+\d+\s+-\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : `Day ${actualDay}`

  const activity: any = {
    date: filename.replace('.md', ''),
    day: actualDay,
    title,
    status: 'pending',
    timeSpent: '',
    tasks: [],
    topics: [],
    quickWin: '',
    totalMinutes: 0,
    mood: '',
    blockers: '',
    reflection: '',
  }

  // Check status
  if (content.includes('Status: completed') || content.includes('Completed:** Yes')) {
    activity.status = 'completed'
  } else if (content.includes('Status: missed')) {
    activity.status = 'missed'
  }

  // Extract time spent
  const timeMatch = content.match(/Time Spent:\*\*\s*(.+)/i)
  if (timeMatch) activity.timeSpent = timeMatch[1].trim()

  // Extract total minutes
  const totalMatch = content.match(/Total:\*\*\s*(\d+)/i)
  if (totalMatch) activity.totalMinutes = parseInt(totalMatch[1])

  // Extract mood
  const moodMatch = content.match(/Mood:\*\*\s*(.+)/i)
  if (moodMatch) activity.mood = moodMatch[1].trim()

  // Extract blockers
  const blockerMatch = content.match(/Blockers:\*\*\s*(.+)/i)
  if (blockerMatch) activity.blockers = blockerMatch[1].trim()

  // Extract quick win
  const quickWinMatch = content.match(/## Quick Win\n+([^\n#]+)/i)
  if (quickWinMatch) activity.quickWin = quickWinMatch[1].trim()

  // Extract tasks (checkboxes)
  const taskMatches = Array.from(content.matchAll(/- \[([ x])\]\s*(.+)/gi))
  for (const match of taskMatches) {
    activity.tasks.push({
      completed: match[1].toLowerCase() === 'x',
      text: match[2].trim()
    })
  }

  // Extract topics
  const topicsSection = content.match(/## Topics\n([\s\S]*?)(?=\n##|$)/i)
  if (topicsSection) {
    const topicMatches = Array.from(topicsSection[1].matchAll(/^-\s+(.+)$/gm))
    for (const match of topicMatches) {
      activity.topics.push(match[1].trim())
    }
  }

  return activity
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const challengeDir = path.join(PATHS.challenges, challengeId)
    const activities: any[] = []

    // Try to read from days/ folder first (new format)
    const daysDir = path.join(challengeDir, 'days')
    const dailyDir = path.join(challengeDir, 'daily')

    let actualDaysDir: string | null = null
    try {
      await fs.access(daysDir)
      actualDaysDir = daysDir
    } catch {
      try {
        await fs.access(dailyDir)
        actualDaysDir = dailyDir
      } catch {}
    }

    if (actualDaysDir) {
      // Read all day files
      const files = await fs.readdir(actualDaysDir)
      const dayFiles = files.filter(f => f.endsWith('.md')).sort()

      for (let i = 0; i < dayFiles.length; i++) {
        const filename = dayFiles[i]
        const filePath = path.join(actualDaysDir, filename)
        const content = await fs.readFile(filePath, 'utf-8')
        const activity = parseDayFile(content, filename, i + 1)
        activities.push(activity)
      }
    }

    // Also try to read from activity-log.md (legacy format)
    const activityLogPath = path.join(challengeDir, 'activity-log.md')
    let legacyContent = ''

    try {
      legacyContent = await fs.readFile(activityLogPath, 'utf-8')

      // Parse legacy format if no days were found
      if (activities.length === 0) {
        const lines = legacyContent.split('\n')
        let currentActivity: any = null

        for (const line of lines) {
          const dateMatch = line.match(/^### (\d{4}-\d{2}-\d{2}) \(Day (\d+)\) (.+)/)
          if (dateMatch) {
            if (currentActivity) {
              activities.push(currentActivity)
            }
            currentActivity = {
              date: dateMatch[1],
              day: parseInt(dateMatch[2]),
              status: dateMatch[3].includes('✅') ? 'completed' :
                      dateMatch[3].includes('❌') ? 'missed' : 'pending',
              timeSpent: '',
              tasks: [],
              mood: '',
              streak: 0,
            }
          }

          if (line.startsWith('**Time Spent:**') && currentActivity) {
            const timeMatch = line.match(/\*\*Time Spent:\*\* (.+)/)
            if (timeMatch) currentActivity.timeSpent = timeMatch[1]
          }

          if (line.includes('**Streak:**') && currentActivity) {
            const streakMatch = line.match(/\*\*Streak:\*\* (\d+)/)
            if (streakMatch) currentActivity.streak = parseInt(streakMatch[1])
          }
        }

        if (currentActivity) {
          activities.push(currentActivity)
        }
      }
    } catch {}

    return NextResponse.json({
      content: legacyContent,
      activities,
      daysFolder: actualDaysDir ? true : false,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error reading activity log:', error)
    return NextResponse.json(
      { error: 'Failed to read activity log', content: '', activities: [] },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const { content } = await request.json()

    const activityLogPath = path.join(
      PATHS.challenges,
      challengeId,
      'activity-log.md'
    )

    await fs.writeFile(activityLogPath, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating activity log:', error)
    return NextResponse.json(
      { error: 'Failed to update activity log' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, getProfilePaths } from '@/lib/paths'
import { getTodayString, addDays, toDateString } from '@/lib/datetime'

// Parse tasks from a challenge day file
function parseTasksFromDayMd(content: string, challengeId: string, challengeName: string, dayNum: number): any[] {
  const tasks: any[] = []

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+Day\s+\d+\s+-\s+(.+)$/m)
  const dayTitle = titleMatch ? titleMatch[1].trim() : `Day ${dayNum}`

  const lines = content.split('\n')
  let taskIndex = 0

  for (const line of lines) {
    // Match checkbox task
    const taskMatch = line.match(/^- \[([ xX])\]\s*(.+)$/)
    if (taskMatch) {
      const completed = taskMatch[1].toLowerCase() === 'x'
      let title = taskMatch[2].trim()

      // Extract time slot if present (e.g., "Task name (9:00 AM - 10:00 AM)")
      const timeMatch = title.match(/\((\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\)/)
      let startTime = ''
      let endTime = ''
      if (timeMatch) {
        startTime = timeMatch[1]
        endTime = timeMatch[2]
      }

      tasks.push({
        id: `${challengeId}-day${dayNum}-task${taskIndex}`,
        title,
        challengeId,
        challengeName,
        day: dayNum,
        dayTitle,
        completed,
        status: completed ? 'completed' : 'pending',
        startTime,
        endTime,
      })
      taskIndex++
    }
  }

  return tasks
}

// Sync challenge tasks to user's active.md
async function syncChallengeTodosToProfile(
  challengeId: string,
  challengeName: string,
  daysDir: string,
  profileId: string | null,
  dayNum: number = 1
): Promise<{ synced: number; tasks: any[] }> {
  const tasks: any[] = []

  // Read the specified day file
  const dayFile = path.join(daysDir, `day-${String(dayNum).padStart(2, '0')}.md`)
  try {
    const dayContent = await fs.readFile(dayFile, 'utf-8')
    const dayTasks = parseTasksFromDayMd(dayContent, challengeId, challengeName, dayNum)
    tasks.push(...dayTasks)
  } catch {
    // Try alternate format (day-1.md without padding)
    try {
      const altDayFile = path.join(daysDir, `day-${dayNum}.md`)
      const dayContent = await fs.readFile(altDayFile, 'utf-8')
      const dayTasks = parseTasksFromDayMd(dayContent, challengeId, challengeName, dayNum)
      tasks.push(...dayTasks)
    } catch {
      console.log(`No day ${dayNum} file found for challenge ${challengeId}`)
    }
  }

  if (tasks.length === 0) {
    return { synced: 0, tasks: [] }
  }

  // Get the todos directory
  const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos
  const activeFile = path.join(todosDir, 'active.md')

  // Ensure directory exists
  await fs.mkdir(todosDir, { recursive: true })

  // Read existing active.md or create new
  let mdContent = ''
  const today = getTodayString()

  try {
    mdContent = await fs.readFile(activeFile, 'utf-8')
  } catch {
    // Create default structure
    mdContent = `# Tasks\n\n## Today (${today})\n`
  }

  // Check if challenge section already exists
  const challengeSectionPattern = new RegExp(`^###\\s+${challengeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'mi')
  const hasSection = challengeSectionPattern.test(mdContent)

  if (!hasSection) {
    // Add new section for this challenge
    const lines = mdContent.split('\n')

    // Find where to insert (after ## Today section header or at end)
    let insertIndex = lines.findIndex(line => line.match(/^##\s+Today/i))
    if (insertIndex === -1) {
      // No Today section, add one
      lines.push(`\n## Today (${today})`)
      insertIndex = lines.length
    } else {
      // Move past the Today header
      insertIndex++
    }

    // Build the challenge section
    const challengeSection = [
      '',
      `### ${challengeName}`,
      ...tasks.map(task => `- [ ] ${task.title}`),
      ''
    ]

    // Insert the section
    lines.splice(insertIndex, 0, ...challengeSection)
    mdContent = lines.join('\n')

    // Write updated file
    await fs.writeFile(activeFile, mdContent, 'utf-8')
  }

  return { synced: tasks.length, tasks }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const body = await request.json()
    const { status, profileId: bodyProfileId } = body

    // Get profileId from body, query, or header
    const { searchParams } = new URL(request.url)
    const profileId = bodyProfileId || searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    // Validate status
    const validStatuses = ['active', 'paused', 'completed', 'failed', 'pending', 'upcoming']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Use profile-specific challenge dir if profileId provided
    let baseChallengesDir = PATHS.challenges
    if (profileId) {
      const profileChallengesDir = getProfilePaths(profileId).challenges
      try {
        await fs.access(path.join(profileChallengesDir, challengeId))
        baseChallengesDir = profileChallengesDir
      } catch {
        // Fall back to global
      }
    }
    const challengeDir = path.join(baseChallengesDir, challengeId)
    const challengeMdPath = path.join(challengeDir, 'challenge.md')
    const daysDir = path.join(challengeDir, 'days')

    // Read current challenge.md
    let content: string
    try {
      content = (await fs.readFile(challengeMdPath, 'utf-8')).replace(/\r\n/g, '\n')
    } catch {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Extract challenge name
    const nameMatch = content.match(/^#\s+(.+)$/m)
    const challengeName = nameMatch ? nameMatch[1].trim() : challengeId

    // Get previous status
    const prevStatusMatch = content.match(/-\s*\*\*Status:\*\*\s*(\w+)/i)
    const previousStatus = prevStatusMatch ? prevStatusMatch[1].toLowerCase() : 'pending'

    // Update status in challenge.md
    // Look for "- **Status:** xxx" pattern
    const statusPattern = /(-\s*\*\*Status:\*\*\s*)(\w+)/i
    if (statusPattern.test(content)) {
      content = content.replace(statusPattern, `$1${status}`)
    } else {
      // If no status line exists, add it after ID line
      const idPattern = /(-\s*\*\*ID:\*\*\s*.+)/i
      if (idPattern.test(content)) {
        content = content.replace(idPattern, `$1\n- **Status:** ${status}`)
      }
    }

    // When activating a challenge, resolve dynamic/today dates to actual dates
    if (status === 'active') {
      const startMatch = content.match(/-\s*\*\*Start Date:\*\*\s*(.+)/i)
      const targetMatch = content.match(/-\s*\*\*Target Date:\*\*\s*(.+)/i)
      const currentStart = startMatch ? startMatch[1].trim() : ''
      const currentTarget = targetMatch ? targetMatch[1].trim() : ''
      const needsStartDate = currentStart === 'today' || currentStart === 'dynamic' || !currentStart

      if (needsStartDate) {
        const todayStr = getTodayString()

        // Count total days from days/ folder
        let totalDays = 30
        try {
          const dayFiles = await fs.readdir(daysDir)
          totalDays = dayFiles.filter(f => f.endsWith('.md')).length || 30
        } catch {}

        const endStr = addDays(todayStr, totalDays - 1)

        content = content.replace(
          /(-\s*\*\*Start Date:\*\*\s*).+/i,
          `$1${todayStr}`
        )
        // Only replace target date if it's also dynamic/auto
        if (currentTarget === 'auto' || currentTarget === 'dynamic' || !currentTarget) {
          content = content.replace(
            /(-\s*\*\*Target Date:\*\*\s*).+/i,
            `$1${endStr}`
          )
        }
      }
    }

    // Write updated content
    await fs.writeFile(challengeMdPath, content, 'utf-8')

    // AUTO-CREATE TODOS: When activating a challenge, sync day 1 tasks to user's todos
    let syncedTodos = { synced: 0, tasks: [] as any[] }
    if (status === 'active' && previousStatus !== 'active') {
      try {
        // Check if days folder exists
        await fs.access(daysDir)
        syncedTodos = await syncChallengeTodosToProfile(challengeId, challengeName, daysDir, profileId, 1)
      } catch (err) {
        console.log('No days folder found or sync failed:', err)
      }
    }

    // Log the status change to activity log
    const activityLogPath = path.join(challengeDir, 'activity-log.md')
    const timestamp = new Date().toISOString()
    const syncInfo = syncedTodos.synced > 0 ? `\n- Synced ${syncedTodos.synced} todos to active tasks` : ''
    const logEntry = `\n## ${timestamp.split('T')[0]} - Status Changed\n- Changed status from ${previousStatus} to: ${status}\n- Timestamp: ${timestamp}${syncInfo}\n`

    try {
      let activityLog = ''
      try {
        activityLog = await fs.readFile(activityLogPath, 'utf-8')
      } catch {
        activityLog = `# Activity Log - ${challengeId}\n\nAll status changes and activities are recorded here.\n`
      }
      await fs.writeFile(activityLogPath, activityLog + logEntry, 'utf-8')
    } catch (err) {
      console.error('Failed to update activity log:', err)
    }

    return NextResponse.json({
      success: true,
      status,
      previousStatus,
      message: `Challenge status updated to ${status}`,
      todosCreated: syncedTodos.synced,
      tasks: syncedTodos.tasks
    })
  } catch (error: any) {
    console.error('Failed to update challenge status:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    let baseChallengesDir = PATHS.challenges
    if (profileId) {
      const profileChallengesDir = getProfilePaths(profileId).challenges
      try {
        await fs.access(path.join(profileChallengesDir, challengeId))
        baseChallengesDir = profileChallengesDir
      } catch {}
    }
    const challengeDir = path.join(baseChallengesDir, challengeId)
    const challengeMdPath = path.join(challengeDir, 'challenge.md')

    const content = (await fs.readFile(challengeMdPath, 'utf-8')).replace(/\r\n/g, '\n')

    // Extract status
    const statusMatch = content.match(/-\s*\*\*Status:\*\*\s*(\w+)/i)
    const status = statusMatch ? statusMatch[1].toLowerCase() : 'active'

    return NextResponse.json({ status })
  } catch (error: any) {
    return NextResponse.json(
      { status: 'unknown', error: error.message },
      { status: 500 }
    )
  }
}

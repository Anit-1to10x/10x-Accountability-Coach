import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, getProfilePaths } from '@/lib/paths'

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

// Calculate which day the user should be on based on start date
function calculateCurrentDay(startDateStr: string): number {
  if (!startDateStr) return 1

  const start = new Date(startDateStr)
  const now = new Date()
  const diffTime = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Day 1 is the start date, so add 1
  return Math.max(1, diffDays + 1)
}

/**
 * POST /api/challenges/[id]/sync-todos
 *
 * Syncs tasks from a challenge day to the user's active.md todos file.
 * This is the main endpoint for AI and frontend to create todos from challenges.
 *
 * Body:
 *  - day?: number - Specific day to sync (defaults to current progress day)
 *  - profileId?: string - User profile ID
 *  - replace?: boolean - If true, replace existing challenge section (default: false)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const body = await request.json().catch(() => ({}))
    const { day: requestedDay, replace = false } = body

    // Get profileId from body, query, or header
    const { searchParams } = new URL(request.url)
    const profileId = body.profileId || searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    const challengeDir = path.join(PATHS.challenges, challengeId)
    const challengeMdPath = path.join(challengeDir, 'challenge.md')
    const daysDir = path.join(challengeDir, 'days')

    // Read challenge.md for metadata
    let challengeContent: string
    try {
      challengeContent = (await fs.readFile(challengeMdPath, 'utf-8')).replace(/\r\n/g, '\n')
    } catch {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Extract challenge name
    const nameMatch = challengeContent.match(/^#\s+(.+)$/m)
    const challengeName = nameMatch ? nameMatch[1].trim() : challengeId

    // Extract start date to calculate current day
    const startDateMatch = challengeContent.match(/\*\*Start Date:\*\*\s*(.+)/i)
    const startDateStr = startDateMatch ? startDateMatch[1].trim() : ''

    // Determine which day to sync
    const currentProgressDay = calculateCurrentDay(startDateStr)
    const dayNum = requestedDay || currentProgressDay

    // Check if days folder exists
    try {
      await fs.access(daysDir)
    } catch {
      return NextResponse.json(
        { success: false, error: 'No days folder found for this challenge' },
        { status: 404 }
      )
    }

    // Try to read the day file
    let dayContent = ''
    const paddedDay = String(dayNum).padStart(2, '0')

    // Try different file naming conventions
    const possibleFiles = [
      path.join(daysDir, `day-${paddedDay}.md`),
      path.join(daysDir, `day-${dayNum}.md`),
      path.join(daysDir, `day${dayNum}.md`),
    ]

    for (const filePath of possibleFiles) {
      try {
        dayContent = await fs.readFile(filePath, 'utf-8')
        break
      } catch {
        continue
      }
    }

    if (!dayContent) {
      return NextResponse.json(
        { success: false, error: `Day ${dayNum} file not found` },
        { status: 404 }
      )
    }

    // Parse tasks from the day file
    const tasks = parseTasksFromDayMd(dayContent, challengeId, challengeName, dayNum)

    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        day: dayNum,
        message: 'No tasks found in this day file',
        tasks: []
      })
    }

    // Get the todos directory
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos
    const activeFile = path.join(todosDir, 'active.md')

    // Ensure directory exists
    await fs.mkdir(todosDir, { recursive: true })

    // Read existing active.md or create new
    let mdContent = ''
    const today = new Date().toISOString().split('T')[0]

    try {
      mdContent = await fs.readFile(activeFile, 'utf-8')
    } catch {
      // Create default structure
      mdContent = `# Tasks\n\n## Today (${today})\n`
    }

    // Escape special regex characters in challenge name
    const escapedName = challengeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Check if challenge section already exists
    const challengeSectionPattern = new RegExp(`^###\\s+${escapedName}`, 'mi')
    const hasSection = challengeSectionPattern.test(mdContent)

    if (hasSection && !replace) {
      return NextResponse.json({
        success: true,
        synced: 0,
        day: dayNum,
        message: 'Challenge section already exists. Use replace=true to update.',
        tasks: tasks
      })
    }

    const lines = mdContent.split('\n')

    if (hasSection && replace) {
      // Find and replace the existing section
      const sectionStartPattern = new RegExp(`^###\\s+${escapedName}`, 'i')
      let sectionStart = -1
      let sectionEnd = -1

      for (let i = 0; i < lines.length; i++) {
        if (sectionStartPattern.test(lines[i])) {
          sectionStart = i
          // Find the end of this section (next ### or ## or end of file)
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].match(/^##[#]?\s+/)) {
              sectionEnd = j
              break
            }
          }
          if (sectionEnd === -1) sectionEnd = lines.length
          break
        }
      }

      if (sectionStart !== -1) {
        // Build new section
        const newSection = [
          `### ${challengeName} (Day ${dayNum})`,
          ...tasks.map(task => `- [ ] ${task.title}`),
        ]

        // Replace the section
        lines.splice(sectionStart, sectionEnd - sectionStart, ...newSection)
        mdContent = lines.join('\n')
      }
    } else {
      // Add new section for this challenge
      // Find where to insert (after ## Today section header)
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
        `### ${challengeName} (Day ${dayNum})`,
        ...tasks.map(task => `- [ ] ${task.title}`),
        ''
      ]

      // Insert the section
      lines.splice(insertIndex, 0, ...challengeSection)
      mdContent = lines.join('\n')
    }

    // Write updated file
    await fs.writeFile(activeFile, mdContent, 'utf-8')

    return NextResponse.json({
      success: true,
      synced: tasks.length,
      day: dayNum,
      currentProgressDay,
      challengeName,
      message: `Synced ${tasks.length} tasks from Day ${dayNum} to active todos`,
      tasks: tasks
    })
  } catch (error: any) {
    console.error('Failed to sync challenge todos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/challenges/[id]/sync-todos
 *
 * Get current sync status - which day's tasks are in the user's todos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    const challengeDir = path.join(PATHS.challenges, challengeId)
    const challengeMdPath = path.join(challengeDir, 'challenge.md')

    // Read challenge.md for metadata
    let challengeContent: string
    try {
      challengeContent = (await fs.readFile(challengeMdPath, 'utf-8')).replace(/\r\n/g, '\n')
    } catch {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Extract challenge name
    const nameMatch = challengeContent.match(/^#\s+(.+)$/m)
    const challengeName = nameMatch ? nameMatch[1].trim() : challengeId

    // Extract start date to calculate current day
    const startDateMatch = challengeContent.match(/\*\*Start Date:\*\*\s*(.+)/i)
    const startDateStr = startDateMatch ? startDateMatch[1].trim() : ''
    const currentProgressDay = calculateCurrentDay(startDateStr)

    // Check if challenge section exists in user's todos
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos
    const activeFile = path.join(todosDir, 'active.md')

    let hasTodos = false
    let syncedDay: number | null = null

    try {
      const mdContent = await fs.readFile(activeFile, 'utf-8')
      const escapedName = challengeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // Check for section with day number
      const sectionWithDayPattern = new RegExp(`^###\\s+${escapedName}\\s*\\(Day\\s+(\\d+)\\)`, 'mi')
      const matchWithDay = mdContent.match(sectionWithDayPattern)
      if (matchWithDay) {
        hasTodos = true
        syncedDay = parseInt(matchWithDay[1])
      } else {
        // Check for section without day number
        const sectionPattern = new RegExp(`^###\\s+${escapedName}`, 'mi')
        hasTodos = sectionPattern.test(mdContent)
        if (hasTodos) syncedDay = 1
      }
    } catch {
      // File doesn't exist
    }

    return NextResponse.json({
      success: true,
      challengeId,
      challengeName,
      currentProgressDay,
      hasTodos,
      syncedDay,
      needsSync: !hasTodos || (syncedDay !== null && syncedDay < currentProgressDay)
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

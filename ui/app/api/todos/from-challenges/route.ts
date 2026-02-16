import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, getProfilePaths } from '@/lib/paths'
import { getTodayString, calculateDueDate } from '@/lib/datetime'

// Parse enhanced task format: - [ ] Task | duration: X | priority: Y | flexibility: Z
// followed by optional description: > description text
function parseEnhancedTaskLine(text: string, index: number): {
  title: string
  duration: number
  priority: string
  flexibility: string
  description: string
} {
  let title = text
  let duration = 30
  let priority = index < 2 ? 'high' : (index < 4 ? 'medium' : 'low')
  let flexibility = 'flexible'
  let description = ''

  // Check for enhanced format: title | duration: X | priority: Y | flexibility: Z
  if (text.includes('|')) {
    const parts = text.split('|').map(p => p.trim())
    title = parts[0]

    for (const part of parts.slice(1)) {
      const [key, value] = part.split(':').map(s => s.trim().toLowerCase())
      if (key === 'duration') {
        duration = parseInt(value) || 30
      } else if (key === 'priority') {
        priority = value || priority
      } else if (key === 'flexibility') {
        flexibility = value || 'flexible'
      }
    }
  } else {
    // Legacy format: Task name (10 min)
    const durationMatch = text.match(/\((\d+)\s*min\)/)
    if (durationMatch) {
      duration = parseInt(durationMatch[1])
      title = text.replace(/\s*\(\d+\s*min\)\s*(\(\d+\s*min\))?/, '').trim()
    }
  }

  return { title, duration, priority, flexibility, description }
}

// Parse tasks from a daily MD file
function parseTasksFromDayMd(content: string, challengeId: string, challengeName: string, dayNum: number, filename: string, startDateStr: string, challengeStatus: string, timezone?: string) {
  const tasks: any[] = []

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+Day\s+\d+\s+-\s+(.+)$/m)
  const dayTitle = titleMatch ? titleMatch[1].trim() : `Day ${dayNum}`

  // Extract status
  const isCompleted = content.includes('Status: completed') || content.includes('Completed:** Yes')

  // Calculate due date for this day
  const dueDate = calculateDueDate(startDateStr, dayNum, timezone)

  // Split content into lines for multi-line parsing
  const lines = content.split('\n')
  let taskIndex = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Match checkbox task
    const taskMatch = line.match(/^- \[([ xX])\]\s*(.+)$/)
    if (taskMatch) {
      const completed = taskMatch[1].toLowerCase() === 'x'
      const text = taskMatch[2].trim()

      // Parse enhanced format
      const { title, duration, priority, flexibility } = parseEnhancedTaskLine(text, taskIndex)

      // Check next line for description (starts with > or 2 spaces followed by >)
      let description = ''
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const descMatch = nextLine.match(/^\s*>\s*(.+)$/)
        if (descMatch) {
          description = descMatch[1].trim()
          i++ // Skip the description line
        }
      }

      tasks.push({
        id: `${challengeId}-day${dayNum}-task${taskIndex}`,
        title,
        text: title,
        description,
        challengeId,
        challengeName,
        challengeStatus,
        day: dayNum,
        dayTitle,
        dueDate,
        status: completed ? 'completed' : 'pending',
        completed,
        duration,
        priority,
        flexibility,
        createdAt: filename.replace('.md', ''),
      })
      taskIndex++
    }
    i++
  }

  return tasks
}

// Parse tasks from plan.md (when no days/ folder exists)
// Format: ### Day N: Title followed by - [ ] tasks
function parseTasksFromPlanMd(content: string, challengeId: string, challengeName: string, startDateStr: string, challengeStatus: string, timezone?: string) {
  const tasks: any[] = []

  // Split by day sections (### Day N: or #### Day N)
  const dayPattern = /#{2,4}\s*Day\s*(\d+)[:\s-]*([^\n]*)/gi
  const sections = content.split(dayPattern)

  // Process sections - they come in groups of 3: [before, dayNum, title, content, dayNum, title, content, ...]
  for (let i = 1; i < sections.length; i += 3) {
    const dayNum = parseInt(sections[i])
    const dayTitle = sections[i + 1]?.trim() || `Day ${dayNum}`
    const sectionContent = sections[i + 2] || ''

    // Calculate due date for this day
    const dueDate = calculateDueDate(startDateStr, dayNum, timezone)

    // Split section into lines for multi-line parsing
    const sectionLines = sectionContent.split('\n')
    let taskIndex = 0
    let lineIndex = 0

    while (lineIndex < sectionLines.length) {
      const line = sectionLines[lineIndex]
      const taskMatch = line.match(/^- \[([ xX])\]\s*(.+)$/)

      if (taskMatch) {
        const completed = taskMatch[1].toLowerCase() === 'x'
        const text = taskMatch[2].trim()

        // Parse enhanced format
        const { title, duration, priority, flexibility } = parseEnhancedTaskLine(text, taskIndex)

        // Check next line for description
        let description = ''
        if (lineIndex + 1 < sectionLines.length) {
          const nextLine = sectionLines[lineIndex + 1]
          const descMatch = nextLine.match(/^\s*>\s*(.+)$/)
          if (descMatch) {
            description = descMatch[1].trim()
            lineIndex++
          }
        }

        tasks.push({
          id: `${challengeId}-day${dayNum}-task${taskIndex}`,
          title,
          text: title,
          description,
          challengeId,
          challengeName,
          challengeStatus,
          day: dayNum,
          dayTitle,
          dueDate,
          status: completed ? 'completed' : 'pending',
          completed,
          duration,
          priority,
          flexibility,
          createdAt: 'plan',
        })
        taskIndex++
      }
      lineIndex++
    }
  }

  return tasks
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date') // Optional: filter by specific date/day
    const challengeFilter = searchParams.get('challengeId') // Optional: filter by challenge
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default: only active challenges
    const timezone = searchParams.get('timezone') || undefined

    // Use profile-specific challenges dir if profileId provided
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')
    let challengesDir = PATHS.challenges
    if (profileId) {
      const profileChallengesDir = getProfilePaths(profileId).challenges
      try {
        await fs.access(profileChallengesDir)
        const profileDirs = await fs.readdir(profileChallengesDir)
        if (profileDirs.length > 0) {
          challengesDir = profileChallengesDir
        }
      } catch {
        // Fall back to global challenges
      }
    }
    const allTasks: any[] = []

    // Get all challenge directories
    const dirs = await fs.readdir(challengesDir, { withFileTypes: true })

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue
      if (challengeFilter && dir.name !== challengeFilter) continue

      const challengeId = dir.name
      const challengeDir = path.join(challengesDir, challengeId)

      // Get challenge metadata from challenge.md
      let challengeName = challengeId
      let challengeStatus = 'active'
      let startDateStr = ''
      try {
        const challengeMd = (await fs.readFile(path.join(challengeDir, 'challenge.md'), 'utf-8')).replace(/\r\n/g, '\n')
        const nameMatch = challengeMd.match(/^#\s+(.+)$/m)
        if (nameMatch) challengeName = nameMatch[1].trim()

        const statusMatch = challengeMd.match(/\*\*Status:\*\*\s*(.+)/i)
        if (statusMatch) challengeStatus = statusMatch[1].trim().toLowerCase()

        const dateMatch = challengeMd.match(/\*\*Start Date:\*\*\s*(.+)/i)
        if (dateMatch) startDateStr = dateMatch[1].trim()
      } catch {}

      // Skip if filtering active only and challenge is not active
      if (activeOnly && challengeStatus !== 'active') continue

      // Skip challenges with dynamic (not yet started) dates — these are upcoming, no todos yet
      if (startDateStr === 'dynamic') continue
      if (!startDateStr) continue

      // Check for days/ folder first
      const daysDir = path.join(challengeDir, 'days')
      let hasDaysFolder = false
      try {
        await fs.access(daysDir)
        hasDaysFolder = true
      } catch {
        hasDaysFolder = false
      }

      if (hasDaysFolder) {
        // Read all day files from days/ folder
        const files = await fs.readdir(daysDir)
        const dayFiles = files.filter(f => f.endsWith('.md')).sort()

        for (const filename of dayFiles) {
          // Extract day number
          const dayMatch = filename.match(/day-?(\d+)\.md/i) || filename.match(/(\d{4}-\d{2}-\d{2})\.md/)
          const dayNum = dayMatch ? (dayMatch[1].includes('-') ? 1 : parseInt(dayMatch[1])) : 1

          // Optional date filter
          if (dateFilter) {
            if (dateFilter === 'today') {
              // For "today", show Day 1 tasks (relative to current progress)
              if (dayNum > 1) continue
            } else if (dateFilter === 'week') {
              // Show first 7 days
              if (dayNum > 7) continue
            } else if (!filename.includes(dateFilter) && `day-${dateFilter.padStart(2, '0')}` !== filename.replace('.md', '')) {
              continue
            }
          }

          const filePath = path.join(daysDir, filename)
          const content = (await fs.readFile(filePath, 'utf-8')).replace(/\r\n/g, '\n')
          const tasks = parseTasksFromDayMd(content, challengeId, challengeName, dayNum, filename, startDateStr, challengeStatus, timezone)
          allTasks.push(...tasks)
        }
      } else {
        // Fallback: Parse tasks from plan.md if no days/ folder
        const planPath = path.join(challengeDir, 'plan.md')
        try {
          const planContent = (await fs.readFile(planPath, 'utf-8')).replace(/\r\n/g, '\n')
          const tasks = parseTasksFromPlanMd(planContent, challengeId, challengeName, startDateStr, challengeStatus, timezone)

          // Apply date filter if needed
          const filteredTasks = tasks.filter(task => {
            if (!dateFilter) return true
            if (dateFilter === 'today') return task.day === 1
            if (dateFilter === 'week') return task.day <= 7
            return true
          })

          allTasks.push(...filteredTasks)
        } catch {
          // No plan.md either, skip this challenge
        }
      }
    }

    // Sort by day number and priority
    allTasks.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
    })

    return NextResponse.json({
      tasks: allTasks,
      total: allTasks.length,
      completed: allTasks.filter(t => t.completed).length,
    })
  } catch (error: any) {
    console.error('Error loading tasks from challenges:', error)
    return NextResponse.json({ tasks: [], error: error.message }, { status: 500 })
  }
}

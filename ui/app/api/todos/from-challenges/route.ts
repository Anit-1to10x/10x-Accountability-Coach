import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

// Parse tasks from a daily MD file
function parseTasksFromDayMd(content: string, challengeId: string, challengeName: string, dayNum: number, filename: string) {
  const tasks: any[] = []

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+Day\s+\d+\s+-\s+(.+)$/m)
  const dayTitle = titleMatch ? titleMatch[1].trim() : `Day ${dayNum}`

  // Extract status
  const isCompleted = content.includes('Status: completed') || content.includes('Completed:** Yes')

  // Extract tasks (checkboxes)
  const taskMatches = Array.from(content.matchAll(/- \[([ xX])\]\s*(.+)/g))
  let taskIndex = 0

  for (const match of taskMatches) {
    const completed = match[1].toLowerCase() === 'x'
    const text = match[2].trim()

    // Extract duration if present (e.g., "Task name (10 min)")
    const durationMatch = text.match(/\((\d+)\s*min\)/)
    const duration = durationMatch ? parseInt(durationMatch[1]) : 30

    tasks.push({
      id: `${challengeId}-day${dayNum}-task${taskIndex}`,
      title: text.replace(/\s*\(\d+\s*min\)\s*(\(\d+\s*min\))?/, '').trim(), // Remove duration from title
      text: text,
      challengeId,
      challengeName,
      day: dayNum,
      dayTitle,
      status: completed ? 'completed' : 'pending',
      completed,
      duration,
      priority: taskIndex < 2 ? 'high' : (taskIndex < 4 ? 'medium' : 'low'),
      createdAt: filename.replace('.md', ''),
    })
    taskIndex++
  }

  return tasks
}

// Parse tasks from plan.md (when no days/ folder exists)
// Format: ### Day N: Title followed by - [ ] tasks
function parseTasksFromPlanMd(content: string, challengeId: string, challengeName: string) {
  const tasks: any[] = []

  // Split by day sections (### Day N: or #### Day N)
  const dayPattern = /#{2,4}\s*Day\s*(\d+)[:\s-]*([^\n]*)/gi
  const sections = content.split(dayPattern)

  // Process sections - they come in groups of 3: [before, dayNum, title, content, dayNum, title, content, ...]
  for (let i = 1; i < sections.length; i += 3) {
    const dayNum = parseInt(sections[i])
    const dayTitle = sections[i + 1]?.trim() || `Day ${dayNum}`
    const sectionContent = sections[i + 2] || ''

    // Find all tasks in this section (until next day header)
    const sectionTaskMatches = Array.from(sectionContent.matchAll(/- \[([ xX])\]\s*(.+)/g))
    let taskIndex = 0

    for (const match of sectionTaskMatches) {
      const completed = match[1].toLowerCase() === 'x'
      const text = match[2].trim()

      tasks.push({
        id: `${challengeId}-day${dayNum}-task${taskIndex}`,
        title: text,
        text: text,
        challengeId,
        challengeName,
        day: dayNum,
        dayTitle,
        status: completed ? 'completed' : 'pending',
        completed,
        duration: 30,
        priority: taskIndex < 2 ? 'high' : (taskIndex < 4 ? 'medium' : 'low'),
        createdAt: 'plan',
      })
      taskIndex++
    }
  }

  return tasks
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date') // Optional: filter by specific date/day
    const challengeFilter = searchParams.get('challengeId') // Optional: filter by challenge

    const challengesDir = PATHS.challenges
    const allTasks: any[] = []

    // Get all challenge directories
    const dirs = await fs.readdir(challengesDir, { withFileTypes: true })

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue
      if (challengeFilter && dir.name !== challengeFilter) continue

      const challengeId = dir.name
      const challengeDir = path.join(challengesDir, challengeId)

      // Get challenge name from challenge.md
      let challengeName = challengeId
      try {
        const challengeMd = await fs.readFile(path.join(challengeDir, 'challenge.md'), 'utf-8')
        const nameMatch = challengeMd.match(/^#\s+(.+)$/m)
        if (nameMatch) challengeName = nameMatch[1].trim()
      } catch {}

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
          const content = await fs.readFile(filePath, 'utf-8')
          const tasks = parseTasksFromDayMd(content, challengeId, challengeName, dayNum, filename)
          allTasks.push(...tasks)
        }
      } else {
        // Fallback: Parse tasks from plan.md if no days/ folder
        const planPath = path.join(challengeDir, 'plan.md')
        try {
          const planContent = await fs.readFile(planPath, 'utf-8')
          const tasks = parseTasksFromPlanMd(planContent, challengeId, challengeName)

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

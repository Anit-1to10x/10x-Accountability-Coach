import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

interface BacklogTask {
  id: string
  title: string
  day: number
  challengeId: string
  challengeName: string
  duration: number
}

// Helper to parse day file content
function parseDayMd(content: string) {
  const tasks: { text: string; completed: boolean }[] = []
  const taskMatches = Array.from(content.matchAll(/- \[([ xX])\]\s*(.+)/g))

  for (const match of taskMatches) {
    tasks.push({
      completed: match[1].toLowerCase() === 'x',
      text: match[2].trim(),
    })
  }

  return tasks
}

// Helper to update task completion status in day file
function updateTaskInContent(content: string, taskTitle: string, completed: boolean): string {
  const checkbox = completed ? '[x]' : '[ ]'
  // Find and replace the task line
  return content.replace(
    new RegExp(`- \\[[ xX]\\]\\s*(${escapeRegex(taskTitle.split('(')[0].trim())}.*)`),
    `- ${checkbox} $1`
  )
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Get challenge info
async function getChallengeInfo(challengeId: string) {
  const challengeDir = path.join(PATHS.challenges, challengeId)
  const challengeMdPath = path.join(challengeDir, 'challenge.md')

  try {
    const content = await fs.readFile(challengeMdPath, 'utf-8')

    // Parse start date
    const startDateMatch = content.match(/Start Date:\*\*\s*(.+)/i)
    const startDate = startDateMatch ? startDateMatch[1].trim() : null

    // Parse current progress
    const progressMatch = content.match(/Days Completed:\*\*\s*(\d+)\/(\d+)/i)
    const completedDays = progressMatch ? parseInt(progressMatch[1]) : 0
    const totalDays = progressMatch ? parseInt(progressMatch[2]) : 30

    return { startDate, completedDays, totalDays, challengeDir }
  } catch {
    return null
  }
}

// Get all day files for a challenge
async function getDayFiles(challengeId: string) {
  const daysDir = path.join(PATHS.challenges, challengeId, 'days')

  try {
    const files = await fs.readdir(daysDir)
    return files.filter(f => f.endsWith('.md')).sort()
  } catch {
    return []
  }
}

// Calculate which day number corresponds to "tomorrow"
function getTomorrowDayNumber(startDate: string): number {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const diffTime = tomorrow.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tasks } = body as { action: string; tasks: BacklogTask[] }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ success: false, error: 'No tasks provided' }, { status: 400 })
    }

    // Group tasks by challenge
    const tasksByChallenge: Record<string, BacklogTask[]> = {}
    tasks.forEach(task => {
      if (!tasksByChallenge[task.challengeId]) {
        tasksByChallenge[task.challengeId] = []
      }
      tasksByChallenge[task.challengeId].push(task)
    })

    if (action === 'adjust_tomorrow') {
      // Move backlog tasks to tomorrow
      for (const [challengeId, challengeTasks] of Object.entries(tasksByChallenge)) {
        const challengeInfo = await getChallengeInfo(challengeId)
        if (!challengeInfo || !challengeInfo.startDate) continue

        const tomorrowDayNum = getTomorrowDayNumber(challengeInfo.startDate)
        const daysDir = path.join(PATHS.challenges, challengeId, 'days')

        // Find tomorrow's day file
        const tomorrowFile = path.join(daysDir, `day-${tomorrowDayNum.toString().padStart(2, '0')}.md`)

        try {
          let tomorrowContent = await fs.readFile(tomorrowFile, 'utf-8')

          // Find the ## Tasks section and add backlog tasks
          const tasksSection = tomorrowContent.match(/## Tasks\n([\s\S]*?)(?=\n##|$)/i)

          if (tasksSection) {
            // Create backlog tasks section
            const backlogSection = `\n### Backlog from Previous Days\n${challengeTasks.map(t => `- [ ] ${t.title} (${t.duration || 10} min) [From Day ${t.day}]`).join('\n')}\n`

            // Insert after existing tasks
            const insertPosition = tasksSection.index! + tasksSection[0].length
            tomorrowContent =
              tomorrowContent.slice(0, insertPosition) +
              backlogSection +
              tomorrowContent.slice(insertPosition)

            await fs.writeFile(tomorrowFile, tomorrowContent, 'utf-8')
          }

          // Also update the original day files to mark tasks as moved
          for (const task of challengeTasks) {
            const originalDayFile = path.join(daysDir, `day-${task.day.toString().padStart(2, '0')}.md`)
            try {
              let originalContent = await fs.readFile(originalDayFile, 'utf-8')
              // Add a note that task was moved
              originalContent = originalContent.replace(
                new RegExp(`- \\[ \\]\\s*(${escapeRegex(task.title.split('(')[0].trim())}[^\\n]*)`),
                `- [ ] $1 [MOVED TO DAY ${tomorrowDayNum}]`
              )
              await fs.writeFile(originalDayFile, originalContent, 'utf-8')
            } catch {}
          }

        } catch (error) {
          console.error(`Failed to update tomorrow's file for ${challengeId}:`, error)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Moved ${tasks.length} tasks to tomorrow's schedule`,
        action: 'adjust_tomorrow',
      })

    } else if (action === 'regenerate_plan') {
      // Analyze progress and regenerate remaining plan
      for (const [challengeId, challengeTasks] of Object.entries(tasksByChallenge)) {
        const challengeInfo = await getChallengeInfo(challengeId)
        if (!challengeInfo) continue

        const dayFiles = await getDayFiles(challengeId)
        const daysDir = path.join(PATHS.challenges, challengeId, 'days')

        // Analyze completed days to understand user's pace
        let totalTasksCompleted = 0
        let totalTasksPlanned = 0
        let completedDaysCount = 0

        for (const dayFile of dayFiles) {
          const dayContent = await fs.readFile(path.join(daysDir, dayFile), 'utf-8')
          const tasks = parseDayMd(dayContent)

          const completed = tasks.filter(t => t.completed).length
          totalTasksCompleted += completed
          totalTasksPlanned += tasks.length

          if (dayContent.includes('Status: completed') || completed === tasks.length) {
            completedDaysCount++
          }
        }

        // Calculate user's actual pace
        const avgTasksPerDay = completedDaysCount > 0
          ? totalTasksCompleted / completedDaysCount
          : 3 // Default to 3 tasks per day if no data

        // Get today's day number
        const todayDayNum = getTomorrowDayNumber(challengeInfo.startDate || new Date().toISOString().split('T')[0]) - 1

        // Redistribute remaining incomplete tasks across remaining days
        const remainingDayFiles = dayFiles.filter(f => {
          const dayNum = parseInt(f.match(/day-?(\d+)/i)?.[1] || '0')
          return dayNum > todayDayNum
        })

        // Collect all incomplete tasks from all days
        const allIncompleteTasks: { text: string; day: number }[] = []

        for (const dayFile of dayFiles) {
          const dayNum = parseInt(dayFile.match(/day-?(\d+)/i)?.[1] || '0')
          if (dayNum <= todayDayNum) {
            const dayContent = await fs.readFile(path.join(daysDir, dayFile), 'utf-8')
            const tasks = parseDayMd(dayContent)
            tasks.filter(t => !t.completed).forEach(t => {
              allIncompleteTasks.push({ text: t.text, day: dayNum })
            })
          }
        }

        // Redistribute tasks to remaining days based on user's pace
        const tasksPerRemainingDay = Math.ceil(
          (allIncompleteTasks.length + challengeTasks.length) / Math.max(remainingDayFiles.length, 1)
        )

        // Update remaining day files with redistributed tasks
        let taskIndex = 0
        for (const dayFile of remainingDayFiles) {
          const dayFilePath = path.join(daysDir, dayFile)
          let dayContent = await fs.readFile(dayFilePath, 'utf-8')

          // Add redistributed tasks note
          if (taskIndex < allIncompleteTasks.length) {
            const tasksToAdd = allIncompleteTasks.slice(taskIndex, taskIndex + tasksPerRemainingDay)

            if (tasksToAdd.length > 0) {
              const redistributedSection = `\n### Redistributed Tasks\n${tasksToAdd.map(t => `- [ ] ${t.text} [Originally Day ${t.day}]`).join('\n')}\n`

              // Find Tasks section and add
              const tasksMatch = dayContent.match(/## Tasks\n/i)
              if (tasksMatch) {
                const insertPos = tasksMatch.index! + tasksMatch[0].length
                dayContent = dayContent.slice(0, insertPos) + redistributedSection + dayContent.slice(insertPos)
                await fs.writeFile(dayFilePath, dayContent, 'utf-8')
              }
            }

            taskIndex += tasksPerRemainingDay
          }
        }

        // Update challenge.md with regeneration note
        const challengeMdPath = path.join(PATHS.challenges, challengeId, 'challenge.md')
        try {
          let challengeContent = await fs.readFile(challengeMdPath, 'utf-8')

          // Add or update Notes section
          const regenerationNote = `\n\n## Plan Regeneration\n- **Regenerated:** ${new Date().toISOString().split('T')[0]}\n- **Reason:** Backlog adjustment\n- **Tasks Redistributed:** ${allIncompleteTasks.length}\n- **User's Avg Pace:** ${avgTasksPerDay.toFixed(1)} tasks/day\n`

          if (challengeContent.includes('## Plan Regeneration')) {
            challengeContent = challengeContent.replace(/## Plan Regeneration[\s\S]*?(?=\n##|$)/, regenerationNote.trim())
          } else if (challengeContent.includes('## Notes')) {
            challengeContent = challengeContent.replace('## Notes', `${regenerationNote}## Notes`)
          } else {
            challengeContent += regenerationNote
          }

          await fs.writeFile(challengeMdPath, challengeContent, 'utf-8')
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: `Plan regenerated based on your progress`,
        action: 'regenerate_plan',
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Error adjusting backlog:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

// Helper to escape regex special characters
function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Toggle a task in a day MD file
async function toggleTaskInDayFile(
  challengeId: string,
  dayNum: number,
  taskTitle: string,
  completed: boolean
): Promise<{ success: boolean; error?: string; immutable?: boolean }> {
  const daysDir = path.join(PATHS.challenges, challengeId, 'days')
  const dayFile = path.join(daysDir, `day-${dayNum.toString().padStart(2, '0')}.md`)

  try {
    let content = (await fs.readFile(dayFile, 'utf-8')).replace(/\r\n/g, '\n')

    // Extract just the task name (without duration and metadata)
    const cleanTitle = taskTitle.split('|')[0].split('(')[0].trim()
    const escapedTitle = escapeRegex(cleanTitle)

    // Match the task line and update checkbox
    const checkbox = completed ? '[x]' : '[ ]'
    const pattern = new RegExp(`- \\[[ xX]\\]\\s*(${escapedTitle}[^\\n]*)`, 'i')

    if (pattern.test(content)) {
      content = content.replace(pattern, `- ${checkbox} $1`)
      await fs.writeFile(dayFile, content, 'utf-8')

      // Check if all tasks in this day are completed
      const allTasks = Array.from(content.matchAll(/- \[([ xX])\]/g))
      const taskStatuses = allTasks.map(m => m[1].toLowerCase() === 'x')
      const allCompleted = taskStatuses.length > 0 && taskStatuses.every(s => s)

      // Update day status if all tasks completed
      if (allCompleted) {
        content = content.replace(/## Status:\s*\w+/i, '## Status: completed')
        content = content.replace(/Completed:\*\*\s*No/i, 'Completed:** Yes')
        await fs.writeFile(dayFile, content, 'utf-8')
      } else {
        // Revert to pending if unchecking
        content = content.replace(/## Status:\s*completed/i, '## Status: pending')
        content = content.replace(/Completed:\*\*\s*Yes/i, 'Completed:** No')
        await fs.writeFile(dayFile, content, 'utf-8')
      }

      return { success: true }
    } else {
      return { success: false, error: `Task not found: ${cleanTitle}` }
    }
  } catch (error: any) {
    console.error(`Failed to toggle task in ${dayFile}:`, error)
    return { success: false, error: error.message }
  }
}

// Update challenge progress based on completed days
async function updateChallengeProgress(challengeId: string): Promise<{
  progress: number
  completedDays: number
  totalDays: number
}> {
  const challengeDir = path.join(PATHS.challenges, challengeId)
  const challengeFile = path.join(challengeDir, 'challenge.md')
  const daysDir = path.join(challengeDir, 'days')

  try {
    // Count completed days
    const files = await fs.readdir(daysDir)
    const dayFiles = files.filter(f => f.endsWith('.md'))
    let completedDays = 0

    for (const file of dayFiles) {
      const content = (await fs.readFile(path.join(daysDir, file), 'utf-8')).replace(/\r\n/g, '\n')
      // Check if all tasks in this day are completed
      const allTasks = Array.from(content.matchAll(/- \[([ xX])\]/g))
      if (allTasks.length > 0 && allTasks.every(m => m[1].toLowerCase() === 'x')) {
        completedDays++
      }
    }

    const totalDays = dayFiles.length
    const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    // Update challenge.md file
    let challengeContent = (await fs.readFile(challengeFile, 'utf-8')).replace(/\r\n/g, '\n')
    challengeContent = challengeContent.replace(
      /Overall:\*\*\s*\d+%/i,
      `Overall:** ${progress}%`
    )
    challengeContent = challengeContent.replace(
      /Days Completed:\*\*\s*\d+\/\d+/i,
      `Days Completed:** ${completedDays}/${totalDays}`
    )
    await fs.writeFile(challengeFile, challengeContent, 'utf-8')

    return { progress, completedDays, totalDays }
  } catch (error) {
    console.error('Failed to update challenge progress:', error)
    return { progress: 0, completedDays: 0, totalDays: 0 }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, completed, challengeId, day, title } = body

    if (!challengeId || !day || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: challengeId, day, title' },
        { status: 400 }
      )
    }

    // Toggle the task in the day file
    const result = await toggleTaskInDayFile(challengeId, day, title, completed)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Update challenge progress
    const progressResult = await updateChallengeProgress(challengeId)

    return NextResponse.json({
      success: true,
      taskId,
      completed,
      ...progressResult
    })
  } catch (error: any) {
    console.error('Error toggling challenge task:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to get task status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challengeId = searchParams.get('challengeId')
  const day = searchParams.get('day')

  if (!challengeId || !day) {
    return NextResponse.json(
      { success: false, error: 'Missing challengeId or day' },
      { status: 400 }
    )
  }

  try {
    const dayFile = path.join(
      PATHS.challenges,
      challengeId,
      'days',
      `day-${day.toString().padStart(2, '0')}.md`
    )

    const content = (await fs.readFile(dayFile, 'utf-8')).replace(/\r\n/g, '\n')
    const tasks: { title: string; completed: boolean }[] = []

    const taskMatches = Array.from(content.matchAll(/- \[([ xX])\]\s*(.+)/g))
    for (const match of taskMatches) {
      tasks.push({
        title: match[2].trim(),
        completed: match[1].toLowerCase() === 'x'
      })
    }

    return NextResponse.json({ success: true, tasks })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

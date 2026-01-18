import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS } from '@/lib/paths'

interface TaskInfo {
  id: string
  title: string
  challengeId: string
  day: number
  completed: boolean
}

interface CheckInCompleteData {
  challengeId?: string
  completedTaskIds: string[]
  mood: number
  wins: string
  blockers: string
  tomorrowCommitment: string
  timestamp: string
  tasks: TaskInfo[]
}

// Helper to escape regex special characters
function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Update task status in day MD file
async function updateTasksInDayFile(
  challengeId: string,
  dayNum: number,
  tasks: TaskInfo[]
): Promise<boolean> {
  const daysDir = path.join(PATHS.challenges, challengeId, 'days')
  const dayFile = path.join(daysDir, `day-${dayNum.toString().padStart(2, '0')}.md`)

  try {
    let content = await fs.readFile(dayFile, 'utf-8')

    // Update each task's checkbox
    for (const task of tasks) {
      if (task.day !== dayNum) continue

      // Extract task title without duration
      const taskTitle = task.title.split('(')[0].trim()
      const escapedTitle = escapeRegex(taskTitle)

      // Match the task line and update checkbox
      const checkbox = task.completed ? '[x]' : '[ ]'
      const pattern = new RegExp(`- \\[[ xX]\\]\\s*(${escapedTitle}[^\\n]*)`, 'i')

      if (pattern.test(content)) {
        content = content.replace(pattern, `- ${checkbox} $1`)
      }
    }

    // Update status if all tasks are completed
    const allCompleted = tasks.filter(t => t.day === dayNum).every(t => t.completed)
    if (allCompleted) {
      content = content.replace(/## Status:\s*\w+/i, '## Status: completed')
      content = content.replace(/Completed:\*\*\s*No/i, 'Completed:** Yes')
    }

    await fs.writeFile(dayFile, content, 'utf-8')
    return true
  } catch (error) {
    console.error(`Failed to update day file for ${challengeId} day ${dayNum}:`, error)
    return false
  }
}

// Update challenge progress and streak
async function updateChallengeProgress(
  challengeId: string,
  completedTasksCount: number,
  totalTasksCount: number
): Promise<{ streak: number; progress: number }> {
  const challengeFile = path.join(PATHS.challenges, challengeId, 'challenge.md')

  try {
    let content = await fs.readFile(challengeFile, 'utf-8')

    // Get current streak
    const streakMatch = content.match(/Current:\*\*\s*(\d+)\s*days?/i)
    let currentStreak = streakMatch ? parseInt(streakMatch[1]) : 0

    // Get last check-in date
    const lastCheckinMatch = content.match(/Last Check-in:\*\*\s*(.+)/i)
    const lastCheckin = lastCheckinMatch ? lastCheckinMatch[1].trim() : 'None'

    // Check if this is a new day check-in
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (lastCheckin === 'None' || lastCheckin === yesterday) {
      // Streak continues or starts
      currentStreak += 1
    } else if (lastCheckin === today) {
      // Already checked in today, don't increment
    } else {
      // Streak broken, reset
      currentStreak = 1
    }

    // Update best streak if needed
    const bestMatch = content.match(/Best:\*\*\s*(\d+)\s*days?/i)
    let bestStreak = bestMatch ? parseInt(bestMatch[1]) : 0
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak
    }

    // Calculate overall progress
    const daysCompletedMatch = content.match(/Days Completed:\*\*\s*(\d+)\/(\d+)/i)
    let daysCompleted = daysCompletedMatch ? parseInt(daysCompletedMatch[1]) : 0
    const totalDays = daysCompletedMatch ? parseInt(daysCompletedMatch[2]) : 30

    // Increment days completed if all tasks done
    if (completedTasksCount === totalTasksCount && completedTasksCount > 0) {
      daysCompleted += 1
    }

    const progress = Math.round((daysCompleted / totalDays) * 100)

    // Update the file
    content = content.replace(
      /Current:\*\*\s*\d+\s*days?/i,
      `Current:** ${currentStreak} days`
    )
    content = content.replace(
      /Best:\*\*\s*\d+\s*days?/i,
      `Best:** ${bestStreak} days`
    )
    content = content.replace(
      /Last Check-in:\*\*\s*.+/i,
      `Last Check-in:** ${today}`
    )
    content = content.replace(
      /Overall:\*\*\s*\d+%/i,
      `Overall:** ${progress}%`
    )
    content = content.replace(
      /Days Completed:\*\*\s*\d+\/\d+/i,
      `Days Completed:** ${daysCompleted}/${totalDays}`
    )

    await fs.writeFile(challengeFile, content, 'utf-8')

    return { streak: currentStreak, progress }
  } catch (error) {
    console.error(`Failed to update challenge progress for ${challengeId}:`, error)
    return { streak: 1, progress: 0 }
  }
}

// Save check-in record
async function saveCheckinRecord(data: CheckInCompleteData): Promise<void> {
  const checkinsDir = path.join(DATA_DIR, 'checkins')
  await fs.mkdir(checkinsDir, { recursive: true })

  const date = new Date(data.timestamp).toISOString().split('T')[0]
  const time = new Date(data.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const moodLabels: Record<number, string> = {
    5: 'On Fire 🔥',
    4: 'Great ✅',
    3: 'Good 😊',
    2: 'Okay 😐',
    1: 'Struggling 😓',
  }

  const checkInFilePath = path.join(checkinsDir, `${date}.md`)

  // Create or append to check-in file
  let existingContent = ''
  try {
    existingContent = await fs.readFile(checkInFilePath, 'utf-8')
  } catch {
    existingContent = `# Daily Check-Ins - ${new Date(data.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}\n\n`
  }

  const completedTasks = data.tasks.filter(t => t.completed)
  const pendingTasks = data.tasks.filter(t => !t.completed)

  const checkInEntry = `## Check-In @ ${time}

**Mood:** ${moodLabels[data.mood] || data.mood}
**Challenge:** ${data.challengeId || 'Multiple'}

### Tasks Completed (${completedTasks.length}/${data.tasks.length})
${completedTasks.length > 0
  ? completedTasks.map(t => `- [x] ${t.title} (Day ${t.day})`).join('\n')
  : '- None'}

${pendingTasks.length > 0 ? `### Tasks Pending
${pendingTasks.map(t => `- [ ] ${t.title} (Day ${t.day})`).join('\n')}

` : ''}### Wins
${data.wins || 'None recorded'}

### Blockers
${data.blockers || 'None reported'}

### Tomorrow's Commitment
${data.tomorrowCommitment || 'Not specified'}

---

`

  await fs.writeFile(checkInFilePath, existingContent + checkInEntry)
}

// Update registry for streak tracking (MD format)
async function updateRegistry(
  challengeId: string,
  streak: number
): Promise<void> {
  const registryDir = path.join(DATA_DIR, '.registry')
  const registryPath = path.join(registryDir, 'challenges.md')

  await fs.mkdir(registryDir, { recursive: true })

  let registryContent = ''

  try {
    registryContent = await fs.readFile(registryPath, 'utf-8')
  } catch {
    registryContent = `# Challenges Registry

## Active Challenges

`
  }

  const date = new Date().toISOString().split('T')[0]

  // Check if challenge exists in registry
  const challengePattern = new RegExp(`### (.+?) \\(${challengeId}\\)[\\s\\S]*?(?=### |$)`, 'g')
  const existingMatch = registryContent.match(challengePattern)

  if (existingMatch) {
    // Update existing challenge
    registryContent = registryContent.replace(
      new RegExp(`(### .+? \\(${challengeId}\\)[\\s\\S]*?)- \\*\\*Streak:\\*\\* \\d+ days`, 'g'),
      (match) => match.replace(/- \*\*Streak:\*\* \d+ days/, `- **Streak:** ${streak} days`)
    )
    registryContent = registryContent.replace(
      new RegExp(`(### .+? \\(${challengeId}\\)[\\s\\S]*?)- \\*\\*Last Check-in:\\*\\* .+`, 'g'),
      (match) => match.replace(/- \*\*Last Check-in:\*\* .+/, `- **Last Check-in:** ${date}`)
    )
  } else {
    // Add new challenge entry
    const newEntry = `### Challenge ${challengeId} (${challengeId})
- **ID:** ${challengeId}
- **Status:** active
- **Streak:** ${streak} days
- **Last Check-in:** ${date}
- **Created:** ${date}

`
    registryContent += newEntry
  }

  await fs.writeFile(registryPath, registryContent, 'utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const data: CheckInCompleteData & { aiAccepted?: boolean } = await request.json()

    const { completedTaskIds, tasks, challengeId, aiAccepted } = data

    // VALIDATION: Check if check-in is allowed
    if (challengeId) {
      const validationResponse = await fetch(`${request.nextUrl.origin}/api/checkin/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, aiAccepted })
      })

      const validation = await validationResponse.json()

      if (!validation.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: validation.message,
            requiresAIAcceptance: validation.requiresAIAcceptance,
            alreadyCheckedIn: validation.alreadyCheckedIn
          },
          { status: validation.alreadyCheckedIn ? 409 : 403 }
        )
      }
    }

    // Group tasks by challenge and day
    const tasksByChallenge: Record<string, Record<number, TaskInfo[]>> = {}

    tasks.forEach(task => {
      if (!tasksByChallenge[task.challengeId]) {
        tasksByChallenge[task.challengeId] = {}
      }
      if (!tasksByChallenge[task.challengeId][task.day]) {
        tasksByChallenge[task.challengeId][task.day] = []
      }

      // Mark task as completed if in completedTaskIds
      tasksByChallenge[task.challengeId][task.day].push({
        ...task,
        completed: completedTaskIds.includes(task.id)
      })
    })

    // Update each challenge's day files
    for (const [cId, dayTasks] of Object.entries(tasksByChallenge)) {
      for (const [dayNum, tasksForDay] of Object.entries(dayTasks)) {
        await updateTasksInDayFile(cId, parseInt(dayNum), tasksForDay)
      }
    }

    // Update challenge progress and streak
    const completedCount = completedTaskIds.length
    const totalCount = tasks.length
    const primaryChallengeId = challengeId || tasks[0]?.challengeId

    let streakResult = { streak: 1, progress: 0 }

    if (primaryChallengeId) {
      streakResult = await updateChallengeProgress(
        primaryChallengeId,
        completedCount,
        totalCount
      )

      // Update registry
      await updateRegistry(primaryChallengeId, streakResult.streak)
    }

    // Save check-in record
    await saveCheckinRecord(data)

    // Generate streak message
    let streakMessage = ''
    if (streakResult.streak === 1) {
      streakMessage = "You've started a new streak! Keep it going!"
    } else if (streakResult.streak === 7) {
      streakMessage = "🎉 One week streak! You're building a great habit!"
    } else if (streakResult.streak === 30) {
      streakMessage = "🏆 30 day streak! You're unstoppable!"
    } else if (streakResult.streak > 1) {
      streakMessage = `🔥 ${streakResult.streak} day streak! Keep the momentum!`
    }

    return NextResponse.json({
      success: true,
      tasksCompleted: completedCount,
      totalTasks: totalCount,
      streak: streakResult.streak,
      progress: streakResult.progress,
      streakMessage,
      date: new Date().toISOString().split('T')[0]
    })

  } catch (error: any) {
    console.error('Error completing check-in:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS } from '@/lib/paths'

interface CheckInData {
  challengeId?: string
  mood?: number
  wins?: string
  blockers?: string
  tomorrow?: string
  timestamp: string
  // New daily check-in fields
  agentId?: string
  context?: {
    energy: string
    focus: string
    challenges?: string
  }
  completedTasks?: string[]
  tasksCount?: number
}

export async function POST(request: NextRequest) {
  try {
    const data: CheckInData = await request.json()

    // Ensure checkins directory exists
    const checkinsDir = path.join(DATA_DIR, 'checkins')
    await fs.mkdir(checkinsDir, { recursive: true })

    // Create check-in file for today
    const date = new Date(data.timestamp).toISOString().split('T')[0]
    const time = new Date(data.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    const checkInFilePath = path.join(checkinsDir, `${date}.md`)

    // Check if this is a daily task check-in or challenge check-in
    if (data.context && data.completedTasks) {
      // Daily task check-in format
      let existingContent = ''
      try {
        existingContent = await fs.readFile(checkInFilePath, 'utf-8')
      } catch {
        // File doesn't exist yet, create header
        existingContent = `# Daily Check-Ins - ${new Date(data.timestamp).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}\n\n`
      }

      // Append new check-in
      const checkInEntry = `## Check-In @ ${time}

**Agent:** ${data.agentId || 'unified'}

### Context
- **Energy Level:** ${data.context.energy}
- **Focus Level:** ${data.context.focus}
${data.context.challenges ? `- **Challenges:** ${data.context.challenges}` : ''}

### Completed Tasks
${data.completedTasks.map((taskId, index) => `${index + 1}. Task ID: ${taskId}`).join('\n')}

**Total Completed:** ${data.tasksCount || data.completedTasks.length} task${(data.tasksCount || data.completedTasks.length) !== 1 ? 's' : ''}

---

`

      await fs.writeFile(checkInFilePath, existingContent + checkInEntry)

      // Update index.md
      try {
        await fetch(`${request.nextUrl.origin}/api/system/index`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'checkin_completed',
            data: {
              date,
              time,
              agentId: data.agentId,
              tasksCompleted: data.tasksCount || data.completedTasks.length,
              energy: data.context.energy,
              focus: data.context.focus,
              filePath: `checkins/${date}.md`,
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (error) {
        console.error('Failed to update index.md:', error)
      }

      return NextResponse.json({
        success: true,
        type: 'daily',
        checkInFile: `checkins/${date}.md`,
        tasksCompleted: data.tasksCount || data.completedTasks.length,
        date
      })
    }

    // Original challenge-based check-in format
    const moodLabels: Record<number, string> = {
      5: 'Crushed it',
      4: 'Good',
      3: 'Meh',
      2: 'Struggled',
      1: 'Terrible',
    }

    const checkinContent = `# Check-in: ${date}

## Summary
- **Mood:** ${moodLabels[data.mood!]} (${data.mood}/5)
- **Challenge:** ${data.challengeId}
- **Check-in Time:** ${time}

## Wins
${data.wins}

## Blockers
${data.blockers || 'None reported'}

## Tomorrow's Commitment
${data.tomorrow}

## Coach Notes
User checked in on time. ${data.mood! >= 4 ? 'Good momentum.' : data.mood! <= 2 ? 'May need extra support.' : 'Steady progress.'}
`

    await fs.writeFile(checkInFilePath, checkinContent)

    // Update challenge log
    if (data.challengeId) {
      const challengeLogPath = path.join(
        PATHS.challenges,
        data.challengeId,
        'challenge-log.md'
      )

    try {
      let logContent = await fs.readFile(challengeLogPath, 'utf-8')

      const newEntry = `
## ${date}
- **Status:** ✅ Completed
- **Mood:** ${data.mood || 'N/A'}/5
- **Wins:** ${data.wins?.split('\n')[0] || 'None recorded'}
- **Tomorrow:** ${data.tomorrow || 'Not specified'}
`

      // Append to log
      logContent += newEntry
      await fs.writeFile(challengeLogPath, logContent)
    } catch (error) {
      console.error('Could not update challenge log:', error)
    }

    // Update streak in registry (MD format)
    try {
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

      // Parse existing challenges
      const challengePattern = new RegExp(`### (.+?) \\(${data.challengeId}\\)[\\s\\S]*?(?=### |$)`, 'g')
      const existingMatch = registryContent.match(challengePattern)

      if (existingMatch) {
        // Update existing challenge streak
        registryContent = registryContent.replace(
          new RegExp(`(### .+? \\(${data.challengeId}\\)[\\s\\S]*?)- \\*\\*Streak:\\*\\* (\\d+) days`, 'g'),
          (match, prefix, currentStreak) => {
            const newStreak = parseInt(currentStreak) + 1
            return match.replace(`- **Streak:** ${currentStreak} days`, `- **Streak:** ${newStreak} days`)
              .replace(/- \*\*Last Check-in:\*\* .+/, `- **Last Check-in:** ${date}`)
          }
        )
      } else {
        // Add new challenge entry
        const newEntry = `### Challenge ${data.challengeId} (${data.challengeId})
- **ID:** ${data.challengeId}
- **Status:** active
- **Streak:** 1 days
- **Last Check-in:** ${date}
- **Created:** ${date}

`
        registryContent += newEntry
      }

      await fs.writeFile(registryPath, registryContent, 'utf-8')
    } catch (error) {
      console.error('Could not update registry:', error)
    }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving check-in:', error)
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }
}

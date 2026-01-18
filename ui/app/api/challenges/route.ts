import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS, getProfilePaths } from '@/lib/paths'

// Parse challenge.md file to extract metadata
function parseChallengeMd(content: string, id: string) {
  const lines = content.split('\n')
  const data: Record<string, any> = { id }

  // Extract name from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) data.name = titleMatch[1].trim()

  // Extract key-value pairs like "- **Key:** Value"
  for (const line of lines) {
    const match = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/i)
    if (match) {
      const key = match[1].toLowerCase().replace(/\s+/g, '_')
      let value = match[2].trim()

      // Parse special values
      if (value.match(/^\d+$/)) value = parseInt(value) as any
      if (value === 'None' || value === 'none') value = null as any

      data[key] = value
    }
  }

  // Extract goal from ## Goal section
  const goalMatch = content.match(/##\s*Goal\n+([^\n#]+)/i)
  if (goalMatch) data.goal = goalMatch[1].trim()

  return data
}

// Count completed days from days/ folder
async function countCompletedDays(daysDir: string): Promise<{ completed: number, total: number }> {
  try {
    const files = await fs.readdir(daysDir)
    const dayFiles = files.filter(f => f.endsWith('.md'))
    let completed = 0

    for (const file of dayFiles) {
      const content = await fs.readFile(path.join(daysDir, file), 'utf-8')
      if (content.includes('Status: completed') || content.includes('Completed:** Yes')) {
        completed++
      }
    }

    return { completed, total: dayFiles.length }
  } catch {
    return { completed: 0, total: 0 }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get profileId from query params (filter by owner)
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    // Always use global challenges directory (data/challenges)
    const challengesDir = PATHS.challenges

    // Ensure directory exists
    await fs.mkdir(challengesDir, { recursive: true })

    const dirs = await fs.readdir(challengesDir, { withFileTypes: true })
    const challenges = []

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        try {
          const challengeDir = path.join(challengesDir, dir.name)

          // Try MD format first (new format)
          const mdPath = path.join(challengeDir, 'challenge.md')
          const jsonPath = path.join(challengeDir, 'challenge-config.json')

          let config: any = null

          try {
            // Try MD format
            const mdContent = await fs.readFile(mdPath, 'utf-8')
            config = parseChallengeMd(mdContent, dir.name)
          } catch {
            // Fall back to JSON format
            try {
              const jsonContent = await fs.readFile(jsonPath, 'utf-8')
              config = JSON.parse(jsonContent)
            } catch {
              console.error(`No challenge file found in ${dir.name}`)
              continue
            }
          }

          // Filter by profileId if specified
          if (profileId && config.owner && config.owner !== profileId) {
            continue // Skip challenges not owned by this profile
          }

          // Count completed days (check both 'days' and 'daily' folders)
          const daysDir = path.join(challengeDir, 'days')
          const dailyDir = path.join(challengeDir, 'daily')
          let daysFolderExists = false
          let actualDaysDir = daysDir

          try {
            await fs.access(daysDir)
            daysFolderExists = true
          } catch {
            try {
              await fs.access(dailyDir)
              actualDaysDir = dailyDir
              daysFolderExists = true
            } catch {}
          }

          const { completed: completedDays, total: totalDayFiles } = daysFolderExists
            ? await countCompletedDays(actualDaysDir)
            : { completed: 0, total: 0 }

          // Calculate progress
          const startDate = new Date(config.start_date || config.startDate || new Date())
          const endDate = new Date(config.target_date || config.end_date || config.targetDate || Date.now() + 30*24*60*60*1000)
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          // Use existing progress if available, otherwise calculate
          const progress = config.progress !== undefined
            ? config.progress
            : (totalDays > 0 ? Math.min(Math.round((completedDays / totalDays) * 100), 100) : 0)

          // Build streak object - use existing streak data if available
          const streakData = config.streak || {}
          const currentStreak = streakData.current || parseInt(config.current) || 0
          const bestStreak = streakData.best || parseInt(config.best) || 0
          const streak = {
            id: `streak-${config.id}`,
            challengeId: config.id,
            current: currentStreak,
            best: bestStreak,
            lastCheckin: streakData.lastCheckin || config.last_check_in || config.lastCheckin || null,
            missedDays: streakData.missedDays || 0,
            graceUsed: streakData.graceUsed || 0
          }

          challenges.push({
            id: config.id || dir.name,
            name: config.name || dir.name,
            owner: config.owner || null,
            ownerName: config.owner_name || null,
            type: config.type || 'custom',
            goal: config.goal || '',
            agent: config.agent || 'accountability-coach',
            startDate: config.start_date || config.startDate,
            targetDate: config.target_date || config.end_date || config.targetDate,
            status: config.status || 'active',
            streak,
            progress,
            totalDays: totalDays > 0 ? totalDays : 30,
            completedDays,
            punishments: config.punishments || [],
            gracePeriod: parseInt(config.grace_period) || parseInt(config.gracePeriod) || 24,
            dailyHours: parseInt(config.daily_hours) || parseInt(config.dailyHours) || 1,
            availableSlots: config.available_slots || config.availableSlots || [],
            milestones: config.milestones || []
          })
        } catch (error) {
          console.error(`Error reading challenge ${dir.name}:`, error)
        }
      }
    }

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json({ challenges: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      type,
      agent,
      goal,
      startDate,
      targetDate,
      dailyHours,
      availableSlots,
      punishments,
      gracePeriod,
    } = body

    // Always use global challenges directory
    const challengesDir = PATHS.challenges
    const challengeId = id || name.toLowerCase().replace(/\s+/g, '-')
    const challengeDir = path.join(challengesDir, challengeId)
    const daysDir = path.join(challengeDir, 'days')

    // Create challenge and days directories
    await fs.mkdir(daysDir, { recursive: true })

    // Calculate total days
    const start = new Date(startDate || new Date())
    const end = new Date(targetDate || Date.now() + 30*24*60*60*1000)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Create challenge.md (main config in MD format)
    const challengeMd = `# ${name}

## Overview
- **ID:** ${challengeId}
- **Type:** ${type || 'custom'}
- **Status:** active
- **Start Date:** ${start.toISOString().split('T')[0]}
- **Target Date:** ${end.toISOString().split('T')[0]}
- **Daily Hours:** ${dailyHours || 1}
- **Agent:** ${agent || 'accountability-coach'}

## Goal
${goal || 'No goal specified'}

## Streak
- **Current:** 0 days
- **Best:** 0 days
- **Last Check-in:** None

## Progress
- **Overall:** 0%
- **Days Completed:** 0/${totalDays}

## Plan
(Plan will be generated based on your goal and timeline)

## Milestones
- [ ] Week 1 Complete
- [ ] Week 2 Complete
- [ ] Halfway Point
- [ ] Final Goal Achieved

## Notes
Created: ${new Date().toISOString()}
`

    await fs.writeFile(path.join(challengeDir, 'challenge.md'), challengeMd, 'utf-8')

    // Create first day file
    const today = new Date().toISOString().split('T')[0]
    const dayMd = `# Day 1 - ${today}

## Status: pending

## Today's Focus
Getting started with ${name}

## Tasks
- [ ] Review the challenge goal
- [ ] Create initial plan
- [ ] Start first task

## Notes


## Check-in
- **Completed:** No
- **Time Spent:** 0 hours
- **Mood:**
- **Blockers:** None

## Reflection

`

    await fs.writeFile(path.join(daysDir, `${today}.md`), dayMd, 'utf-8')

    // Update registry (MD format)
    const registryDir = path.join(DATA_DIR, '.registry')
    const registryPath = path.join(registryDir, 'challenges.md')
    await fs.mkdir(registryDir, { recursive: true })

    let registryContent = ''
    try {
      registryContent = await fs.readFile(registryPath, 'utf-8')
    } catch {
      // Initialize new registry
      registryContent = `# Challenges Registry

## Active Challenges

`
    }

    // Append new challenge entry
    const newEntry = `### ${name} (${challengeId})
- **ID:** ${challengeId}
- **Status:** active
- **Streak:** 0 days
- **Last Check-in:** None
- **Created:** ${new Date().toISOString().split('T')[0]}

`

    registryContent += newEntry
    await fs.writeFile(registryPath, registryContent, 'utf-8')

    return NextResponse.json({
      success: true,
      challenge: {
        id: challengeId,
        name,
        type,
        streak: 0,
        progress: 0,
        isActive: true,
      },
    })
  } catch (error: any) {
    console.error('Error creating challenge:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

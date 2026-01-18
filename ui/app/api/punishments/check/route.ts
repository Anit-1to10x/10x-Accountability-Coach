import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { Challenge, Punishment } from '@/types/streak'
import { DATA_DIR, PATHS } from '@/lib/paths'

const PUNISHMENTS_DIR = path.join(DATA_DIR, 'punishments')
const ACTIVE_FILE = path.join(PUNISHMENTS_DIR, 'active.json')
const HISTORY_FILE = path.join(PUNISHMENTS_DIR, 'history.json')

interface PunishmentRecord {
  punishment: Punishment
  challengeId: string
  challengeName: string
}

async function getChallenges(): Promise<Challenge[]> {
  try {
    const challengesDir = PATHS.challenges
    const dirs = await fs.readdir(challengesDir, { withFileTypes: true })
    const challenges: Challenge[] = []

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        try {
          const configPath = path.join(challengesDir, dir.name, 'challenge-config.json')
          const configContent = await fs.readFile(configPath, 'utf-8')
          const config = JSON.parse(configContent)

          // Get streak data
          const registryPath = path.join(DATA_DIR, '.registry', 'challenges.json')
          const registryContent = await fs.readFile(registryPath, 'utf-8')
          const registry = JSON.parse(registryContent)
          const streakData = registry.challenges?.find((c: any) => c.id === config.id)

          challenges.push({
            id: config.id,
            name: config.name,
            type: config.type,
            agent: config.agent,
            goal: config.goal,
            startDate: config.start_date,
            targetDate: config.end_date,
            status: config.status,
            punishments: config.punishments || [],
            gracePeriod: config.grace_period || 0,
            streak: streakData?.streak || {
              id: `streak-${config.id}`,
              challengeId: config.id,
              current: 0,
              best: 0,
              lastCheckin: '',
              missedDays: 0,
              graceUsed: 0,
            },
            progress: 0,
          })
        } catch (error) {
          console.error(`Error reading challenge ${dir.name}:`, error)
        }
      }
    }

    return challenges
  } catch (error) {
    console.error('Error getting challenges:', error)
    return []
  }
}

async function getMissedTodos(challengeId: string): Promise<number> {
  try {
    const todosFile = path.join(PATHS.todos, 'active.json')
    const data = await fs.readFile(todosFile, 'utf-8')
    const todos = JSON.parse(data)

    // Count todos that are past due and not completed
    const now = new Date()
    const missedCount = todos.filter((todo: any) => {
      if (todo.challengeName !== challengeId) return false
      if (todo.status === 'completed') return false

      const dueDate = new Date(todo.dueDate)
      return dueDate < now
    }).length

    return missedCount
  } catch (error) {
    console.error('Error getting missed todos:', error)
    return 0
  }
}

async function triggerPunishment(
  punishment: Punishment,
  challengeId: string,
  challengeName: string,
  origin: string
) {
  try {
    // Update punishment status
    const updatedPunishment: Punishment = {
      ...punishment,
      status: 'triggered',
      triggeredAt: new Date().toISOString(),
    }

    // Read active punishments
    await fs.mkdir(PUNISHMENTS_DIR, { recursive: true })
    let activePunishments: PunishmentRecord[] = []
    try {
      const data = await fs.readFile(ACTIVE_FILE, 'utf-8')
      activePunishments = JSON.parse(data)
    } catch {
      // File doesn't exist yet
    }

    // Add to active punishments
    activePunishments.push({
      punishment: updatedPunishment,
      challengeId,
      challengeName,
    })

    await fs.writeFile(ACTIVE_FILE, JSON.stringify(activePunishments, null, 2), 'utf-8')

    // Log to index.md
    try {
      await fetch(`${origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'punishment_triggered',
          data: {
            challenge: challengeName,
            trigger: `${punishment.trigger.type}: ${punishment.trigger.value}`,
            punishment: punishment.consequence.description,
            lastTriggered: updatedPunishment.triggeredAt,
            status: 'triggered',
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return updatedPunishment
  } catch (error) {
    console.error('Error triggering punishment:', error)
    return null
  }
}

// POST: Check all challenges for punishment triggers
export async function POST(request: NextRequest) {
  try {
    const challenges = await getChallenges()
    const triggered: Array<{
      challengeId: string
      challengeName: string
      punishment: Punishment
    }> = []

    for (const challenge of challenges) {
      if (!challenge.punishments || challenge.punishments.length === 0) continue

      for (const punishment of challenge.punishments) {
        // Skip if already triggered
        if (punishment.status !== 'active') continue

        let shouldTrigger = false

        // Check trigger conditions
        switch (punishment.trigger.type) {
          case 'streak_days':
            // Trigger if missed days >= value
            if (challenge.streak.missedDays >= punishment.trigger.value) {
              shouldTrigger = true
            }
            break

          case 'missed_count':
            // Trigger if missed todos >= value
            const missedCount = await getMissedTodos(challenge.id)
            if (missedCount >= punishment.trigger.value) {
              shouldTrigger = true
            }
            break

          case 'deadline':
            // Trigger if past deadline
            if (challenge.targetDate) {
              const deadline = new Date(challenge.targetDate)
              const now = new Date()
              if (now > deadline && challenge.status !== 'completed') {
                shouldTrigger = true
              }
            }
            break
        }

        // Apply grace period
        if (shouldTrigger && challenge.gracePeriod) {
          const lastCheckin = new Date(challenge.streak.lastCheckin || challenge.startDate)
          const graceEnd = new Date(lastCheckin.getTime() + challenge.gracePeriod * 60 * 60 * 1000)
          const now = new Date()

          if (now < graceEnd) {
            shouldTrigger = false
          }
        }

        if (shouldTrigger) {
          const triggeredPunishment = await triggerPunishment(
            punishment,
            challenge.id,
            challenge.name,
            request.nextUrl.origin
          )

          if (triggeredPunishment) {
            triggered.push({
              challengeId: challenge.id,
              challengeName: challenge.name,
              punishment: triggeredPunishment,
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      triggered,
      count: triggered.length,
    })
  } catch (error: any) {
    console.error('Error checking punishments:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

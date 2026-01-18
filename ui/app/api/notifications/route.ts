import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { PATHS } from '@/lib/paths'

interface Notification {
  id: string
  type: 'reminder' | 'achievement' | 'motivation' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  action?: {
    label: string
    href: string
  }
}

/**
 * GET /api/notifications
 *
 * Generates smart, dynamic notifications based on user's data:
 * - Upcoming todos
 * - Missed tasks
 * - Streak status
 * - Achievement milestones
 * - Motivational messages based on progress
 */
export async function GET() {
  const notifications: Notification[] = []
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentHour = now.getHours()

  try {
    // 1. Check Challenges & Streaks
    const challengesPath = path.join(PATHS.challenges)
    try {
      const challengeFolders = await fs.readdir(challengesPath)
      for (const folder of challengeFolders) {
        const folderPath = path.join(challengesPath, folder)
        const stat = await fs.stat(folderPath)

        if (stat.isDirectory()) {
          try {
            // Read challenge config
            const configPath = path.join(folderPath, 'challenge-config.json')
            const configContent = await fs.readFile(configPath, 'utf-8')
            const challenge = JSON.parse(configContent)

            // Read streak data
            let streak = { current: 0, lastCheckin: null }
            try {
              const streakPath = path.join(folderPath, 'streak.json')
              const streakContent = await fs.readFile(streakPath, 'utf-8')
              streak = JSON.parse(streakContent)
            } catch {
              // No streak file
            }

            if (challenge.status === 'active') {
              // Check streak health
              const lastCheckin = streak.lastCheckin
              if (lastCheckin) {
                const lastDate = new Date(lastCheckin)
                const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

                if (daysSince >= 1 && currentHour >= 18) {
                  notifications.push({
                    id: `streak-reminder-${folder}`,
                    type: 'warning',
                    title: '🔔 Check-in Reminder',
                    message: `Don't forget to check in for "${challenge.name}" to keep your ${streak.current || 0}-day streak!`,
                    timestamp: now.toISOString(),
                    read: false,
                    priority: 'high',
                    action: { label: 'Check In', href: '/streak' }
                  })
                }
              }

              // Achievement: 1 week streak
              if (streak.current === 7) {
                notifications.push({
                  id: `achievement-week-${folder}`,
                  type: 'achievement',
                  title: '🎉 1 Week Streak!',
                  message: `Amazing! You've completed 7 days on "${challenge.name}". Keep it up!`,
                  timestamp: now.toISOString(),
                  read: false,
                  priority: 'medium'
                })
              }

              // Achievement: 8+ day streak (current user status)
              if (streak.current >= 8) {
                notifications.push({
                  id: `achievement-strong-${folder}`,
                  type: 'achievement',
                  title: '🔥 Strong Streak!',
                  message: `${streak.current} days and counting on "${challenge.name}"! You're on fire!`,
                  timestamp: now.toISOString(),
                  read: false,
                  priority: 'low'
                })
              }

              // Progress milestone
              const progress = challenge.progress || 0
              if (progress >= 25 && progress < 35) {
                notifications.push({
                  id: `milestone-quarter-${folder}`,
                  type: 'info',
                  title: '📊 Quarter Complete!',
                  message: `You're 25% through "${challenge.name}". Great momentum!`,
                  timestamp: now.toISOString(),
                  read: false,
                  priority: 'low'
                })
              }
            }
          } catch {
            // Skip invalid challenge folders
          }
        }
      }
    } catch {
      // No challenges folder
    }

    // 2. Check Todos
    try {
      const todosPath = path.join(PATHS.todos)
      const todayFile = path.join(todosPath, `${today}.md`)

      try {
        const content = await fs.readFile(todayFile, 'utf-8')
        const todos = parseTodosFrontmatter(content)

        // Count pending for today
        const pendingToday = todos.filter(t => t.status !== 'completed').length

        if (pendingToday > 0 && currentHour >= 14) {
          notifications.push({
            id: `todos-pending-${today}`,
            type: 'reminder',
            title: `${pendingToday} Tasks Remaining`,
            message: `You have ${pendingToday} task${pendingToday > 1 ? 's' : ''} to complete today.`,
            timestamp: now.toISOString(),
            read: false,
            priority: pendingToday > 3 ? 'high' : 'medium',
            action: { label: 'View Tasks', href: '/todos' }
          })
        }

        // Check for overdue (with time)
        for (const todo of todos) {
          if (todo.time && todo.status !== 'completed') {
            const [hours, mins] = todo.time.split(':').map(Number)
            if (currentHour > hours || (currentHour === hours && now.getMinutes() > mins + 30)) {
              notifications.push({
                id: `overdue-${todo.id}`,
                type: 'warning',
                title: 'Overdue Task',
                message: `"${todo.text}" was scheduled for ${todo.time}`,
                timestamp: now.toISOString(),
                read: false,
                priority: 'high',
                action: { label: 'Complete Now', href: '/todos' }
              })
            }
          }
        }
      } catch {
        // No todos for today
      }
    } catch {
      // No todos folder
    }

    // 3. Motivational message based on time of day
    if (currentHour >= 6 && currentHour < 10) {
      notifications.push({
        id: `motivation-morning-${today}`,
        type: 'motivation',
        title: 'Good Morning! ☀️',
        message: getMotivationalQuote('morning'),
        timestamp: now.toISOString(),
        read: false,
        priority: 'low'
      })
    } else if (currentHour >= 12 && currentHour < 14) {
      notifications.push({
        id: `motivation-midday-${today}`,
        type: 'motivation',
        title: 'Midday Check-in 🌤️',
        message: getMotivationalQuote('midday'),
        timestamp: now.toISOString(),
        read: false,
        priority: 'low'
      })
    }

    // Sort by priority and timestamp
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return NextResponse.json({
      notifications,
      count: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    })

  } catch (error) {
    console.error('Error generating notifications:', error)
    return NextResponse.json({ notifications: [], count: 0, unreadCount: 0 })
  }
}

function parseChallengeFrontmatter(content: string): any {
  try {
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (match) {
      const frontmatter = match[1]
      const data: any = {}
      frontmatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length) {
          data[key.trim()] = valueParts.join(':').trim()
        }
      })
      return data
    }
    // Try JSON format
    return JSON.parse(content)
  } catch {
    return null
  }
}

function parseTodosFrontmatter(content: string): any[] {
  try {
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (match) {
      // Parse YAML-like frontmatter
      return []
    }
    return JSON.parse(content)
  } catch {
    return []
  }
}

function getMotivationalQuote(timeOfDay: 'morning' | 'midday' | 'evening'): string {
  const quotes = {
    morning: [
      "Small daily improvements lead to stunning results.",
      "The secret of getting ahead is getting started.",
      "Every day is a new opportunity to improve yourself.",
      "Focus on progress, not perfection."
    ],
    midday: [
      "You're doing great! Keep the momentum going.",
      "Halfway through the day - stay focused!",
      "Remember why you started this challenge.",
      "Every task completed is a step forward."
    ],
    evening: [
      "Reflect on today's wins, no matter how small.",
      "Rest well, tomorrow is another opportunity.",
      "Consistency beats intensity.",
      "You showed up today - that matters."
    ]
  }

  const options = quotes[timeOfDay]
  return options[Math.floor(Math.random() * options.length)]
}

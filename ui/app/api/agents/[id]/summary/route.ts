import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { DATA_DIR } from '@/lib/paths'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const agentDir = path.join(DATA_DIR, 'agents', agentId)

    // Gather all data sources
    const [checkins, challenges, chatHistory] = await Promise.all([
      loadCheckins(agentDir),
      loadChallenges(agentDir),
      loadChatHistory(agentDir),
    ])

    // Calculate statistics from challenges (more accurate)
    const totalCheckins = challenges.reduce((sum, c) => sum + (c.streak?.current || 0), 0) || checkins.length
    const activeDays = challenges.reduce((max, c) => Math.max(max, c.currentDay || 0), 0) || new Set(checkins.map(c => c.date)).size
    const currentStreak = challenges.reduce((max, c) => Math.max(max, c.streak?.current || 0), 0) || calculateCurrentStreak(checkins)
    const overallProgress = calculateOverallProgress(challenges)

    // Extract key milestones
    const keyMilestones = extractMilestones(checkins, challenges)

    // Generate AI summary
    const summary = await generateSummary({
      agentId,
      checkins,
      challenges,
      chatHistory,
      stats: {
        totalCheckins,
        activeDays,
        currentStreak,
        overallProgress,
      },
    })

    return NextResponse.json({
      summary,
      totalCheckins,
      activeDays,
      currentStreak,
      overallProgress,
      keyMilestones,
    })
  } catch (error) {
    console.error('Failed to generate summary:', error)
    return NextResponse.json(
      {
        summary: 'Unable to generate summary at this time.',
        totalCheckins: 0,
        activeDays: 0,
        currentStreak: 0,
        overallProgress: 0,
        keyMilestones: [],
      },
      { status: 200 } // Return empty data instead of error
    )
  }
}

// Load all check-ins
async function loadCheckins(agentDir: string) {
  const checkins: any[] = []
  try {
    const checkinsDir = path.join(agentDir, 'checkins')
    const files = await fs.readdir(checkinsDir)

    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(checkinsDir, file), 'utf-8')
        const { data, content: body } = matter(content)
        checkins.push({
          date: file.replace('.md', ''),
          ...data,
          content: body,
        })
      }
    }
  } catch (error) {
    // No checkins yet
  }

  return checkins.sort((a, b) => a.date.localeCompare(b.date))
}

// Load all challenges from global challenges folder
async function loadChallenges(agentDir: string) {
  const challenges: any[] = []
  const agentId = path.basename(agentDir)

  try {
    // Load from global challenges folder
    const challengesDir = path.join(DATA_DIR, 'challenges')
    const folders = await fs.readdir(challengesDir)

    for (const folder of folders) {
      const configPath = path.join(challengesDir, folder, 'challenge-config.json')
      try {
        const content = await fs.readFile(configPath, 'utf-8')
        const challenge = JSON.parse(content)
        // Only include challenges for this agent
        if (challenge.agent === agentId || !challenge.agent) {
          challenges.push(challenge)
        }
      } catch {
        // Skip invalid folders
      }
    }
  } catch (error) {
    // No challenges folder
  }

  return challenges
}

// Load chat history
async function loadChatHistory(agentDir: string) {
  const messages: any[] = []
  try {
    const chatDir = path.join(agentDir, 'chats')
    const files = await fs.readdir(chatDir)

    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(chatDir, file), 'utf-8')
        const { data, content: body } = matter(content)
        messages.push({
          date: file.replace('.md', ''),
          ...data,
          content: body,
        })
      }
    }
  } catch (error) {
    // No chat history yet
  }

  return messages.sort((a, b) => a.date.localeCompare(b.date))
}

// Calculate current streak
function calculateCurrentStreak(checkins: any[]): number {
  if (checkins.length === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const sortedCheckins = [...checkins].sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  let currentDate = new Date(today)

  for (const checkin of sortedCheckins) {
    const checkinDate = checkin.date
    const expectedDate = currentDate.toISOString().split('T')[0]

    if (checkinDate === expectedDate) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

// Calculate overall progress
function calculateOverallProgress(challenges: any[]): number {
  if (challenges.length === 0) return 0

  const totalProgress = challenges.reduce((sum, c) => sum + (c.progress || 0), 0)
  return Math.round(totalProgress / challenges.length)
}

// Extract key milestones
function extractMilestones(checkins: any[], challenges: any[]): string[] {
  const milestones: string[] = []

  // Active challenges info
  const activeChallenge = challenges.find(c => c.status === 'active')
  if (activeChallenge) {
    milestones.push(`Day ${activeChallenge.currentDay || 1} of ${activeChallenge.totalDays || 30} on "${activeChallenge.name}"`)
  }

  // First check-in / start date
  if (activeChallenge?.startDate) {
    milestones.push(`Started on ${activeChallenge.startDate}`)
  } else if (checkins.length > 0) {
    milestones.push(`Started journey on ${checkins[0].date}`)
  }

  // Completed challenges
  const completed = challenges.filter(c => c.status === 'completed')
  if (completed.length > 0) {
    milestones.push(`Completed ${completed.length} challenge${completed.length > 1 ? 's' : ''}`)
  }

  // Streak milestones
  const streaks = challenges.map(c => c.streak?.best || c.streak?.current || 0)
  const bestStreak = Math.max(...streaks, 0)
  if (bestStreak >= 7) {
    milestones.push(`Achieved ${bestStreak}-day streak`)
  }

  // Challenge milestones
  if (activeChallenge?.milestones) {
    const completedMilestones = activeChallenge.milestones.filter((m: any) => m.completed)
    if (completedMilestones.length > 0) {
      milestones.push(`${completedMilestones.length} milestone${completedMilestones.length > 1 ? 's' : ''} reached`)
    }
  }

  return milestones.slice(0, 5) // Max 5 milestones
}

// Generate AI summary using Gemini
async function generateSummary(data: any): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are analyzing a user's accountability journey with an AI agent. Generate a warm, insightful, and personalized 2-3 paragraph summary of their progress.

Agent ID: ${data.agentId}
Total Check-ins: ${data.stats.totalCheckins}
Active Days: ${data.stats.activeDays}
Current Streak: ${data.stats.currentStreak}
Overall Progress: ${data.stats.overallProgress}%

Recent Check-ins:
${data.checkins.slice(-5).map((c: any) => `- ${c.date}: Mood ${c.mood}/5, ${c.completed ? 'Completed' : 'Pending'}`).join('\n')}

Active Challenges:
${data.challenges.map((c: any) => `- ${c.name}: ${c.progress}% (${c.status})`).join('\n')}

Write a summary that:
1. Acknowledges their journey and progress
2. Highlights patterns in their check-ins and mood
3. Celebrates wins and milestones
4. Provides encouraging insights about their growth
5. Is personal, warm, and motivating

Keep it concise (2-3 paragraphs) and conversational.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini API error:', error)

    // Fallback summary
    return `You've been on this journey for ${data.stats.activeDays} active days with ${data.stats.totalCheckins} check-ins completed. Your dedication shows in your ${data.stats.currentStreak}-day current streak.

${data.stats.overallProgress > 50
  ? `You're making excellent progress at ${data.stats.overallProgress}%. Your consistency is building momentum.`
  : `You're ${data.stats.overallProgress}% through your goals. Every step forward counts, and you're building valuable habits.`}

${data.challenges.length > 0
  ? `With ${data.challenges.length} active challenge${data.challenges.length > 1 ? 's' : ''}, you're committed to growth. Keep going!`
  : `Ready to start a new challenge? This is the perfect time to set a goal and track your progress.`}`
  }
}

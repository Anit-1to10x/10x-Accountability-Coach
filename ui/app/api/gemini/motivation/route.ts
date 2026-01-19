import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/api/openanalyst-client'

/**
 * Generate personalized motivation using OpenAnalyst API
 * Note: Gemini is reserved for media generation (images, videos, audio)
 * All text generation uses OpenAnalyst for consistency
 */
export async function POST(request: NextRequest) {
  try {
    const context = await request.json()

    if (!context.challengeName) {
      return NextResponse.json({ error: 'Missing challenge name' }, { status: 400 })
    }

    const motivation = await generateMotivation(context)

    return NextResponse.json({ motivation })
  } catch (error) {
    console.error('Motivation API error:', error)
    return NextResponse.json({ error: 'Failed to generate motivation' }, { status: 500 })
  }
}

async function generateMotivation(context: {
  challengeName: string
  currentStreak: number
  recentWins: string[]
  goals: string[]
}): Promise<string> {
  const systemPrompt = `You are an accountability coach. Generate a personalized motivational message.

Challenge: ${context.challengeName}
Current Streak: ${context.currentStreak} days
Recent Wins: ${context.recentWins?.join(', ') || 'Just getting started'}
Goals: ${context.goals?.join(', ') || 'Personal growth'}

Create a motivational message that:
1. References their specific achievements (no generic quotes!)
2. Connects past wins to future goals
3. Is encouraging but realistic
4. Uses their actual streak number
5. Is 2-3 sentences max

Return only the motivational message.`

  try {
    const response = await chat(
      [{ role: 'user', content: 'Generate a personalized motivational message for me.' }],
      systemPrompt,
      { maxTokens: 256 }
    )

    return response.trim()
  } catch (error) {
    console.error('OpenAnalyst API error:', error)

    // Fallback motivation based on data
    if (context.currentStreak >= 7) {
      return `Your ${context.currentStreak}-day streak shows incredible commitment! You're building momentum that will carry you to your goals.`
    } else if (context.currentStreak > 0) {
      return `${context.currentStreak} days and counting! Every day you show up, you're one step closer to where you want to be.`
    } else {
      return `Today is a new opportunity. Your ${context.challengeName} journey starts now - let's make it count!`
    }
  }
}

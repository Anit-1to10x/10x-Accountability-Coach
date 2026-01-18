import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { summary } = body

    // Generate personalized quote using Gemini
    const quote = await generateQuote(summary)

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Failed to generate quote:', error)
    return NextResponse.json(
      { quote: 'Every step forward is progress. Keep going!' },
      { status: 200 }
    )
  }
}

async function generateQuote(summaryData: any): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are a motivational quote generator for an accountability coach app. Based on the user's journey data, create ONE powerful, personalized motivational quote.

User Journey Data:
Summary: ${summaryData?.summary || 'User is starting their journey'}
Total Check-ins: ${summaryData?.totalCheckins || 0}
Current Streak: ${summaryData?.currentStreak || 0} days
Overall Progress: ${summaryData?.overallProgress || 0}%
Key Milestones: ${summaryData?.keyMilestones?.join(', ') || 'Just getting started'}

Requirements for the quote:
1. Make it deeply personal based on their actual progress
2. Reference their specific achievements (streak, milestones, progress)
3. Be inspirational but grounded in their reality
4. Keep it to 1-2 sentences (max 150 characters)
5. Use "you" and "your" to make it personal
6. DO NOT use generic motivational quotes
7. DO NOT include quotation marks in your response

Examples of GOOD personalized quotes:
- "Your 15-day streak proves consistency is your superpower. The momentum you've built is unstoppable."
- "From zero to 23 check-ins—you've transformed intention into action. Your future self is already thanking you."
- "Every one of your 47 check-ins was a choice to show up. That dedication is building the life you want."

Generate ONE powerful quote now:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let quote = response.text().trim()

    // Remove quotes if Gemini added them
    quote = quote.replace(/^["']|["']$/g, '')

    return quote
  } catch (error) {
    console.error('Gemini API error:', error)

    // Fallback quotes based on data
    if (summaryData?.currentStreak >= 7) {
      return `Your ${summaryData.currentStreak}-day streak shows your commitment is unbreakable. Keep building on this foundation.`
    } else if (summaryData?.totalCheckins >= 10) {
      return `${summaryData.totalCheckins} check-ins completed—each one a testament to your dedication. You're creating lasting change.`
    } else if (summaryData?.overallProgress >= 50) {
      return `At ${summaryData.overallProgress}% progress, you're past the halfway point. The finish line is closer than you think.`
    } else {
      return 'Every journey begins with a single step. You\'ve already started—that\'s the hardest part.'
    }
  }
}

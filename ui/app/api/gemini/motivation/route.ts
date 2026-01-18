import { NextRequest, NextResponse } from 'next/server'
import { generateMotivation } from '@/lib/gemini'

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

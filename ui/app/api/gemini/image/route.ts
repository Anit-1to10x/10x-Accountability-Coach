import { NextRequest, NextResponse } from 'next/server'
import { generateVisionBoardPrompt } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { challenge, goals, userImagePath } = await request.json()

    if (!challenge || !goals) {
      return NextResponse.json({ error: 'Missing challenge or goals' }, { status: 400 })
    }

    const imagePrompt = await generateVisionBoardPrompt(challenge, goals, userImagePath)

    // Note: Actual image generation would happen here using Imagen API
    // For now, return the prompt

    return NextResponse.json({
      success: true,
      prompt: imagePrompt,
      message: 'Vision board prompt generated. Use this with Imagen API to create the image.',
    })
  } catch (error) {
    console.error('Image generation API error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}

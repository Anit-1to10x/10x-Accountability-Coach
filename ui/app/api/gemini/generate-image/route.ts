import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const result = await generateImage(prompt, true)

    if (result.success) {
      return NextResponse.json({
        success: true,
        url: result.url,
        filename: result.filename,
        prompt: result.prompt,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Image generation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { generateVideo, checkVideoStatus } from '@/lib/gemini'

/**
 * Video Generation API
 *
 * Uses Gemini Veo API for video generation.
 * Note: Video generation is async - it returns a taskId for polling.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration, resolution, aspectRatio, profileId, taskId } = body

    // If taskId is provided, check status
    if (taskId) {
      const status = await checkVideoStatus(taskId)
      return NextResponse.json(status)
    }

    // Generate new video
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await generateVideo(prompt, {
      duration: duration || 8,
      resolution: resolution || '1080p',
      aspectRatio: aspectRatio || '16:9',
      profileId,
      saveToAssets: true,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Video generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    )
  }
}

// Check video status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  const status = await checkVideoStatus(taskId)
  return NextResponse.json(status)
}

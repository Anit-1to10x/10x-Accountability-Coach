import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { VisionBoard } from '@/types/visionboard'
import { PATHS, getProfilePaths } from '@/lib/paths'

const getVisionBoardsDir = (profileId?: string | null) => {
  return profileId ? getProfilePaths(profileId).visionboards : PATHS.visionboards
}

// GET - List all vision boards
export async function GET(request: NextRequest) {
  try {
    // Get active profile ID from header or query param
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    const visionboardsDir = getVisionBoardsDir(profileId)

    // Ensure directory exists
    await fs.mkdir(visionboardsDir, { recursive: true })

    const entries = await fs.readdir(visionboardsDir, { withFileTypes: true })
    const visionboards: VisionBoard[] = []

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = path.join(visionboardsDir, entry.name)
        const content = await fs.readFile(filePath, 'utf-8')
        const visionboard = JSON.parse(content)
        visionboards.push(visionboard)
      }
    }

    // Sort by creation date (newest first)
    visionboards.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ visionboards })
  } catch (error) {
    console.error('Failed to load vision boards:', error)
    return NextResponse.json(
      { error: 'Failed to load vision boards', visionboards: [] },
      { status: 500 }
    )
  }
}

// POST - Create a new vision board
export async function POST(request: NextRequest) {
  try {
    const newBoard: VisionBoard = await request.json()

    // Get active profile ID from header or query param
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    const visionboardsDir = getVisionBoardsDir(profileId)

    // Ensure directory exists
    await fs.mkdir(visionboardsDir, { recursive: true })

    // Create vision board file
    const boardPath = path.join(visionboardsDir, `${newBoard.id}.json`)

    // Add timestamps
    newBoard.createdAt = new Date().toISOString()
    newBoard.updatedAt = new Date().toISOString()

    await fs.writeFile(boardPath, JSON.stringify(newBoard, null, 2), 'utf-8')

    // Create assets directory for this vision board
    const assetsDir = path.join(visionboardsDir, newBoard.id, 'images')
    await fs.mkdir(assetsDir, { recursive: true })

    // Update architecture index
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'visionboard_created',
          data: {
            id: newBoard.id,
            title: newBoard.title,
            imageCount: newBoard.images.length
          }
        })
      })
    } catch (indexError) {
      console.warn('Failed to update index:', indexError)
    }

    return NextResponse.json({ success: true, visionboard: newBoard })
  } catch (error) {
    console.error('Failed to create vision board:', error)
    return NextResponse.json(
      { error: 'Failed to create vision board' },
      { status: 500 }
    )
  }
}

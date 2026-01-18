import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { VisionBoard } from '@/types/visionboard'
import { PATHS } from '@/lib/paths'

const getVisionBoardsDir = () => PATHS.visionboards

// GET - Get individual vision board
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visionboardsDir = getVisionBoardsDir()
    const boardPath = path.join(visionboardsDir, `${params.id}.json`)

    const content = await fs.readFile(boardPath, 'utf-8')
    const visionboard = JSON.parse(content)

    return NextResponse.json(visionboard)
  } catch (error) {
    console.error('Failed to load vision board:', error)
    return NextResponse.json(
      { error: 'Vision board not found' },
      { status: 404 }
    )
  }
}

// PUT - Update vision board
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates: Partial<VisionBoard> = await request.json()
    const visionboardsDir = getVisionBoardsDir()
    const boardPath = path.join(visionboardsDir, `${params.id}.json`)

    // Read existing board
    const content = await fs.readFile(boardPath, 'utf-8')
    const currentBoard: VisionBoard = JSON.parse(content)

    // Merge updates
    const updatedBoard: VisionBoard = {
      ...currentBoard,
      ...updates,
      id: params.id,  // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }

    // Save
    await fs.writeFile(boardPath, JSON.stringify(updatedBoard, null, 2), 'utf-8')

    return NextResponse.json({ success: true, visionboard: updatedBoard })
  } catch (error) {
    console.error('Failed to update vision board:', error)
    return NextResponse.json(
      { error: 'Failed to update vision board' },
      { status: 500 }
    )
  }
}

// DELETE - Delete vision board
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visionboardsDir = getVisionBoardsDir()
    const boardPath = path.join(visionboardsDir, `${params.id}.json`)

    // Delete the JSON file
    await fs.unlink(boardPath)

    // Delete the assets directory (if exists)
    const assetsDir = path.join(visionboardsDir, params.id)
    try {
      await fs.rm(assetsDir, { recursive: true, force: true })
    } catch {
      // Directory might not exist, that's okay
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete vision board:', error)
    return NextResponse.json(
      { error: 'Failed to delete vision board' },
      { status: 500 }
    )
  }
}

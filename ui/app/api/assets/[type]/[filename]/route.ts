import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SHARED_PATHS } from '@/lib/paths'

// GET - Serve an asset file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  try {
    const { type, filename } = await params

    // Validate type
    const validTypes = ['images', 'videos', 'audio', 'uploads']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 })
    }

    // Prevent path traversal
    const safeFilename = path.basename(filename)
    const filepath = path.join(SHARED_PATHS.assets, type, safeFilename)

    // Check if file exists
    try {
      await fs.access(filepath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await fs.readFile(filepath)

    // Determine content type
    const contentType = getContentType(safeFilename)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Asset serve error:', error)
    return NextResponse.json({ error: 'Failed to serve asset' }, { status: 500 })
  }
}

// DELETE - Remove an asset file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  try {
    const { type, filename } = await params

    const validTypes = ['images', 'videos', 'audio', 'uploads']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 })
    }

    const safeFilename = path.basename(filename)
    const filepath = path.join(SHARED_PATHS.assets, type, safeFilename)

    await fs.unlink(filepath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Asset delete error:', error)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

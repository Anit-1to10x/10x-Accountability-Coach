import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SHARED_PATHS } from '@/lib/paths'

// POST - Upload a file to assets
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'uploads' // images, videos, audio, uploads

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['images', 'videos', 'audio', 'uploads']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid asset type' }, { status: 400 })
    }

    // Get file extension
    const ext = path.extname(file.name) || getExtensionFromMime(file.type)
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`

    // Create directory if needed
    const assetsDir = path.join(SHARED_PATHS.assets, type)
    await fs.mkdir(assetsDir, { recursive: true })

    // Save file
    const filepath = path.join(assetsDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      filename,
      filepath,
      url: `/api/assets/${type}/${filename}`,
      type,
      size: buffer.length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
  }
  return mimeMap[mimeType] || '.bin'
}

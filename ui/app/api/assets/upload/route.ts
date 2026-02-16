/**
 * Asset Upload API
 *
 * Handles image uploads for vision boards, avatars, chat, and general assets.
 * Supports profile-specific storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SHARED_PATHS, getProfilePaths } from '@/lib/paths'

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Valid categories for uploads
const VALID_CATEGORIES = ['images', 'videos', 'audio', 'uploads', 'visionboards', 'avatars', 'chat']

// POST - Upload a file to assets
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('type') || formData.get('category') || 'uploads') as string
    const profileId = formData.get('profileId') as string | null
    const customFilename = formData.get('filename') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get file extension
    const ext = path.extname(file.name) || getExtensionFromMime(file.type)
    const filename = customFilename || `${category}-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`

    // Determine save directory based on profile and category
    let assetsDir: string

    if (profileId) {
      const profilePaths = getProfilePaths(profileId)
      switch (category) {
        case 'visionboards':
          assetsDir = profilePaths.visionboards
          break
        case 'avatars':
          assetsDir = path.join(profilePaths.profile, 'avatars')
          break
        case 'chat':
          assetsDir = path.join(profilePaths.chats, 'uploads')
          break
        default:
          assetsDir = path.join(profilePaths.profile, category)
      }
    } else {
      assetsDir = path.join(SHARED_PATHS.assets, category)
    }

    await fs.mkdir(assetsDir, { recursive: true })

    // Save file
    const filepath = path.join(assetsDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filepath, buffer)

    // Build URL - include profileId if provided for retrieval
    const urlParams = profileId ? `?profileId=${profileId}` : ''
    const url = `/api/assets/${category}/${filename}${urlParams}`

    // Also return base64 data for immediate use
    const base64Data = buffer.toString('base64')
    const mimeType = file.type || 'application/octet-stream'

    return NextResponse.json({
      success: true,
      filename,
      filepath,
      url,
      category,
      size: buffer.length,
      mimeType,
      base64: `data:${mimeType};base64,${base64Data}`,
      profileId,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get upload capabilities
 */
export async function GET() {
  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    validCategories: VALID_CATEGORIES,
    supportedMimeTypes: Object.keys(getMimeMap()),
  })
}

function getExtensionFromMime(mimeType: string): string {
  const mimeMap = getMimeMap()
  return mimeMap[mimeType] || '.bin'
}

function getMimeMap(): Record<string, string> {
  return {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/webm': '.weba',
    'application/pdf': '.pdf',
  }
}

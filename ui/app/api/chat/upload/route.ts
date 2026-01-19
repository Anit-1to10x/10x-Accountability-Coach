import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, getProfilePaths } from '@/lib/paths'

// Allowed file extensions for upload
const ALLOWED_EXTENSIONS = [
  // Documents
  '.md', '.txt', '.json', '.yaml', '.yml', '.csv', '.pdf',
  // Code
  '.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.sql',
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  // Archives (view only)
  '.zip',
  // Data
  '.xml',
]

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

function getFileCategory(filename: string): string {
  const ext = path.extname(filename).toLowerCase()

  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'images'
  if (['.mp4', '.webm', '.mov'].includes(ext)) return 'videos'
  if (['.mp3', '.wav'].includes(ext)) return 'audio'
  if (['.pdf'].includes(ext)) return 'documents'
  if (['.md', '.txt'].includes(ext)) return 'notes'
  if (['.json', '.yaml', '.yml', '.csv', '.xml'].includes(ext)) return 'data'
  if (['.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.sql'].includes(ext)) return 'code'
  if (['.zip'].includes(ext)) return 'archives'
  return 'files'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const agentId = formData.get('agentId') as string || 'unified'
    const profileId = formData.get('profileId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type ${ext} is not allowed` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Determine storage location
    let uploadDir: string

    if (agentId && agentId !== 'unified') {
      // Save to agent workspace
      const category = getFileCategory(file.name)
      uploadDir = path.join(DATA_DIR, 'agents', agentId, category)
    } else if (profileId) {
      // Save to profile uploads
      const profilePaths = getProfilePaths(profileId)
      uploadDir = path.join(profilePaths.profile, 'uploads')
    } else {
      // Save to shared uploads
      uploadDir = path.join(DATA_DIR, 'assets', 'uploads')
    }

    await fs.mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
    const timestamp = Date.now()
    const filename = `${path.basename(safeName, ext)}-${timestamp}${ext}`
    const filepath = path.join(uploadDir, filename)

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filepath, buffer)

    // Generate URL for the file
    let url: string
    if (agentId && agentId !== 'unified') {
      const category = getFileCategory(file.name)
      url = `/api/assets/agents/${agentId}/${category}/${filename}`
    } else {
      url = `/api/assets/uploads/${filename}`
    }

    // Read text content for text files
    let content: string | null = null
    const textExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.csv', '.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.sql', '.xml']
    if (textExtensions.includes(ext)) {
      content = buffer.toString('utf-8')
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        savedAs: filename,
        path: filepath,
        url,
        size: file.size,
        type: file.type,
        category: getFileCategory(file.name),
        content: content?.substring(0, 5000), // First 5000 chars for preview
        hasMore: content ? content.length > 5000 : false,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

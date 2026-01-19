import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.js': 'application/javascript',
  '.ts': 'text/typescript',
  '.css': 'text/css',
  '.html': 'text/html',
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct file path from segments
    const filePath = params.path.join('/')
    const fullPath = path.join(DATA_DIR, 'agents', filePath)

    // Security: ensure path is within agents directory
    const agentsDir = path.join(DATA_DIR, 'agents')
    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(agentsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const stats = await fs.stat(fullPath)
    if (stats.isDirectory()) {
      return NextResponse.json({ error: 'Path is a directory' }, { status: 400 })
    }

    const buffer = await fs.readFile(fullPath)
    const mimeType = getMimeType(fullPath)

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
      },
    })
  } catch (error) {
    console.error('Failed to serve asset:', error)
    return NextResponse.json(
      { error: 'Failed to serve asset' },
      { status: 500 }
    )
  }
}

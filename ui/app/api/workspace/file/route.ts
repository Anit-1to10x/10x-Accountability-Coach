import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
  // Text
  'txt': 'text/plain',
  'md': 'text/markdown',
  'json': 'application/json',
  'js': 'text/javascript',
  'ts': 'text/typescript',
  'jsx': 'text/javascript',
  'tsx': 'text/typescript',
  'css': 'text/css',
  'html': 'text/html',
  'xml': 'text/xml',
  'yaml': 'text/yaml',
  'yml': 'text/yaml',
  'csv': 'text/csv',

  // Images
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'bmp': 'image/bmp',

  // Video
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',

  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'm4a': 'audio/mp4',

  // Documents
  'pdf': 'application/pdf',

  // Archives
  'zip': 'application/zip',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const binaryExts = [
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico',
    'mp4', 'webm', 'mov', 'avi',
    'mp3', 'wav', 'ogg', 'm4a',
    'pdf', 'zip', 'tar', 'gz', 'exe', 'dll', 'so'
  ]
  return binaryExts.includes(ext)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Path is required' },
        { status: 400 }
      )
    }

    const targetPath = path.join(DATA_DIR, filePath)

    // Validate path is within DATA_DIR (security check)
    const resolvedPath = path.resolve(targetPath)
    const resolvedDataDir = path.resolve(DATA_DIR)
    if (!resolvedPath.startsWith(resolvedDataDir)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path - access denied' },
        { status: 403 }
      )
    }

    // Check if file exists
    try {
      await fs.access(targetPath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = await fs.stat(targetPath)

    if (stats.isDirectory()) {
      return NextResponse.json(
        { success: false, error: 'Path is a directory, not a file' },
        { status: 400 }
      )
    }

    const mimeType = getMimeType(targetPath)
    const binary = isBinaryFile(targetPath)

    // Read file content
    const content = await fs.readFile(targetPath)

    // Return with appropriate headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': binary ? 'public, max-age=31536000' : 'no-cache',
        'Content-Disposition': binary ? `inline; filename="${path.basename(targetPath)}"` : 'inline',
      },
    })

  } catch (error: any) {
    console.error('Error fetching file:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Save/Update file content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: filePath, content } = body

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Path is required' },
        { status: 400 }
      )
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    const targetPath = path.join(DATA_DIR, filePath)

    // Validate path is within DATA_DIR (security check)
    const resolvedPath = path.resolve(targetPath)
    const resolvedDataDir = path.resolve(DATA_DIR)
    if (!resolvedPath.startsWith(resolvedDataDir)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path - access denied' },
        { status: 403 }
      )
    }

    // Check if it's a binary file (don't allow editing binary files)
    if (isBinaryFile(targetPath)) {
      return NextResponse.json(
        { success: false, error: 'Cannot edit binary files' },
        { status: 400 }
      )
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(targetPath)
    await fs.mkdir(parentDir, { recursive: true })

    // Write the file content
    await fs.writeFile(targetPath, content, 'utf-8')

    // Get updated file stats
    const stats = await fs.stat(targetPath)

    return NextResponse.json({
      success: true,
      message: 'File saved successfully',
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    })

  } catch (error: any) {
    console.error('Error saving file:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

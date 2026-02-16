import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'
import { getDataSource } from '@/lib/data-source'

// File type icons and categories
const FILE_CATEGORIES: Record<string, string> = {
  '.md': 'document',
  '.txt': 'document',
  '.json': 'code',
  '.js': 'code',
  '.ts': 'code',
  '.py': 'code',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.svg': 'image',
  '.mp4': 'video',
  '.webm': 'video',
  '.mov': 'video',
  '.mp3': 'audio',
  '.wav': 'audio',
  '.pdf': 'pdf',
}

function getFileCategory(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return FILE_CATEGORIES[ext] || 'file'
}

async function buildFileTree(dirPath: string, basePath: string = ''): Promise<any[]> {
  const nodes = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.join(basePath, entry.name)

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, relativePath)
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children,
          fileCount: children.length,
        })
      } else {
        const stats = await fs.stat(fullPath)
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          category: getFileCategory(entry.name),
          size: stats.size,
          modified: stats.mtime.toISOString(),
          extension: path.extname(entry.name).toLowerCase(),
        })
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error)
  }

  // Sort: directories first, then files alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

// GET - List files for agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const agentDir = path.join(DATA_DIR, 'agents', agentId)
    const searchParams = request.nextUrl.searchParams
    const filePath = searchParams.get('path')

    // If path is provided, read file content
    if (filePath) {
      const fullPath = path.join(DATA_DIR, 'agents', filePath)

      // Security: ensure path is within agent directory
      if (!fullPath.startsWith(path.join(DATA_DIR, 'agents', agentId))) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
      }

      try {
        const stats = await fs.stat(fullPath)

        if (stats.isDirectory()) {
          return NextResponse.json({ error: 'Path is a directory' }, { status: 400 })
        }

        const ext = path.extname(fullPath).toLowerCase()
        const category = getFileCategory(fullPath)

        // For binary files (images, videos, audio), return metadata only
        if (['image', 'video', 'audio', 'pdf'].includes(category)) {
          return NextResponse.json({
            name: path.basename(fullPath),
            path: filePath,
            category,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            url: `/api/assets/agents/${filePath}`,
            isBinary: true,
          })
        }

        // For text files, return content
        const content = await fs.readFile(fullPath, 'utf-8')
        return NextResponse.json({
          name: path.basename(fullPath),
          path: filePath,
          category,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          content,
          isBinary: false,
        })
      } catch (error) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }

    // Otherwise, return file tree
    try {
      await fs.access(agentDir)
    } catch {
      // Agent directory doesn't exist, create it with structure
      await fs.mkdir(agentDir, { recursive: true })
      const dirs = ['files', 'images', 'videos', 'summaries', 'notes', 'exports', 'chats', 'generated']
      for (const dir of dirs) {
        await fs.mkdir(path.join(agentDir, dir), { recursive: true })
      }
      return NextResponse.json([])
    }

    const tree = await buildFileTree(agentDir, agentId)
    return NextResponse.json(tree)
  } catch (error) {
    console.error('Failed to load file tree:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// POST - Upload file to agent workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string || 'files'
    const customName = formData.get('name') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate folder
    const allowedFolders = ['files', 'images', 'videos', 'notes', 'summaries', 'exports', 'generated']
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    // Determine storage location based on settings
    const dataSource = getDataSource()

    if (dataSource === 'local' || dataSource === 'mcp') {
      // Save to local filesystem
      const agentDir = path.join(DATA_DIR, 'agents', agentId, folder)
      await fs.mkdir(agentDir, { recursive: true })

      // Generate filename
      const ext = path.extname(file.name)
      const baseName = customName || path.basename(file.name, ext)
      const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-')
      const timestamp = Date.now()
      const filename = `${safeName}-${timestamp}${ext}`
      const filepath = path.join(agentDir, filename)

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(filepath, buffer)

      return NextResponse.json({
        success: true,
        file: {
          name: filename,
          path: path.join(agentId, folder, filename),
          category: getFileCategory(filename),
          size: file.size,
          url: `/api/assets/agents/${agentId}/${folder}/${filename}`,
        },
      })
    } else if (dataSource === 'supabase') {
      // TODO: Upload to Supabase Storage
      // For now, fall back to local
      return NextResponse.json(
        { error: 'Supabase storage not yet implemented' },
        { status: 501 }
      )
    }

    return NextResponse.json({ error: 'Unknown data source' }, { status: 500 })
  } catch (error) {
    console.error('Failed to upload file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE - Delete file from agent workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { path: filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    const fullPath = path.join(DATA_DIR, 'agents', filePath)

    // Security: ensure path is within agent directory
    if (!fullPath.startsWith(path.join(DATA_DIR, 'agents', agentId))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete file
    await fs.unlink(fullPath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

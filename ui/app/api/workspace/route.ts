import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

interface FileItem {
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: string
  children?: FileItem[]
  extension?: string
}

async function getDirectoryContents(dirPath: string, depth: number = 0, maxDepth: number = 2): Promise<FileItem[]> {
  const items: FileItem[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      // Skip hidden files and cache directories
      if (entry.name.startsWith('.')) continue

      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.relative(DATA_DIR, fullPath)

      if (entry.isDirectory()) {
        const item: FileItem = {
          name: entry.name,
          type: 'folder',
          path: relativePath,
        }

        // Only recurse if within depth limit
        if (depth < maxDepth) {
          item.children = await getDirectoryContents(fullPath, depth + 1, maxDepth)
        }

        items.push(item)
      } else {
        const stats = await fs.stat(fullPath)
        const extension = path.extname(entry.name).slice(1)

        items.push({
          name: entry.name,
          type: 'file',
          path: relativePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          extension,
        })
      }
    }

    // Sort: folders first, then files, alphabetically
    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })

    return items
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subPath = searchParams.get('path') || ''
    const depth = parseInt(searchParams.get('depth') || '2')

    const targetPath = subPath ? path.join(DATA_DIR, subPath) : DATA_DIR

    // Validate path is within DATA_DIR
    const resolvedPath = path.resolve(targetPath)
    if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      )
    }

    const contents = await getDirectoryContents(targetPath, 0, depth)

    // Get folder stats
    const stats = await fs.stat(targetPath)

    return NextResponse.json({
      success: true,
      path: subPath || '/',
      contents,
      modified: stats.mtime.toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

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
        })
      } else {
        const stats = await fs.stat(fullPath)
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
        })
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error)
  }

  return nodes
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const agentDir = path.join(DATA_DIR, 'agents', agentId)

    try {
      await fs.access(agentDir)
    } catch {
      // Agent directory doesn't exist, create it
      await fs.mkdir(agentDir, { recursive: true })
      return NextResponse.json([])
    }

    const tree = await buildFileTree(agentDir, agentId)
    return NextResponse.json(tree)
  } catch (error) {
    console.error('Failed to load file tree:', error)
    return NextResponse.json([], { status: 500 })
  }
}

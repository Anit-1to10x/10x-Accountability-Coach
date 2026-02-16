import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    const fullPath = path.join(DATA_DIR, 'agents', filePath)

    const content = await fs.readFile(fullPath, 'utf-8')
    const ext = path.extname(fullPath)
    let type = 'text'
    if (ext === '.md') type = 'markdown'
    else if (ext === '.json') type = 'json'

    return NextResponse.json({ content, type, path: filePath })
  } catch (error) {
    console.error('Failed to read file:', error)
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json()

    if (!filePath || content === undefined) {
      return NextResponse.json({ error: 'Missing path or content' }, { status: 400 })
    }

    const fullPath = path.join(DATA_DIR, 'agents', filePath)

    await fs.writeFile(fullPath, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to write file:', error)
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 })
  }
}

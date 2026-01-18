import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

const RESOLUTION_FILE = path.join(PATHS.profile, 'resolution.md')

// GET: Read user's New Year resolution
export async function GET() {
  try {
    const content = await fs.readFile(RESOLUTION_FILE, 'utf-8')

    // Parse resolution from markdown
    const resolutionMatch = content.match(/## Resolution\s*\n\s*([\s\S]+?)(?:\n---|\n##|$)/)
    const resolution = resolutionMatch ? resolutionMatch[1].trim() : null

    const dateMatch = content.match(/\*\*Set on:\*\*\s*(.+)/)
    const setOn = dateMatch ? dateMatch[1].trim() : null

    return NextResponse.json({
      resolution,
      setOn,
      hasResolution: !!resolution,
    })
  } catch (error) {
    // File doesn't exist - no resolution set
    return NextResponse.json({
      resolution: null,
      setOn: null,
      hasResolution: false,
    })
  }
}

// POST: Save user's New Year resolution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resolution } = body

    if (!resolution) {
      return NextResponse.json(
        { error: 'Resolution is required' },
        { status: 400 }
      )
    }

    // Ensure profile directory exists
    await fs.mkdir(path.dirname(RESOLUTION_FILE), { recursive: true })

    // Create resolution file
    const content = `# New Year Resolution

**Set on:** ${new Date().toISOString().split('T')[0]}

## Resolution

${resolution}

---

This resolution will guide all your challenges and plans. Every goal you set should align with this North Star.
`

    await fs.writeFile(RESOLUTION_FILE, content, 'utf-8')

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file_created',
          data: {
            filePath: 'profile/resolution.md',
            purpose: 'User New Year resolution',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          },
        }),
      })

      // Update customizations section
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'customizations',
          data: [
            {
              customization: 'New Year Resolution',
              value: resolution.substring(0, 50) + (resolution.length > 50 ? '...' : ''),
              modified: new Date().toISOString(),
            },
          ],
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      resolution,
    })
  } catch (error: any) {
    console.error('Failed to save resolution:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update existing resolution
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { resolution } = body

    if (!resolution) {
      return NextResponse.json(
        { error: 'Resolution is required' },
        { status: 400 }
      )
    }

    // Read existing file to preserve original date
    let originalDate = new Date().toISOString().split('T')[0]
    try {
      const existingContent = await fs.readFile(RESOLUTION_FILE, 'utf-8')
      const dateMatch = existingContent.match(/\*\*Set on:\*\*\s*(.+)/)
      if (dateMatch) {
        originalDate = dateMatch[1].trim()
      }
    } catch {
      // File doesn't exist, use current date
    }

    // Update resolution
    const content = `# New Year Resolution

**Set on:** ${originalDate}
**Last updated:** ${new Date().toISOString().split('T')[0]}

## Resolution

${resolution}

---

This resolution will guide all your challenges and plans. Every goal you set should align with this North Star.
`

    await fs.writeFile(RESOLUTION_FILE, content, 'utf-8')

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file_modified',
          data: {
            filePath: 'profile/resolution.md',
            original: 'Previous resolution',
            changes: 'Updated resolution',
            date: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      resolution,
    })
  } catch (error: any) {
    console.error('Failed to update resolution:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

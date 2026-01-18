import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const { status } = await request.json()

    // Validate status
    const validStatuses = ['active', 'paused', 'completed', 'failed', 'pending']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const challengeDir = path.join(PATHS.challenges, challengeId)
    const challengeMdPath = path.join(challengeDir, 'challenge.md')

    // Read current challenge.md
    let content: string
    try {
      content = await fs.readFile(challengeMdPath, 'utf-8')
    } catch {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Update status in challenge.md
    // Look for "- **Status:** xxx" pattern
    const statusPattern = /(-\s*\*\*Status:\*\*\s*)(\w+)/i
    if (statusPattern.test(content)) {
      content = content.replace(statusPattern, `$1${status}`)
    } else {
      // If no status line exists, add it after ID line
      const idPattern = /(-\s*\*\*ID:\*\*\s*.+)/i
      if (idPattern.test(content)) {
        content = content.replace(idPattern, `$1\n- **Status:** ${status}`)
      }
    }

    // Write updated content
    await fs.writeFile(challengeMdPath, content, 'utf-8')

    // Log the status change to activity log
    const activityLogPath = path.join(challengeDir, 'activity-log.md')
    const timestamp = new Date().toISOString()
    const logEntry = `\n## ${timestamp.split('T')[0]} - Status Changed\n- Changed status to: ${status}\n- Timestamp: ${timestamp}\n`

    try {
      let activityLog = ''
      try {
        activityLog = await fs.readFile(activityLogPath, 'utf-8')
      } catch {
        activityLog = `# Activity Log - ${challengeId}\n\nAll status changes and activities are recorded here.\n`
      }
      await fs.writeFile(activityLogPath, activityLog + logEntry, 'utf-8')
    } catch (err) {
      console.error('Failed to update activity log:', err)
    }

    return NextResponse.json({
      success: true,
      status,
      message: `Challenge status updated to ${status}`
    })
  } catch (error: any) {
    console.error('Failed to update challenge status:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const challengeDir = path.join(PATHS.challenges, challengeId)
    const challengeMdPath = path.join(challengeDir, 'challenge.md')

    const content = await fs.readFile(challengeMdPath, 'utf-8')

    // Extract status
    const statusMatch = content.match(/-\s*\*\*Status:\*\*\s*(\w+)/i)
    const status = statusMatch ? statusMatch[1].toLowerCase() : 'active'

    return NextResponse.json({ status })
  } catch (error: any) {
    return NextResponse.json(
      { status: 'unknown', error: error.message },
      { status: 500 }
    )
  }
}

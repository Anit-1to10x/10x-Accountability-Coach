import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS } from '@/lib/paths'
import { getFileWatcher } from '@/lib/fileWatcher'

/**
 * POST /api/sync
 *
 * Force-triggers a sync event so the UI refreshes all data.
 * Called by CLI commands (/sync) or UI when manual refresh is needed.
 */
export async function POST(request: NextRequest) {
  try {
    // Start file watcher if not running (ensures SSE clients get notified)
    const watcher = getFileWatcher()
    watcher.start()

    // Count data to return summary
    let challengeCount = 0
    let todoCount = 0
    let skillCount = 0
    let promptCount = 0

    // Count challenges
    try {
      const dirs = await fs.readdir(PATHS.challenges, { withFileTypes: true })
      challengeCount = dirs.filter(d => d.isDirectory()).length
    } catch {}

    // Count skills
    try {
      const skillsDir = path.join(process.cwd(), '..', 'skills')
      const dirs = await fs.readdir(skillsDir, { withFileTypes: true })
      skillCount = dirs.filter(d => d.isDirectory()).length
    } catch {
      try {
        const skillsDir = path.join(process.cwd(), 'skills')
        const dirs = await fs.readdir(skillsDir, { withFileTypes: true })
        skillCount = dirs.filter(d => d.isDirectory()).length
      } catch {}
    }

    // Count prompts
    try {
      const promptsFile = path.join(DATA_DIR, 'prompts', 'prompts.json')
      const content = await fs.readFile(promptsFile, 'utf-8')
      const prompts = JSON.parse(content)
      promptCount = Array.isArray(prompts) ? prompts.length : 0
    } catch {}

    // Emit synthetic change events for all categories to trigger UI refresh
    const categories = ['challenge', 'todo', 'agent', 'profile', 'skill', 'prompt', 'schedule', 'checkin'] as const
    for (const category of categories) {
      watcher.emit({ type: 'change', path: 'manual-sync', category })
    }

    return NextResponse.json({
      success: true,
      message: 'Sync triggered — UI will refresh all data',
      synced: {
        challenges: challengeCount,
        skills: skillCount,
        prompts: promptCount,
      }
    })
  } catch (error: any) {
    console.error('Sync failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync
 *
 * Returns current sync status / data summary.
 */
export async function GET() {
  try {
    let challengeCount = 0
    let skillCount = 0
    let promptCount = 0

    try {
      const dirs = await fs.readdir(PATHS.challenges, { withFileTypes: true })
      challengeCount = dirs.filter(d => d.isDirectory()).length
    } catch {}

    try {
      const promptsFile = path.join(DATA_DIR, 'prompts', 'prompts.json')
      const content = await fs.readFile(promptsFile, 'utf-8')
      const prompts = JSON.parse(content)
      promptCount = Array.isArray(prompts) ? prompts.length : 0
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        challenges: challengeCount,
        skills: skillCount,
        prompts: promptCount,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

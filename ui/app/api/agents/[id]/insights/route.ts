import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id

    // Load check-ins
    const checkinsDir = path.join(DATA_DIR, 'checkins')
    let checkins: any[] = []
    try {
      const files = await fs.readdir(checkinsDir)
      for (const file of files.filter((f) => f.endsWith('.md'))) {
        const content = await fs.readFile(path.join(checkinsDir, file), 'utf-8')
        const date = file.replace('.md', '')
        const moodMatch = content.match(/Mood.*?(\d)\/5/)
        const completedMatch = content.match(/✅ Completed/)
        const winsMatch = content.match(/## Wins\n([\s\S]*?)\n\n/)

        checkins.push({
          date,
          mood: moodMatch ? parseInt(moodMatch[1]) : 3,
          completed: !!completedMatch,
          wins: winsMatch ? winsMatch[1] : null,
        })
      }
      checkins.sort((a, b) => b.date.localeCompare(a.date))
    } catch {
      // No check-ins yet
    }

    // Load challenges from registry
    const registryFile = path.join(DATA_DIR, '.registry', 'challenges.json')
    let challenges: any[] = []
    try {
      const data = await fs.readFile(registryFile, 'utf-8')
      challenges = JSON.parse(data)
    } catch {
      // No challenges yet
    }

    // Generate insights summary
    const insights = {
      totalCheckins: checkins.length,
      avgMood: checkins.length > 0
        ? checkins.reduce((sum, c) => sum + c.mood, 0) / checkins.length
        : 0,
      completionRate: checkins.length > 0
        ? (checkins.filter((c) => c.completed).length / checkins.length) * 100
        : 0,
      currentStreak: challenges[0]?.streak?.current || 0,
      bestStreak: Math.max(...challenges.map((c) => c.streak?.best || 0), 0),
    }

    return NextResponse.json({ insights, checkins, challenges })
  } catch (error) {
    console.error('Failed to load insights:', error)
    return NextResponse.json(
      { insights: null, checkins: [], challenges: [] },
      { status: 500 }
    )
  }
}

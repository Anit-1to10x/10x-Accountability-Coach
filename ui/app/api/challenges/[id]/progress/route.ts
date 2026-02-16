import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const challengeDir = path.join(PATHS.challenges, challengeId)

    let content = ''
    const milestones: any[] = []

    // Try progress.md first, then challenge.md
    const progressPath = path.join(challengeDir, 'progress.md')
    const challengePath = path.join(challengeDir, 'challenge.md')

    try {
      content = await fs.readFile(progressPath, 'utf-8')
    } catch {
      try {
        content = await fs.readFile(challengePath, 'utf-8')
      } catch {
        // No MD files found
      }
    }

    // Parse milestones from ## Milestones section
    const milestonesSection = content.match(/## Milestones\n([\s\S]*?)(?=\n##|$)/i)
    if (milestonesSection) {
      const milestoneRegex = /^- \[([ xX])\] (.+)$/gm
      let match

      while ((match = milestoneRegex.exec(milestonesSection[1])) !== null) {
        // Extract day number if present (e.g., "Week 1 Complete (Day 7)")
        const dayMatch = match[2].match(/\(Day (\d+)\)/)
        milestones.push({
          id: `milestone-${milestones.length + 1}`,
          challengeId: challengeId,
          title: match[2].replace(/\s*\(Day \d+\)/, '').trim(),
          description: '',
          day: dayMatch ? parseInt(dayMatch[1]) : null,
          achieved: match[1].toLowerCase() === 'x',
          achievedAt: match[1].toLowerCase() === 'x' ? new Date().toISOString() : undefined,
        })
      }
    }

    // Also extract progress percentage if available
    const progressMatch = content.match(/Overall:\*\*\s*(\d+)%/i)
    const progress = progressMatch ? parseInt(progressMatch[1]) : 0

    // Extract streak info
    const currentStreakMatch = content.match(/Current:\*\*\s*(\d+)/i)
    const bestStreakMatch = content.match(/Best:\*\*\s*(\d+)/i)

    return NextResponse.json({
      content,
      milestones,
      progress,
      streak: {
        current: currentStreakMatch ? parseInt(currentStreakMatch[1]) : 0,
        best: bestStreakMatch ? parseInt(bestStreakMatch[1]) : 0,
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error reading progress:', error)
    return NextResponse.json(
      { error: 'Failed to read progress', content: '', milestones: [] },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const { content } = await request.json()

    const progressPath = path.join(
      PATHS.challenges,
      challengeId,
      'progress.md'
    )

    await fs.writeFile(progressPath, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

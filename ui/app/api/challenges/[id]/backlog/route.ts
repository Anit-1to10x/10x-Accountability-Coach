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
    const backlogPath = path.join(
      PATHS.challenges,
      challengeId,
      'backlog.md'
    )

    const content = await fs.readFile(backlogPath, 'utf-8')

    // Parse tasks by priority
    const taskRegex = /^- \[([ x])\] (.+)$/gm
    const tasks: any[] = []
    let currentPriority = 'medium'
    let match

    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('🔴 High Priority')) {
        currentPriority = 'high'
      } else if (line.includes('🟡 Medium Priority')) {
        currentPriority = 'medium'
      } else if (line.includes('🟢 Low Priority')) {
        currentPriority = 'low'
      }

      const taskMatch = line.match(/^- \[([ x])\] (.+)$/)
      if (taskMatch) {
        tasks.push({
          id: tasks.length + 1,
          title: taskMatch[2].trim(),
          completed: taskMatch[1] === 'x',
          priority: currentPriority,
        })
      }
    }

    return NextResponse.json({
      content,
      tasks,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error reading backlog:', error)
    return NextResponse.json(
      { error: 'Failed to read backlog', content: '', tasks: [] },
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

    const backlogPath = path.join(
      PATHS.challenges,
      challengeId,
      'backlog.md'
    )

    await fs.writeFile(backlogPath, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating backlog:', error)
    return NextResponse.json(
      { error: 'Failed to update backlog' },
      { status: 500 }
    )
  }
}

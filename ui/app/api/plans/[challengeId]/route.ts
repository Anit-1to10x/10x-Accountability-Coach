import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

// GET - Fetch plan for specific challenge
export async function GET(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { challengeId } = params
    const planPath = path.join(PATHS.challenges, challengeId, 'plan.md')

    try {
      const content = await fs.readFile(planPath, 'utf-8')
      const stats = await fs.stat(planPath)

      return NextResponse.json({
        challengeId,
        content,
        updatedAt: stats.mtime.toISOString(),
      })
    } catch {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

// POST - Create new plan for challenge
export async function POST(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { challengeId } = params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const challengeDir = path.join(PATHS.challenges, challengeId)
    const planPath = path.join(challengeDir, 'plan.md')

    // Ensure challenge directory exists
    await fs.mkdir(challengeDir, { recursive: true })

    // Write plan file
    await fs.writeFile(planPath, content, 'utf-8')

    return NextResponse.json({
      challengeId,
      content,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

// PUT - Update existing plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { challengeId } = params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const planPath = path.join(PATHS.challenges, challengeId, 'plan.md')

    // Check if plan exists
    try {
      await fs.access(planPath)
    } catch {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Update plan file
    await fs.writeFile(planPath, content, 'utf-8')

    return NextResponse.json({
      challengeId,
      content,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

// DELETE - Delete plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { challengeId: string } }
) {
  try {
    const { challengeId } = params
    const planPath = path.join(PATHS.challenges, challengeId, 'plan.md')

    // Check if plan exists
    try {
      await fs.access(planPath)
    } catch {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Delete plan file
    await fs.unlink(planPath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}

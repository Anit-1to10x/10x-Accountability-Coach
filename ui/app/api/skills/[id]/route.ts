import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { loadSkillContent } from '@/lib/skillParser'

// GET - Get individual skill details with full SKILL.md content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skillId = params.id
    const skillsDir = path.join(process.cwd(), '..', 'skills')
    const skillPath = path.join(skillsDir, skillId)

    // Load full SKILL.md content
    const content = await loadSkillContent(skillPath)

    if (!content) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: skillId,
      content,
    })
  } catch (error) {
    console.error('Failed to load skill details:', error)
    return NextResponse.json(
      { error: 'Failed to load skill details' },
      { status: 500 }
    )
  }
}

// PUT - Update skill content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skillId = params.id
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const skillsDir = path.join(process.cwd(), '..', 'skills')
    const skillPath = path.join(skillsDir, skillId)
    const skillMdPath = path.join(skillPath, 'SKILL.md')

    // Check if skill directory exists
    try {
      await fs.access(skillPath)
    } catch {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    // Write updated content to SKILL.md
    await fs.writeFile(skillMdPath, content, 'utf-8')

    return NextResponse.json({
      id: skillId,
      success: true,
      message: 'Skill updated successfully',
    })
  } catch (error) {
    console.error('Failed to update skill:', error)
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    )
  }
}

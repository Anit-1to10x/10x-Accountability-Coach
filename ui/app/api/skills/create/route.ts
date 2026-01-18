import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SKILLS_DIR } from '@/lib/paths'

interface CreateSkillRequest {
  name: string
  description: string
  triggers?: string[]
  category?: 'productivity' | 'health' | 'learning' | 'creative' | 'custom'
  instructions: string
  createdByAgentId: string
  examples?: string[]
}

// POST: Create a new skill from chat
export async function POST(request: NextRequest) {
  try {
    const body: CreateSkillRequest = await request.json()
    const { name, description, triggers, category, instructions, createdByAgentId, examples } = body

    if (!name || !description || !instructions) {
      return NextResponse.json(
        { error: 'name, description, and instructions are required' },
        { status: 400 }
      )
    }

    // Generate skill ID from name (kebab-case)
    const skillId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const skillPath = path.join(SKILLS_DIR, skillId)

    // Check if skill already exists
    try {
      await fs.access(skillPath)
      return NextResponse.json(
        { error: 'A skill with this name already exists' },
        { status: 409 }
      )
    } catch {
      // Skill doesn't exist, proceed with creation
    }

    // Create skill directory
    await fs.mkdir(skillPath, { recursive: true })

    // Create SKILL.md file
    const skillMdContent = `# ${name}

## Description
${description}

## Category
${category || 'custom'}

## Triggers
${triggers && triggers.length > 0 ? triggers.map(t => `- ${t}`).join('\n') : '- (No automatic triggers)'}

## Instructions

${instructions}

## Examples

${examples && examples.length > 0 ? examples.map((ex, i) => `### Example ${i + 1}
${ex}`).join('\n\n') : 'No examples provided.'}

---

**Created by:** ${createdByAgentId}
**Created at:** ${new Date().toISOString()}
`

    await fs.writeFile(path.join(skillPath, 'SKILL.md'), skillMdContent)

    // Create .skill-meta.json file
    const metaContent = {
      id: skillId,
      name,
      description,
      category: category || 'custom',
      triggers: triggers || [],
      version: '1.0.0',
      createdBy: createdByAgentId,
      createdAt: new Date().toISOString(),
      attachedTo: [createdByAgentId], // Initially only attached to creating agent
      isCustom: true
    }

    await fs.writeFile(
      path.join(skillPath, '.skill-meta.json'),
      JSON.stringify(metaContent, null, 2)
    )

    // Update the creating agent's skills
    try {
      const agentResponse = await fetch(`${request.nextUrl.origin}/api/agents/${createdByAgentId}`, {
        method: 'GET',
      })

      if (agentResponse.ok) {
        const agentData = await agentResponse.json()
        const currentSkills = agentData.agent?.skills || []

        // Add new skill to agent
        await fetch(`${request.nextUrl.origin}/api/agents/${createdByAgentId}/skills`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skills: [...currentSkills, skillId]
          })
        })
      }
    } catch (error) {
      console.error('Failed to attach skill to agent:', error)
    }

    // Update system index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'skill_created',
          data: {
            skillId,
            name,
            category: category || 'custom',
            createdBy: createdByAgentId,
            createdAt: new Date().toISOString(),
            path: `skills/${skillId}/`,
            attachedTo: [createdByAgentId]
          }
        })
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      skill: {
        id: skillId,
        name,
        description,
        category: category || 'custom',
        path: skillPath,
        attachedTo: [createdByAgentId]
      }
    })
  } catch (error: any) {
    console.error('Failed to create skill:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

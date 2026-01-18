import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

// GET - Read agent.md content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const agentDir = path.join(DATA_DIR, 'agents', agentId)
    const agentMdFile = path.join(agentDir, 'agent.md')

    try {
      const content = await fs.readFile(agentMdFile, 'utf-8')
      return NextResponse.json({
        success: true,
        agentId,
        content,
        path: agentMdFile
      })
    } catch {
      return NextResponse.json(
        { error: 'Agent instructions file not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Failed to read agent instructions:', error)
    return NextResponse.json(
      { error: 'Failed to read agent instructions' },
      { status: 500 }
    )
  }
}

// PUT - Update agent.md content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { content, section, value } = await request.json()

    const agentDir = path.join(DATA_DIR, 'agents', agentId)
    const agentMdFile = path.join(agentDir, 'agent.md')
    const agentJsonFile = path.join(agentDir, 'agent.json')

    // Ensure agent directory exists
    await fs.mkdir(agentDir, { recursive: true })

    // If full content is provided, replace the entire file
    if (content) {
      // Update Last Modified date
      let updatedContent = content
      if (updatedContent.includes('Last Modified:')) {
        updatedContent = updatedContent.replace(
          /Last Modified: .*$/m,
          `Last Modified: ${new Date().toISOString().split('T')[0]}`
        )
      }

      await fs.writeFile(agentMdFile, updatedContent, 'utf-8')

      // Also update the updatedAt in agent.json
      try {
        const metadata = JSON.parse(await fs.readFile(agentJsonFile, 'utf-8'))
        metadata.updatedAt = new Date().toISOString()
        await fs.writeFile(agentJsonFile, JSON.stringify(metadata, null, 2), 'utf-8')
      } catch {
        // agent.json might not exist
      }

      return NextResponse.json({
        success: true,
        agentId,
        message: 'Agent instructions updated successfully'
      })
    }

    // If section and value are provided, update only that section
    if (section && value !== undefined) {
      let agentMd = ''
      try {
        agentMd = await fs.readFile(agentMdFile, 'utf-8')
      } catch {
        return NextResponse.json(
          { error: 'Agent instructions file not found' },
          { status: 404 }
        )
      }

      // Map of section names to their headers
      const sectionHeaders: Record<string, string> = {
        description: 'Description',
        personality: 'Personality',
        skills: 'Assigned Skills',
        customInstructions: 'Custom Instructions',
        focusAreas: 'Focus Areas',
        restrictions: 'Restrictions',
        quickActions: 'Quick Actions',
        capabilities: 'Capabilities'
      }

      const header = sectionHeaders[section]
      if (!header) {
        return NextResponse.json(
          { error: `Unknown section: ${section}` },
          { status: 400 }
        )
      }

      // Replace the section content
      const sectionRegex = new RegExp(`## ${header}\\n([\\s\\S]*?)(?=\\n## |---)`, 'g')

      // Format the value based on section type
      let formattedValue: string
      if (Array.isArray(value)) {
        formattedValue = value.map(v => `- ${v}`).join('\n')
      } else if (typeof value === 'object') {
        formattedValue = Object.entries(value).map(([k, v]) => `- ${k}: ${v}`).join('\n')
      } else {
        formattedValue = value
      }

      agentMd = agentMd.replace(sectionRegex, `## ${header}\n${formattedValue}\n\n`)

      // Update Last Modified date
      agentMd = agentMd.replace(
        /Last Modified: .*$/m,
        `Last Modified: ${new Date().toISOString().split('T')[0]}`
      )

      await fs.writeFile(agentMdFile, agentMd, 'utf-8')

      // Also update the updatedAt in agent.json
      try {
        const metadata = JSON.parse(await fs.readFile(agentJsonFile, 'utf-8'))
        metadata.updatedAt = new Date().toISOString()
        await fs.writeFile(agentJsonFile, JSON.stringify(metadata, null, 2), 'utf-8')
      } catch {
        // agent.json might not exist
      }

      return NextResponse.json({
        success: true,
        agentId,
        section,
        message: `Section '${section}' updated successfully`
      })
    }

    return NextResponse.json(
      { error: 'Either content or section+value must be provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to update agent instructions:', error)
    return NextResponse.json(
      { error: 'Failed to update agent instructions' },
      { status: 500 }
    )
  }
}

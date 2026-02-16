import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS } from '@/lib/paths'

// Helper to get agents array from data (handles both formats)
function getAgentsArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data.agents && Array.isArray(data.agents)) return data.agents
  return []
}

// GET - List skills attached to this agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const agentsFile = PATHS.agents

    // Read agents.json to find this agent
    const agentsContent = await fs.readFile(agentsFile, 'utf-8')
    const agentsData = JSON.parse(agentsContent)
    const agents = getAgentsArray(agentsData)

    const agent = agents.find((a: any) => a.id === agentId)

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ skills: agent.skills || [] })
  } catch (error) {
    console.error('Failed to load agent skills:', error)
    return NextResponse.json(
      { error: 'Failed to load agent skills' },
      { status: 500 }
    )
  }
}

// PUT - Update skills for this agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { skills } = await request.json()

    const agentsFile = PATHS.agents

    // Read agents.json
    const agentsContent = await fs.readFile(agentsFile, 'utf-8')
    const agentsData = JSON.parse(agentsContent)
    const agents = getAgentsArray(agentsData)

    // Find and update the agent
    const agentIndex = agents.findIndex((a: any) => a.id === agentId)

    if (agentIndex === -1) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    agents[agentIndex].skills = skills

    // Write back to agents.json (preserve structure)
    const outputData = {
      agents: agents,
      lastUpdated: new Date().toISOString()
    }
    await fs.writeFile(agentsFile, JSON.stringify(outputData, null, 2), 'utf-8')

    // Also update the agent's metadata file and agent.md
    const agentDir = path.join(DATA_DIR, 'agents', agentId)
    const agentMetadataFile = path.join(agentDir, 'agent.json')
    const agentMdFile = path.join(agentDir, 'agent.md')

    try {
      // Update agent.json
      const metadata = JSON.parse(await fs.readFile(agentMetadataFile, 'utf-8'))
      metadata.skills = skills
      metadata.updatedAt = new Date().toISOString()
      await fs.writeFile(agentMetadataFile, JSON.stringify(metadata, null, 2), 'utf-8')

      // Update agent.md - replace the Assigned Skills section
      try {
        let agentMd = await fs.readFile(agentMdFile, 'utf-8')

        // Replace the Assigned Skills section
        const skillsList = skills.length > 0
          ? skills.map((s: string) => `- ${s}`).join('\n')
          : '- No skills assigned yet'

        // Use regex to replace the Assigned Skills section
        agentMd = agentMd.replace(
          /## Assigned Skills\n([\s\S]*?)(?=\n## |---)/,
          `## Assigned Skills\n${skillsList}\n\n`
        )

        // Update Last Modified date
        agentMd = agentMd.replace(
          /Last Modified: .*$/m,
          `Last Modified: ${new Date().toISOString().split('T')[0]}`
        )

        await fs.writeFile(agentMdFile, agentMd, 'utf-8')
      } catch (mdErr) {
        console.warn('Could not update agent.md file:', mdErr)
      }
    } catch (err) {
      // Agent folder might not exist yet (for older agents), that's okay
      console.warn('Could not update agent metadata file:', err)
    }

    return NextResponse.json({ success: true, skills: agents[agentIndex].skills })
  } catch (error) {
    console.error('Failed to update agent skills:', error)
    return NextResponse.json(
      { error: 'Failed to update agent skills' },
      { status: 500 }
    )
  }
}

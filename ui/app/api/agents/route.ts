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

export async function GET() {
  try {
    const agentsJsonFile = PATHS.agents

    // Read from agents.json (primary source of truth)
    try {
      const data = await fs.readFile(agentsJsonFile, 'utf-8')
      const agentsData = JSON.parse(data)
      const agents = getAgentsArray(agentsData)
      return NextResponse.json(agents)
    } catch (error) {
      console.error('Failed to read agents.json:', error)
      // Return empty array if file doesn't exist
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Failed to load agents:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgent = await request.json()
    const agentsFile = PATHS.agents

    // Validate required fields
    if (!newAgent.id || !newAgent.name) {
      return NextResponse.json(
        { error: 'Agent ID and name are required' },
        { status: 400 }
      )
    }

    // Ensure base directory exists
    await fs.mkdir(DATA_DIR, { recursive: true })

    // Create agent-specific folder
    const agentDir = path.join(DATA_DIR, 'agents', newAgent.id)
    await fs.mkdir(agentDir, { recursive: true })

    // Create agent metadata file
    const agentMetadata = {
      id: newAgent.id,
      name: newAgent.name,
      avatar: newAgent.avatar || 'default',
      description: newAgent.description || '',
      skills: newAgent.skills || [],
      capabilities: newAgent.capabilities || [],
      personality: newAgent.personality || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await fs.writeFile(
      path.join(agentDir, 'agent.json'),
      JSON.stringify(agentMetadata, null, 2)
    )

    // Create agent.md instruction file
    const skillsList = newAgent.skills && newAgent.skills.length > 0
      ? newAgent.skills.map((s: string) => `- ${s}`).join('\n')
      : '- No skills assigned yet'

    const capsList = newAgent.capabilities && newAgent.capabilities.length > 0
      ? newAgent.capabilities.map((c: string) => `- ${c}`).join('\n')
      : '- No specific capabilities defined'

    const agentMd = `# ${newAgent.name}

**ID:** ${newAgent.id}
**Avatar:** ${newAgent.avatar || 'default'}
**Description:** ${newAgent.description || 'No description provided'}

## Personality
- **Tone:** ${newAgent.personality?.tone || 'helpful'}
- **Style:** ${newAgent.personality?.style || 'professional'}

## Assigned Skills
${skillsList}

## Capabilities
${capsList}

## Custom Instructions
${newAgent.customInstructions || 'Follow the assigned skills and provide helpful responses based on user needs.'}

---
Created: ${new Date().toISOString().split('T')[0]}
Last Modified: ${new Date().toISOString().split('T')[0]}
`
    await fs.writeFile(path.join(agentDir, 'agent.md'), agentMd)

    // Load existing agents from agents.json
    let agents = []
    try {
      const data = await fs.readFile(agentsFile, 'utf-8')
      const agentsData = JSON.parse(data)
      agents = getAgentsArray(agentsData)
    } catch {
      // File doesn't exist, will create it
    }

    // Check if agent ID already exists
    if (agents.some((a: any) => a.id === newAgent.id)) {
      return NextResponse.json(
        { error: 'Agent with this ID already exists' },
        { status: 409 }
      )
    }

    // Add new agent
    agents.push(newAgent)

    // Save to agents.json (preserve structure)
    const outputData = {
      agents: agents,
      globalSkills: [],
      lastUpdated: new Date().toISOString()
    }
    await fs.writeFile(agentsFile, JSON.stringify(outputData, null, 2))

    return NextResponse.json({ success: true, agent: newAgent })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}

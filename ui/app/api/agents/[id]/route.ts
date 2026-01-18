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

// GET - Get individual agent details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const agentsFile = PATHS.agents

    // Read agents.json
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

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to load agent:', error)
    return NextResponse.json(
      { error: 'Failed to load agent' },
      { status: 500 }
    )
  }
}

// PUT - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const updates = await request.json()

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

    // Update agent with new data
    agents[agentIndex] = { ...agents[agentIndex], ...updates }

    // Write back to agents.json (preserve structure)
    const outputData = {
      agents: agents,
      lastUpdated: new Date().toISOString()
    }
    await fs.writeFile(agentsFile, JSON.stringify(outputData, null, 2), 'utf-8')

    // Also update the agent's metadata file if it exists
    const agentDir = path.join(DATA_DIR, 'agents', agentId)
    const agentMetadataFile = path.join(agentDir, 'agent.json')
    try {
      const metadata = JSON.parse(await fs.readFile(agentMetadataFile, 'utf-8'))
      const updatedMetadata = { ...metadata, ...updates, updatedAt: new Date().toISOString() }
      await fs.writeFile(agentMetadataFile, JSON.stringify(updatedMetadata, null, 2), 'utf-8')
    } catch (err) {
      // Agent folder might not exist yet (for older agents), that's okay
      console.warn('Could not update agent metadata file:', err)
    }

    return NextResponse.json({ success: true, agent: agents[agentIndex] })
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

// DELETE - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const agentsFile = PATHS.agents

    // Read agents.json
    const agentsContent = await fs.readFile(agentsFile, 'utf-8')
    const agentsData = JSON.parse(agentsContent)
    const agents = getAgentsArray(agentsData)

    // Filter out the agent to delete
    const filteredAgents = agents.filter((a: any) => a.id !== agentId)

    if (filteredAgents.length === agents.length) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Write back to agents.json (preserve structure)
    const outputData = {
      agents: filteredAgents,
      lastUpdated: new Date().toISOString()
    }
    await fs.writeFile(agentsFile, JSON.stringify(outputData, null, 2), 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}

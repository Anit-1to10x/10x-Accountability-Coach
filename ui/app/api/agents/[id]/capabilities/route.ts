/**
 * Agent Capabilities API
 *
 * GET /api/agents/[id]/capabilities - Get capabilities for an agent
 * PUT /api/agents/[id]/capabilities - Update capabilities for an agent
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAgentCapabilities,
  updateAgentCapabilities,
  loadAgentCapabilities,
} from '@/lib/agent-capabilities'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const capabilities = await getAgentCapabilities(agentId)

    return NextResponse.json(capabilities)
  } catch (error) {
    console.error('Failed to get agent capabilities:', error)
    return NextResponse.json(
      { error: 'Failed to get agent capabilities' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const updates = await request.json()

    // Validate input
    if (updates.assignedSkills && !Array.isArray(updates.assignedSkills)) {
      return NextResponse.json(
        { error: 'assignedSkills must be an array' },
        { status: 400 }
      )
    }

    if (updates.assignedPrompts && !Array.isArray(updates.assignedPrompts)) {
      return NextResponse.json(
        { error: 'assignedPrompts must be an array' },
        { status: 400 }
      )
    }

    const updated = await updateAgentCapabilities(agentId, updates)

    return NextResponse.json({
      success: true,
      capabilities: updated,
    })
  } catch (error) {
    console.error('Failed to update agent capabilities:', error)
    return NextResponse.json(
      { error: 'Failed to update agent capabilities' },
      { status: 500 }
    )
  }
}

// Get all agents' capabilities
export async function POST(request: NextRequest) {
  try {
    const config = await loadAgentCapabilities()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to load all capabilities:', error)
    return NextResponse.json(
      { error: 'Failed to load capabilities' },
      { status: 500 }
    )
  }
}

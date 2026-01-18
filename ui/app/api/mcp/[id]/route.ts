import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'
import type { MCPConfig, MCPServer } from '@/types/mcp'

const MCP_CONFIG_FILE = path.join(DATA_DIR, 'mcp-config.json')

async function loadConfig(): Promise<MCPConfig> {
  const content = await fs.readFile(MCP_CONFIG_FILE, 'utf-8')
  return JSON.parse(content)
}

async function saveConfig(config: MCPConfig): Promise<void> {
  await fs.writeFile(MCP_CONFIG_FILE, JSON.stringify(config, null, 2))
}

// GET: Get a specific MCP server
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config = await loadConfig()
    const server = config.servers.find(s => s.id === params.id)

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ server })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update a specific MCP server
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates: Partial<MCPServer> = await request.json()
    const config = await loadConfig()

    const serverIndex = config.servers.findIndex(s => s.id === params.id)
    if (serverIndex === -1) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    // Update server
    config.servers[serverIndex] = {
      ...config.servers[serverIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    config.lastUpdated = new Date().toISOString()

    await saveConfig(config)

    return NextResponse.json({
      success: true,
      server: config.servers[serverIndex],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Remove an MCP server
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config = await loadConfig()

    const serverIndex = config.servers.findIndex(s => s.id === params.id)
    if (serverIndex === -1) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    config.servers.splice(serverIndex, 1)
    config.lastUpdated = new Date().toISOString()

    await saveConfig(config)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH: Toggle server enabled state
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { enabled } = await request.json()
    const config = await loadConfig()

    const serverIndex = config.servers.findIndex(s => s.id === params.id)
    if (serverIndex === -1) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      )
    }

    config.servers[serverIndex].enabled = enabled
    config.servers[serverIndex].updatedAt = new Date().toISOString()
    config.lastUpdated = new Date().toISOString()

    await saveConfig(config)

    return NextResponse.json({
      success: true,
      server: config.servers[serverIndex],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

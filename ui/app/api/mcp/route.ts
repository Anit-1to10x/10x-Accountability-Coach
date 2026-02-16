import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'
import type { MCPConfig, MCPServer } from '@/types/mcp'

const MCP_CONFIG_FILE = path.join(DATA_DIR, 'mcp-config.json')

// Ensure config file exists
async function ensureConfigFile(): Promise<MCPConfig> {
  try {
    const content = await fs.readFile(MCP_CONFIG_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    const defaultConfig: MCPConfig = {
      enabled: true,
      servers: [],
      lastUpdated: null,
    }
    await fs.writeFile(MCP_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2))
    return defaultConfig
  }
}

// GET: List all MCP servers
export async function GET() {
  try {
    const config = await ensureConfigFile()

    return NextResponse.json({
      enabled: config.enabled,
      servers: config.servers,
      lastUpdated: config.lastUpdated,
      mcpEnabled: process.env.MCP_ENABLED !== 'false',
    })
  } catch (error: any) {
    console.error('Failed to load MCP config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST: Add a new MCP server
export async function POST(request: NextRequest) {
  try {
    const server: Partial<MCPServer> = await request.json()

    if (!server.name || !server.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const config = await ensureConfigFile()

    // Generate ID if not provided
    const newServer: MCPServer = {
      id: server.id || server.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: server.name,
      description: server.description || '',
      type: server.type,
      command: server.command,
      args: server.args,
      url: server.url,
      headers: server.headers,
      enabled: server.enabled ?? true,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Check for duplicate ID
    if (config.servers.some(s => s.id === newServer.id)) {
      return NextResponse.json(
        { error: 'Server with this ID already exists' },
        { status: 400 }
      )
    }

    config.servers.push(newServer)
    config.lastUpdated = new Date().toISOString()

    await fs.writeFile(MCP_CONFIG_FILE, JSON.stringify(config, null, 2))

    return NextResponse.json({
      success: true,
      server: newServer,
    })
  } catch (error: any) {
    console.error('Failed to add MCP server:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update MCP global settings (enable/disable)
export async function PUT(request: NextRequest) {
  try {
    const { enabled } = await request.json()

    const config = await ensureConfigFile()
    config.enabled = enabled
    config.lastUpdated = new Date().toISOString()

    await fs.writeFile(MCP_CONFIG_FILE, JSON.stringify(config, null, 2))

    return NextResponse.json({
      success: true,
      enabled: config.enabled,
    })
  } catch (error: any) {
    console.error('Failed to update MCP config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

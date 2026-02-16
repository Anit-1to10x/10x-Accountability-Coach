/**
 * MCP Client Module
 *
 * Connects to MCP servers and executes tools.
 * Supports stdio, HTTP, and SSE transport types.
 */

import { spawn, ChildProcess } from 'child_process'
import type { MCPServer, MCPTool, MCPToolCall, MCPToolResult } from '@/types/mcp'

interface MCPConnection {
  server: MCPServer
  process?: ChildProcess
  tools: MCPTool[]
  connected: boolean
  lastError?: string
}

// Active MCP connections
const connections: Map<string, MCPConnection> = new Map()

/**
 * Initialize an MCP server connection
 */
export async function connectMCPServer(server: MCPServer): Promise<MCPConnection> {
  if (connections.has(server.id)) {
    const existing = connections.get(server.id)!
    if (existing.connected) {
      return existing
    }
  }

  const connection: MCPConnection = {
    server,
    tools: [],
    connected: false,
  }

  try {
    if (server.type === 'stdio' && server.command) {
      // Spawn the MCP server process
      const proc = spawn(server.command, server.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...server.env },
      })

      connection.process = proc

      // Wait for the server to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MCP server connection timeout'))
        }, 10000)

        proc.stdout?.once('data', () => {
          clearTimeout(timeout)
          resolve()
        })

        proc.on('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })

        proc.on('exit', (code) => {
          if (code !== 0) {
            clearTimeout(timeout)
            reject(new Error(`MCP server exited with code ${code}`))
          }
        })
      })

      // Get available tools from the server
      connection.tools = await listMCPTools(connection)
      connection.connected = true

    } else if (server.type === 'http' || server.type === 'sse') {
      // HTTP/SSE connections - verify the endpoint is reachable
      if (server.url) {
        const response = await fetch(`${server.url}/tools`, {
          method: 'GET',
          headers: server.headers || {},
        })

        if (response.ok) {
          const data = await response.json()
          connection.tools = data.tools || []
          connection.connected = true
        }
      }
    }

    connections.set(server.id, connection)
    return connection

  } catch (error: any) {
    connection.lastError = error.message
    connections.set(server.id, connection)
    throw error
  }
}

/**
 * Disconnect an MCP server
 */
export async function disconnectMCPServer(serverId: string): Promise<void> {
  const connection = connections.get(serverId)
  if (connection) {
    if (connection.process) {
      connection.process.kill()
    }
    connection.connected = false
    connections.delete(serverId)
  }
}

/**
 * List available tools from an MCP server
 */
async function listMCPTools(connection: MCPConnection): Promise<MCPTool[]> {
  if (connection.server.type === 'stdio' && connection.process) {
    // Send tools/list request via stdio
    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tools list timeout'))
      }, 5000)

      const onData = (data: Buffer) => {
        clearTimeout(timeout)
        connection.process?.stdout?.off('data', onData)

        try {
          const response = JSON.parse(data.toString())
          resolve(response.result?.tools || [])
        } catch {
          resolve([])
        }
      }

      connection.process?.stdout?.on('data', onData)
      connection.process?.stdin?.write(request + '\n')
    })
  }

  return connection.tools
}

/**
 * Execute a tool call on an MCP server
 */
export async function executeMCPTool(
  serverId: string,
  toolCall: MCPToolCall
): Promise<MCPToolResult> {
  const connection = connections.get(serverId)

  if (!connection || !connection.connected) {
    return {
      toolCallId: toolCall.id,
      success: false,
      error: 'MCP server not connected',
    }
  }

  try {
    if (connection.server.type === 'stdio' && connection.process) {
      // Execute via stdio
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: toolCall.id,
        method: 'tools/call',
        params: {
          name: toolCall.name,
          arguments: toolCall.arguments,
        },
      })

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({
            toolCallId: toolCall.id,
            success: false,
            error: 'Tool execution timeout',
          })
        }, 30000)

        const onData = (data: Buffer) => {
          clearTimeout(timeout)
          connection.process?.stdout?.off('data', onData)

          try {
            const response = JSON.parse(data.toString())
            if (response.error) {
              resolve({
                toolCallId: toolCall.id,
                success: false,
                error: response.error.message,
              })
            } else {
              resolve({
                toolCallId: toolCall.id,
                success: true,
                result: response.result,
              })
            }
          } catch (err: any) {
            resolve({
              toolCallId: toolCall.id,
              success: false,
              error: err.message,
            })
          }
        }

        connection.process?.stdout?.on('data', onData)
        connection.process?.stdin?.write(request + '\n')
      })

    } else if (connection.server.type === 'http' && connection.server.url) {
      // Execute via HTTP
      const response = await fetch(`${connection.server.url}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...connection.server.headers,
        },
        body: JSON.stringify({
          name: toolCall.name,
          arguments: toolCall.arguments,
        }),
      })

      const data = await response.json()

      return {
        toolCallId: toolCall.id,
        success: response.ok,
        result: data.result,
        error: data.error,
      }
    }

    return {
      toolCallId: toolCall.id,
      success: false,
      error: 'Unsupported transport type',
    }

  } catch (error: any) {
    return {
      toolCallId: toolCall.id,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all connected MCP servers and their tools
 */
export function getConnectedServers(): Array<{
  server: MCPServer
  tools: MCPTool[]
  connected: boolean
}> {
  return Array.from(connections.values()).map((conn) => ({
    server: conn.server,
    tools: conn.tools,
    connected: conn.connected,
  }))
}

/**
 * Get all available tools from all connected servers
 */
export function getAllAvailableTools(): MCPTool[] {
  const tools: MCPTool[] = []
  for (const connection of connections.values()) {
    if (connection.connected) {
      tools.push(...connection.tools.map((tool) => ({
        ...tool,
        serverId: connection.server.id,
      })))
    }
  }
  return tools
}

/**
 * Format tools for LLM API (convert to function calling format)
 */
export function formatToolsForLLM(tools: MCPTool[]): any[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || { type: 'object', properties: {} },
    },
  }))
}

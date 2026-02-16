/**
 * MCP Manager Module
 *
 * Manages MCP server configuration, connections, and tool execution.
 * Integrates with the chat stream for tool calling.
 */

import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'
import type { MCPConfig, MCPServer, MCPTool, MCPToolCall, MCPToolResult } from '@/types/mcp'
import {
  connectMCPServer,
  disconnectMCPServer,
  executeMCPTool,
  getAllAvailableTools,
  formatToolsForLLM,
} from './client'

const MCP_CONFIG_FILE = path.join(DATA_DIR, 'mcp-config.json')

let mcpConfig: MCPConfig | null = null
let initialized = false

/**
 * Load MCP configuration from file
 */
export async function loadMCPConfig(): Promise<MCPConfig> {
  try {
    const content = await fs.readFile(MCP_CONFIG_FILE, 'utf-8')
    mcpConfig = JSON.parse(content)
    return mcpConfig!
  } catch {
    // Return default config
    mcpConfig = {
      enabled: true,
      servers: [],
      lastUpdated: null,
    }
    return mcpConfig
  }
}

/**
 * Save MCP configuration to file
 */
export async function saveMCPConfig(config: MCPConfig): Promise<void> {
  config.lastUpdated = new Date().toISOString()
  await fs.mkdir(path.dirname(MCP_CONFIG_FILE), { recursive: true })
  await fs.writeFile(MCP_CONFIG_FILE, JSON.stringify(config, null, 2))
  mcpConfig = config
}

/**
 * Initialize all enabled MCP servers
 */
export async function initializeMCPServers(): Promise<void> {
  if (initialized) return

  const config = await loadMCPConfig()

  if (!config.enabled) {
    console.log('[MCP] MCP is disabled')
    return
  }

  for (const server of config.servers) {
    if (server.enabled) {
      try {
        await connectMCPServer(server)
        console.log(`[MCP] Connected to ${server.name}`)
      } catch (error: any) {
        console.error(`[MCP] Failed to connect to ${server.name}:`, error.message)
      }
    }
  }

  initialized = true
}

/**
 * Get tools available for the LLM to use
 */
export async function getToolsForLLM(): Promise<any[]> {
  await initializeMCPServers()

  const config = await loadMCPConfig()
  if (!config.enabled) {
    return []
  }

  const tools = getAllAvailableTools()
  return formatToolsForLLM(tools)
}

/**
 * Execute a tool call from the LLM
 */
export async function executeToolCall(toolCall: MCPToolCall): Promise<MCPToolResult> {
  // Find which server has this tool
  const tools = getAllAvailableTools()
  const tool = tools.find((t) => t.name === toolCall.name)

  if (!tool || !tool.serverId) {
    return {
      toolCallId: toolCall.id,
      success: false,
      error: `Tool not found: ${toolCall.name}`,
    }
  }

  return executeMCPTool(tool.serverId, toolCall)
}

/**
 * Execute multiple tool calls in parallel
 */
export async function executeToolCalls(
  toolCalls: MCPToolCall[]
): Promise<MCPToolResult[]> {
  return Promise.all(toolCalls.map(executeToolCall))
}

/**
 * Format tool results for LLM continuation
 */
export function formatToolResultsForLLM(results: MCPToolResult[]): any[] {
  return results.map((result) => ({
    role: 'tool',
    tool_call_id: result.toolCallId,
    content: result.success
      ? JSON.stringify(result.result)
      : `Error: ${result.error}`,
  }))
}

/**
 * Process a message that may contain tool calls
 * Returns the final response after executing all tools
 */
export async function processWithTools(
  messages: any[],
  systemPrompt: string,
  chatFunction: (messages: any[], system: string, tools?: any[]) => Promise<any>
): Promise<AsyncGenerator<string | { type: string; data: any }>> {
  const tools = await getToolsForLLM()

  async function* generate(): AsyncGenerator<string | { type: string; data: any }> {
    let currentMessages = [...messages]
    let continueLoop = true
    let iterations = 0
    const maxIterations = 10 // Prevent infinite loops

    while (continueLoop && iterations < maxIterations) {
      iterations++

      // Call the LLM with tools
      const response = await chatFunction(currentMessages, systemPrompt, tools.length > 0 ? tools : undefined)

      // Check if response contains tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Emit tool call event
        yield {
          type: 'tool_calls',
          data: response.tool_calls.map((tc: any) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          })),
        }

        // Execute tool calls
        const toolCalls: MCPToolCall[] = response.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}'),
        }))

        const results = await executeToolCalls(toolCalls)

        // Emit tool results event
        yield {
          type: 'tool_results',
          data: results,
        }

        // Add assistant message with tool calls and tool results to messages
        currentMessages.push({
          role: 'assistant',
          content: response.content || null,
          tool_calls: response.tool_calls,
        })

        currentMessages.push(...formatToolResultsForLLM(results))

      } else {
        // No more tool calls, emit final content
        if (response.content) {
          yield response.content
        }
        continueLoop = false
      }
    }
  }

  return generate()
}

/**
 * Shutdown all MCP connections
 */
export async function shutdownMCP(): Promise<void> {
  const config = await loadMCPConfig()

  for (const server of config.servers) {
    try {
      await disconnectMCPServer(server.id)
    } catch (error) {
      console.error(`[MCP] Failed to disconnect ${server.name}:`, error)
    }
  }

  initialized = false
}

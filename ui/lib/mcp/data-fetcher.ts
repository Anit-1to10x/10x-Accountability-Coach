/**
 * MCP Data Fetcher with Streaming Support
 *
 * Allows MCP tools to fetch data, process it in the sandbox,
 * and stream results back to the user for context building.
 */

import { executeToolCall, getToolsForLLM, loadMCPConfig } from './manager'
import { executeCode, formatResultForLLM } from '../sandbox/executor'
import { processFile, formatFileContext, getRelevantChunks } from '../file-processor'
import type { MCPToolCall, MCPToolResult } from '@/types/mcp'

// Streaming event types for MCP data operations
export type MCPStreamEvent =
  | { type: 'mcp_status'; status: 'checking' | 'connected' | 'disconnected'; servers?: string[] }
  | { type: 'mcp_fetching'; tool: string; message: string }
  | { type: 'mcp_data'; tool: string; data: any; size: number }
  | { type: 'mcp_processing'; message: string }
  | { type: 'mcp_context'; context: string }
  | { type: 'mcp_error'; error: string }
  | { type: 'sandbox_executing'; language: string; description: string }
  | { type: 'sandbox_result'; success: boolean; output: string; executionTime: number }

export interface MCPDataRequest {
  toolName: string
  arguments: Record<string, any>
  processWithCode?: {
    language: 'javascript' | 'python'
    code: string
  }
  createContext?: boolean
}

/**
 * Check MCP connection status
 */
export async function checkMCPStatus(): Promise<MCPStreamEvent> {
  try {
    const config = await loadMCPConfig()
    const enabledServers = config.servers.filter(s => s.enabled).map(s => s.name)

    if (!config.enabled || enabledServers.length === 0) {
      return { type: 'mcp_status', status: 'disconnected' }
    }

    return {
      type: 'mcp_status',
      status: 'connected',
      servers: enabledServers,
    }
  } catch {
    return { type: 'mcp_status', status: 'disconnected' }
  }
}

/**
 * Fetch data from MCP tool with streaming events
 */
export async function* fetchMCPData(
  request: MCPDataRequest
): AsyncGenerator<MCPStreamEvent> {
  // Check MCP status
  yield { type: 'mcp_status', status: 'checking' }

  const status = await checkMCPStatus()
  yield status

  if (status.type === 'mcp_status' && status.status === 'disconnected') {
    yield { type: 'mcp_error', error: 'MCP is not connected. Please configure MCP servers in settings.' }
    return
  }

  // Fetch data using MCP tool
  yield { type: 'mcp_fetching', tool: request.toolName, message: `Fetching data using ${request.toolName}...` }

  try {
    const toolCall: MCPToolCall = {
      id: `mcp-${Date.now()}`,
      name: request.toolName,
      arguments: request.arguments,
    }

    const result = await executeToolCall(toolCall)

    if (!result.success) {
      yield { type: 'mcp_error', error: result.error || 'Tool execution failed' }
      return
    }

    const dataSize = JSON.stringify(result.result).length
    yield { type: 'mcp_data', tool: request.toolName, data: result.result, size: dataSize }

    // Process data with code if requested
    if (request.processWithCode) {
      yield {
        type: 'sandbox_executing',
        language: request.processWithCode.language,
        description: 'Processing fetched data...',
      }

      // Inject the fetched data into the code
      const dataInjection = `const __mcpData = ${JSON.stringify(result.result)};\n`
      const fullCode = dataInjection + request.processWithCode.code

      const execResult = await executeCode({
        language: request.processWithCode.language,
        code: fullCode,
        timeout: 30000,
      })

      yield {
        type: 'sandbox_result',
        success: execResult.success,
        output: execResult.output,
        executionTime: execResult.executionTime,
      }

      // Use processed result for context
      if (request.createContext && execResult.success) {
        yield { type: 'mcp_processing', message: 'Building context from processed data...' }

        const context = buildDataContext(request.toolName, execResult.output)
        yield { type: 'mcp_context', context }
      }
    } else if (request.createContext) {
      // Build context directly from raw data
      yield { type: 'mcp_processing', message: 'Building context from data...' }

      const context = buildDataContext(request.toolName, result.result)
      yield { type: 'mcp_context', context }
    }
  } catch (error: any) {
    yield { type: 'mcp_error', error: error.message || 'Failed to fetch MCP data' }
  }
}

/**
 * Build context string from MCP data
 */
function buildDataContext(toolName: string, data: any): string {
  let context = `## Data from ${toolName}\n\n`

  if (typeof data === 'string') {
    // Already formatted string (from sandbox processing)
    context += data
  } else if (Array.isArray(data)) {
    context += `**Array with ${data.length} items**\n\n`
    // Show first few items
    const preview = data.slice(0, 5)
    context += '```json\n' + JSON.stringify(preview, null, 2) + '\n```\n'
    if (data.length > 5) {
      context += `\n*...and ${data.length - 5} more items*\n`
    }
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data)
    context += `**Object with keys:** ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}\n\n`
    context += '```json\n' + JSON.stringify(data, null, 2).slice(0, 2000) + '\n```\n'
  } else {
    context += String(data)
  }

  return context
}

/**
 * Execute multiple MCP data fetches in parallel
 */
export async function fetchMCPDataParallel(
  requests: MCPDataRequest[]
): Promise<{ results: MCPToolResult[]; contexts: string[] }> {
  const results = await Promise.all(
    requests.map(async (request) => {
      const toolCall: MCPToolCall = {
        id: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: request.toolName,
        arguments: request.arguments,
      }
      return executeToolCall(toolCall)
    })
  )

  const contexts = results
    .filter(r => r.success)
    .map((r, i) => buildDataContext(requests[i].toolName, r.result))

  return { results, contexts }
}

/**
 * Smart data fetcher that decides between MCP, file, or direct context
 */
export async function* smartFetchData(
  query: string,
  options: {
    files?: Array<{ name: string; content: string }>
    mcpTools?: string[]
    preferMCP?: boolean
  }
): AsyncGenerator<MCPStreamEvent | { type: 'file_context'; context: string }> {
  const { files, mcpTools, preferMCP } = options

  // Check if MCP can handle this query
  if (preferMCP && mcpTools && mcpTools.length > 0) {
    // Try to match query to available MCP tools
    const matchedTool = matchQueryToTool(query, mcpTools)

    if (matchedTool) {
      yield* fetchMCPData({
        toolName: matchedTool.name,
        arguments: matchedTool.args,
        createContext: true,
      })
      return
    }
  }

  // Fall back to file context
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const processed = await processFile(file.name, file.content)
        const chunks = getRelevantChunks(processed, query, 3)
        const context = formatFileContext(processed, chunks)
        yield { type: 'file_context', context }
      } catch {
        // Skip failed files
      }
    }
  }
}

/**
 * Match a user query to an available MCP tool
 */
function matchQueryToTool(
  query: string,
  availableTools: string[]
): { name: string; args: Record<string, any> } | null {
  const queryLower = query.toLowerCase()

  // Common patterns for tool matching
  const patterns: Array<{ pattern: RegExp; toolMatch: string; argsExtractor: (match: RegExpMatchArray) => Record<string, any> }> = [
    {
      pattern: /(?:search|find|look up)\s+(?:for\s+)?["']?([^"']+)["']?/i,
      toolMatch: 'search',
      argsExtractor: (m) => ({ query: m[1] }),
    },
    {
      pattern: /(?:get|fetch|read)\s+(?:data\s+)?(?:from\s+)?["']?([^"']+)["']?/i,
      toolMatch: 'read',
      argsExtractor: (m) => ({ path: m[1] }),
    },
    {
      pattern: /(?:list|show)\s+(?:all\s+)?(\w+)/i,
      toolMatch: 'list',
      argsExtractor: (m) => ({ type: m[1] }),
    },
  ]

  for (const { pattern, toolMatch, argsExtractor } of patterns) {
    const match = query.match(pattern)
    if (match) {
      // Find matching tool
      const tool = availableTools.find(t => t.toLowerCase().includes(toolMatch))
      if (tool) {
        return { name: tool, args: argsExtractor(match) }
      }
    }
  }

  return null
}

/**
 * Create MCP context for AI prompt
 */
export function formatMCPContext(events: MCPStreamEvent[]): string {
  let context = '## MCP Data Context\n\n'

  for (const event of events) {
    switch (event.type) {
      case 'mcp_status':
        if (event.status === 'connected' && event.servers) {
          context += `**Connected MCP Servers:** ${event.servers.join(', ')}\n\n`
        }
        break
      case 'mcp_data':
        context += `**Data from ${event.tool}** (${formatSize(event.size)}):\n`
        break
      case 'mcp_context':
        context += event.context + '\n\n'
        break
      case 'sandbox_result':
        if (event.success) {
          context += `**Processed Result:**\n${event.output}\n\n`
        }
        break
    }
  }

  return context
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

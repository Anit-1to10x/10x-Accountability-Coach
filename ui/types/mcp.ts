/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * MCPs allow extending the AI's capabilities with external tools and data sources.
 * Similar to how Claude Code Desktop handles MCP servers.
 */

export interface MCPServer {
  id: string
  name: string
  description: string
  type: 'stdio' | 'http' | 'sse'

  // Connection configuration
  command?: string           // For stdio: the command to run
  args?: string[]           // For stdio: command arguments
  url?: string              // For http/sse: the server URL
  headers?: Record<string, string>  // For http: custom headers
  env?: Record<string, string>      // Environment variables for the server

  // Status
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastConnected?: string
  errorMessage?: string

  // Capabilities (discovered after connection)
  capabilities?: {
    tools?: MCPTool[]
    resources?: MCPResource[]
    prompts?: MCPPrompt[]
  }

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
  serverId?: string  // Which server this tool belongs to
}

export interface MCPToolCall {
  id: string
  name: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  toolCallId: string
  success: boolean
  result?: any
  error?: string
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPPrompt {
  name: string
  description?: string
  arguments?: MCPPromptArgument[]
}

export interface MCPPromptArgument {
  name: string
  description?: string
  required?: boolean
}

export interface MCPConfig {
  enabled: boolean
  servers: MCPServer[]
  lastUpdated: string | null
}

// Preset MCP configurations for common services
export const MCP_PRESETS: Partial<MCPServer>[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Connect to Supabase for database operations (read-only via MCP)',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-supabase'],
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read and write files on the local filesystem',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-filesystem', './data'],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Interact with GitHub repositories',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-github'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send and read messages from Slack',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-slack'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access Notion pages and databases',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-notion'],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query PostgreSQL databases',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-postgres'],
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Persistent memory for the AI assistant',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-memory'],
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web search powered by Brave',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropics/mcp-server-brave-search'],
  },
]

/**
 * Data Source Abstraction Layer
 *
 * This module provides a unified interface for data operations that can
 * switch between local file storage, Supabase cloud storage, or MCP servers.
 *
 * Priority Order (when available):
 * 1. MCP (Model Context Protocol) - when MCP is configured and available
 * 2. Supabase - when enabled in settings AND properly configured
 * 3. Local file system - default fallback
 *
 * Usage:
 *   import { getActiveDataSource, getDataSourceStatus } from '@/lib/data-source'
 *   const source = await getActiveDataSource() // 'mcp' | 'supabase' | 'local'
 */

// Data source types
export type DataSourceType = 'local' | 'supabase' | 'mcp'

// Settings file to persist user preferences
let cachedSettings: DataSourceSettings | null = null

export interface DataSourceSettings {
  supabaseEnabled: boolean
  mcpEnabled: boolean
  preferMcp: boolean // When true, MCP takes priority over Supabase
  lastUpdated?: string
}

/**
 * Get current data source from settings (toggle-based)
 * Supabase is only used when explicitly enabled in settings
 */
export function getDataSource(): DataSourceType {
  // Check if MCP is available and enabled
  if (isMcpAvailable()) {
    return 'mcp'
  }

  // Check if Supabase is enabled AND configured
  if (isSupabaseEnabled() && isSupabaseConfigured()) {
    return 'supabase'
  }

  return 'local'
}

/**
 * Check if Supabase is properly configured in environment
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL !== 'https://your-project.supabase.co' &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_ANON_KEY !== 'your-anon-key-here'
  )
}

/**
 * Check if Supabase is enabled in settings (toggle)
 */
export function isSupabaseEnabled(): boolean {
  const settings = getDataSourceSettings()
  return settings.supabaseEnabled
}

/**
 * Check if MCP is available and configured
 */
export function isMcpAvailable(): boolean {
  // Check for MCP environment configuration
  const mcpConfig = process.env.MCP_SERVER_URL || process.env.MCP_ENABLED
  const settings = getDataSourceSettings()
  return settings.mcpEnabled && !!mcpConfig
}

/**
 * Get data source settings from environment/cache
 */
export function getDataSourceSettings(): DataSourceSettings {
  if (cachedSettings) {
    return cachedSettings
  }

  // Check environment for defaults
  const supabaseEnabled = process.env.DATA_SOURCE === 'supabase' ||
    process.env.SUPABASE_ENABLED === 'true'
  const mcpEnabled = process.env.MCP_ENABLED === 'true'
  const preferMcp = process.env.PREFER_MCP !== 'false' // Default to true

  cachedSettings = {
    supabaseEnabled,
    mcpEnabled,
    preferMcp,
  }

  return cachedSettings
}

/**
 * Update data source settings
 */
export function setDataSourceSettings(settings: Partial<DataSourceSettings>): void {
  cachedSettings = {
    ...getDataSourceSettings(),
    ...settings,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Enable Supabase (called from settings toggle)
 */
export function enableSupabase(): void {
  setDataSourceSettings({ supabaseEnabled: true })
}

/**
 * Disable Supabase (called from settings toggle)
 */
export function disableSupabase(): void {
  setDataSourceSettings({ supabaseEnabled: false })
}

/**
 * Enable MCP
 */
export function enableMcp(): void {
  setDataSourceSettings({ mcpEnabled: true })
}

/**
 * Disable MCP
 */
export function disableMcp(): void {
  setDataSourceSettings({ mcpEnabled: false })
}

// Data source configuration status
export interface DataSourceStatus {
  current: DataSourceType
  available: {
    local: boolean
    supabase: boolean
    mcp: boolean
  }
  enabled: {
    supabase: boolean
    mcp: boolean
  }
  supabaseUrl?: string
  mcpUrl?: string
  localPath: string
  message: string
}

/**
 * Get comprehensive data source status
 */
export function getDataSourceStatus(): DataSourceStatus {
  const current = getDataSource()
  const settings = getDataSourceSettings()

  const messages: Record<DataSourceType, string> = {
    mcp: 'Using MCP (Model Context Protocol) for data',
    supabase: 'Using Supabase cloud database',
    local: 'Using local file storage',
  }

  return {
    current,
    available: {
      local: true,
      supabase: isSupabaseConfigured(),
      mcp: !!process.env.MCP_SERVER_URL,
    },
    enabled: {
      supabase: settings.supabaseEnabled,
      mcp: settings.mcpEnabled,
    },
    supabaseUrl: process.env.SUPABASE_URL,
    mcpUrl: process.env.MCP_SERVER_URL,
    localPath: process.env.OPENANALYST_DIR || './data',
    message: messages[current],
  }
}

/**
 * SUPABASE CLIENT (Prepared but requires @supabase/supabase-js)
 *
 * To enable Supabase:
 * 1. Install: npm install @supabase/supabase-js
 * 2. Uncomment the code below
 * 3. Set DATA_SOURCE=supabase in .env.local
 * 4. Configure SUPABASE_URL and SUPABASE_ANON_KEY
 */

/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabase data operations
export const supabaseOperations = {
  profiles: {
    async list() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async get(id: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    async create(profile: any) {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
  challenges: {
    async list() {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async get(id: string) {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    async create(challenge: any) {
      const { data, error } = await supabase
        .from('challenges')
        .insert(challenge)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  },
  todos: {
    async list(profileId?: string) {
      let query = supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      if (profileId) {
        query = query.eq('profile_id', profileId)
      }
      const { data, error } = await query
      if (error) throw error
      return data
    },
    async create(todo: any) {
      const { data, error } = await supabase
        .from('todos')
        .insert(todo)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
  agents: {
    async list() {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async get(id: string) {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    async create(agent: any) {
      const { data, error } = await supabase
        .from('agents')
        .insert(agent)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  },
  skills: {
    async list() {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    async get(id: string) {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    async create(skill: any) {
      const { data, error } = await supabase
        .from('skills')
        .insert(skill)
        .select()
        .single()
      if (error) throw error
      return data
    }
  },
  activityLog: {
    async list(limit = 50) {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
    async create(activity: any) {
      const { data, error } = await supabase
        .from('activity_log')
        .insert(activity)
        .select()
        .single()
      if (error) throw error
      return data
    }
  }
}
*/

// Export placeholder for when Supabase is not configured
export const supabaseOperations = null

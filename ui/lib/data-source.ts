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

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Data source types
export type DataSourceType = 'local' | 'supabase' | 'mcp'

// Settings file to persist user preferences
let cachedSettings: DataSourceSettings | null = null

// Supabase client singleton
let supabaseClient: SupabaseClient | null = null

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
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return !!(
    url &&
    url !== 'https://your-project.supabase.co' &&
    key &&
    key !== 'your-anon-key-here'
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
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    mcpUrl: process.env.MCP_SERVER_URL,
    localPath: process.env.OPENANALYST_DIR || './data',
    message: messages[current],
  }
}

/**
 * Get Supabase client (singleton)
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    return supabaseClient
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

/**
 * Supabase data operations
 * These are used when DATA_SOURCE=supabase is set
 */
export const supabaseOperations = {
  profiles: {
    async list() {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async get(id: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    async create(profile: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id: string, updates: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

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
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
  challenges: {
    async list(profileId?: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      let query = supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileId) {
        query = query.eq('profile_id', profileId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    async get(id: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    async create(challenge: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('challenges')
        .insert(challenge)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id: string, updates: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async delete(id: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
  todos: {
    async list(profileId?: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

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
    async get(id: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    async create(todo: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('todos')
        .insert(todo)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id: string, updates: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

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
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
  checkins: {
    async list(profileId?: string, challengeId?: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      let query = supabase
        .from('checkins')
        .select('*')
        .order('date', { ascending: false })

      if (profileId) {
        query = query.eq('profile_id', profileId)
      }
      if (challengeId) {
        query = query.eq('challenge_id', challengeId)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    async create(checkin: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('checkins')
        .insert(checkin)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async getByDate(challengeId: string, date: string) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', date)
        .single()
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return data
    }
  },
  activities: {
    async list(profileId: string, limit = 50) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
    async create(activity: any) {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase not configured')

      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single()
      if (error) throw error
      return data
    }
  }
}

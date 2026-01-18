/**
 * Data Source Abstraction Layer
 *
 * This module provides a unified interface for data operations that can
 * switch between local file storage and Supabase cloud storage.
 *
 * Usage:
 *   import { dataSource } from '@/lib/data-source'
 *   const profiles = await dataSource.profiles.list()
 */

// Data source type
export type DataSourceType = 'local' | 'supabase'

// Get current data source from environment
export function getDataSource(): DataSourceType {
  const source = process.env.DATA_SOURCE || 'local'
  return source === 'supabase' ? 'supabase' : 'local'
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL !== 'https://your-project.supabase.co' &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_ANON_KEY !== 'your-anon-key-here'
  )
}

// Data source configuration status
export interface DataSourceStatus {
  current: DataSourceType
  supabaseConfigured: boolean
  supabaseUrl?: string
  localPath: string
}

export function getDataSourceStatus(): DataSourceStatus {
  return {
    current: getDataSource(),
    supabaseConfigured: isSupabaseConfigured(),
    supabaseUrl: process.env.SUPABASE_URL,
    localPath: process.env.OPENANALYST_DIR || './data',
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

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

const CONFIG_FILE = path.join(DATA_DIR, 'data-source-config.json')

interface DataSourceConfig {
  source: 'local' | 'supabase'
  lastUpdated: string | null
}

async function ensureConfigFile(): Promise<DataSourceConfig> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    const defaultConfig: DataSourceConfig = {
      source: 'local',
      lastUpdated: null,
    }
    await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2))
    return defaultConfig
  }
}

// GET: Get current data source configuration
export async function GET() {
  try {
    const config = await ensureConfigFile()

    // Check if Supabase is configured in environment
    const supabaseConfigured = !!(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_URL !== 'https://your-project.supabase.co' &&
      process.env.SUPABASE_ANON_KEY &&
      process.env.SUPABASE_ANON_KEY !== 'your-anon-key-here'
    )

    return NextResponse.json({
      source: config.source,
      lastUpdated: config.lastUpdated,
      supabase: {
        configured: supabaseConfigured,
        url: process.env.SUPABASE_URL || null,
      },
      local: {
        path: DATA_DIR,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update data source
export async function PUT(request: NextRequest) {
  try {
    const { source } = await request.json()

    if (!['local', 'supabase'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source. Must be "local" or "supabase"' },
        { status: 400 }
      )
    }

    // If switching to Supabase, verify it's configured
    if (source === 'supabase') {
      const supabaseConfigured = !!(
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_URL !== 'https://your-project.supabase.co' &&
        process.env.SUPABASE_ANON_KEY &&
        process.env.SUPABASE_ANON_KEY !== 'your-anon-key-here'
      )

      if (!supabaseConfigured) {
        return NextResponse.json(
          { error: 'Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local' },
          { status: 400 }
        )
      }
    }

    const config: DataSourceConfig = {
      source,
      lastUpdated: new Date().toISOString(),
    }

    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))

    return NextResponse.json({
      success: true,
      source: config.source,
      lastUpdated: config.lastUpdated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

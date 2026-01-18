import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PROJECT_ROOT } from '@/lib/paths'

const SUPABASE_CONFIG_FILE = path.join(DATA_DIR, 'supabase-config.json')
const SCHEMA_DIR = path.join(PROJECT_ROOT, 'data', 'schemas')

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
  configured: boolean
  schemaVersion: number
  lastMigration: string | null
  createdAt: string
  updatedAt: string
}

async function loadConfig(): Promise<SupabaseConfig | null> {
  try {
    const content = await fs.readFile(SUPABASE_CONFIG_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function saveConfig(config: SupabaseConfig): Promise<void> {
  await fs.writeFile(SUPABASE_CONFIG_FILE, JSON.stringify(config, null, 2))
}

// GET: Check Supabase setup status
export async function GET() {
  try {
    const config = await loadConfig()

    // Check environment variables
    const envUrl = process.env.SUPABASE_URL
    const envAnonKey = process.env.SUPABASE_ANON_KEY
    const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const isEnvConfigured = !!(
      envUrl &&
      envUrl !== 'https://your-project.supabase.co' &&
      envAnonKey &&
      envAnonKey !== 'your-anon-key-here'
    )

    // Read schema file for instructions
    let schemaContent = ''
    try {
      schemaContent = await fs.readFile(path.join(SCHEMA_DIR, 'full_schema.sql'), 'utf-8')
    } catch {
      schemaContent = ''
    }

    return NextResponse.json({
      configured: config?.configured || isEnvConfigured,
      source: config ? 'config_file' : isEnvConfigured ? 'env' : 'none',
      url: config?.url || envUrl || null,
      schemaVersion: config?.schemaVersion || 0,
      lastMigration: config?.lastMigration || null,
      hasSchema: !!schemaContent,
      schemaPreview: schemaContent.slice(0, 500),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST: Save Supabase credentials and test connection
export async function POST(request: NextRequest) {
  try {
    const { url, anonKey, serviceRoleKey } = await request.json()

    // Validate inputs
    if (!url || !anonKey) {
      return NextResponse.json(
        { error: 'Supabase URL and Anon Key are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    if (!url.includes('supabase.co') && !url.includes('supabase.in')) {
      return NextResponse.json(
        { error: 'Invalid Supabase URL format' },
        { status: 400 }
      )
    }

    // Test connection by making a simple request
    try {
      const testResponse = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      })

      if (!testResponse.ok && testResponse.status !== 404) {
        throw new Error(`Connection test failed: ${testResponse.status}`)
      }
    } catch (connError: any) {
      return NextResponse.json(
        { error: `Failed to connect to Supabase: ${connError.message}` },
        { status: 400 }
      )
    }

    // Save configuration
    const config: SupabaseConfig = {
      url,
      anonKey,
      serviceRoleKey: serviceRoleKey || undefined,
      configured: true,
      schemaVersion: 0,
      lastMigration: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await saveConfig(config)

    // Also update .env.local for Next.js
    const envPath = path.join(PROJECT_ROOT, 'ui', '.env.local')
    let envContent = ''
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
    } catch {
      envContent = ''
    }

    // Update or add Supabase variables
    const envLines = envContent.split('\n').filter(line =>
      !line.startsWith('SUPABASE_URL=') &&
      !line.startsWith('SUPABASE_ANON_KEY=') &&
      !line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')
    )

    envLines.push(`SUPABASE_URL=${url}`)
    envLines.push(`SUPABASE_ANON_KEY=${anonKey}`)
    if (serviceRoleKey) {
      envLines.push(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`)
    }

    await fs.writeFile(envPath, envLines.join('\n'))

    return NextResponse.json({
      success: true,
      message: 'Supabase configured successfully',
      url,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Mark schema as migrated
export async function PUT(request: NextRequest) {
  try {
    const { schemaVersion } = await request.json()

    const config = await loadConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'Supabase not configured. Please set up credentials first.' },
        { status: 400 }
      )
    }

    config.schemaVersion = schemaVersion || 1
    config.lastMigration = new Date().toISOString()
    config.updatedAt = new Date().toISOString()

    await saveConfig(config)

    return NextResponse.json({
      success: true,
      schemaVersion: config.schemaVersion,
      lastMigration: config.lastMigration,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

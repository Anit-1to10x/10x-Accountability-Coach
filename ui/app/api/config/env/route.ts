/**
 * Environment Configuration API
 *
 * Manages API keys and environment variables.
 * Saves to ui/.env.local for persistence.
 *
 * GET /api/config/env - Get current env config (keys masked)
 * PUT /api/config/env - Update env variables
 * POST /api/config/env/test - Test an API key
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const ENV_FILE = path.join(process.cwd(), '.env.local')

interface EnvConfig {
  OPENANALYST_API_URL?: string
  OPENANALYST_API_KEY?: string
  OPENANALYST_MODEL?: string
  GEMINI_API_KEY?: string
  BRAVE_API_KEY?: string
  PERPLEXITY_API_KEY?: string
  SERPER_API_KEY?: string
  MCP_ENABLED?: string
  [key: string]: string | undefined
}

/**
 * Parse .env.local file content
 */
function parseEnvFile(content: string): EnvConfig {
  const config: EnvConfig = {}
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=')
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      config[key.trim()] = value
    }
  }

  return config
}

/**
 * Generate .env.local file content
 */
function generateEnvFile(config: EnvConfig, existingContent?: string): string {
  const lines: string[] = []
  const existingKeys = new Set<string>()

  // Preserve existing comments and structure if file exists
  if (existingContent) {
    const existingLines = existingContent.split('\n')
    for (const line of existingLines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || !trimmed) {
        lines.push(line)
        continue
      }

      const [key] = trimmed.split('=')
      if (key) {
        const keyTrimmed = key.trim()
        existingKeys.add(keyTrimmed)
        // Update with new value or keep existing
        if (config[keyTrimmed] !== undefined) {
          lines.push(`${keyTrimmed}=${config[keyTrimmed]}`)
        } else {
          lines.push(line)
        }
      }
    }
  }

  // Add new keys that weren't in the original file
  for (const [key, value] of Object.entries(config)) {
    if (!existingKeys.has(key) && value !== undefined) {
      lines.push(`${key}=${value}`)
    }
  }

  return lines.join('\n')
}

/**
 * Mask API key for display
 */
function maskKey(key: string | undefined): string | null {
  if (!key) return null
  if (key.length <= 8) return '****'
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

/**
 * GET: Get current environment configuration (keys masked)
 */
export async function GET() {
  try {
    let config: EnvConfig = {}

    // Try to read from file first
    try {
      const content = await fs.readFile(ENV_FILE, 'utf-8')
      config = parseEnvFile(content)
    } catch {
      // File doesn't exist, use process.env
    }

    // Merge with process.env (runtime values take precedence)
    const envVars = [
      'OPENANALYST_API_URL',
      'OPENANALYST_API_KEY',
      'OPENANALYST_MODEL',
      'GEMINI_API_KEY',
      'BRAVE_API_KEY',
      'PERPLEXITY_API_KEY',
      'SERPER_API_KEY',
      'MCP_ENABLED',
    ]

    const masked: Record<string, { configured: boolean; masked: string | null; source: string }> = {}

    for (const key of envVars) {
      const fileValue = config[key]
      const envValue = process.env[key]
      const value = envValue || fileValue

      masked[key] = {
        configured: !!value,
        masked: maskKey(value),
        source: envValue ? 'runtime' : (fileValue ? 'file' : 'none'),
      }
    }

    return NextResponse.json({
      config: masked,
      envFilePath: ENV_FILE,
      exists: await fs.access(ENV_FILE).then(() => true).catch(() => false),
    })
  } catch (error: any) {
    console.error('Failed to read env config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update environment variables
 */
export async function PUT(request: NextRequest) {
  try {
    const updates: EnvConfig = await request.json()

    // Validate required format for known keys
    const validations: Record<string, (val: string) => boolean> = {
      OPENANALYST_API_KEY: (v) => v.startsWith('sk-oa-'),
      OPENANALYST_API_URL: (v) => v.startsWith('http'),
      GEMINI_API_KEY: (v) => v.length > 10,
      BRAVE_API_KEY: (v) => v.length > 10,
      PERPLEXITY_API_KEY: (v) => v.startsWith('pplx-'),
    }

    for (const [key, value] of Object.entries(updates)) {
      if (value && validations[key] && !validations[key](value)) {
        return NextResponse.json(
          { error: `Invalid format for ${key}` },
          { status: 400 }
        )
      }
    }

    // Read existing file content
    let existingContent = ''
    try {
      existingContent = await fs.readFile(ENV_FILE, 'utf-8')
    } catch {
      // File doesn't exist, will create new one
      existingContent = `# 10X Accountability Coach Environment Configuration
# Generated on ${new Date().toISOString()}

# OpenAnalyst API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_MODEL=openanalyst-beta

# Optional APIs
`
    }

    // Generate new content preserving structure
    const newContent = generateEnvFile(updates, existingContent)

    // Write to file
    await fs.writeFile(ENV_FILE, newContent, 'utf-8')

    // Note: Runtime process.env won't be updated until server restart
    // But we can update for the current request
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        process.env[key] = value
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Environment variables updated. Some changes may require server restart.',
      requiresRestart: true,
    })
  } catch (error: any) {
    console.error('Failed to update env config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST: Test an API key
 */
export async function POST(request: NextRequest) {
  try {
    const { key, value, testUrl } = await request.json()

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Test the API key based on which service it's for
    let testResult = { success: false, message: 'Unknown key type' }

    if (key === 'OPENANALYST_API_KEY') {
      // Test OpenAnalyst API
      const url = testUrl || process.env.OPENANALYST_API_URL || 'https://api.openanalyst.com/api'
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${value}`,
          },
        })
        testResult = {
          success: response.ok,
          message: response.ok ? 'API key is valid' : `API returned status ${response.status}`,
        }
      } catch (err: any) {
        testResult = { success: false, message: err.message }
      }
    } else if (key === 'GEMINI_API_KEY') {
      // Test Gemini API
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${value}`)
        testResult = {
          success: response.ok,
          message: response.ok ? 'API key is valid' : 'Invalid API key',
        }
      } catch (err: any) {
        testResult = { success: false, message: err.message }
      }
    } else if (key === 'BRAVE_API_KEY') {
      // Test Brave Search API
      try {
        const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=test', {
          headers: {
            'X-Subscription-Token': value,
          },
        })
        testResult = {
          success: response.ok,
          message: response.ok ? 'API key is valid' : 'Invalid API key',
        }
      } catch (err: any) {
        testResult = { success: false, message: err.message }
      }
    } else {
      // For other keys, just validate format
      testResult = {
        success: value.length > 10,
        message: value.length > 10 ? 'Key format looks valid' : 'Key seems too short',
      }
    }

    return NextResponse.json(testResult)
  } catch (error: any) {
    console.error('Failed to test API key:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { Punishment } from '@/types/streak'
import { DATA_DIR } from '@/lib/paths'

const PUNISHMENTS_DIR = path.join(DATA_DIR, 'punishments')
const ACTIVE_FILE = path.join(PUNISHMENTS_DIR, 'active.md')
const HISTORY_FILE = path.join(PUNISHMENTS_DIR, 'history.md')

interface PunishmentRecord {
  punishment: Punishment
  challengeId: string
  challengeName: string
}

async function ensurePunishmentsDir() {
  await fs.mkdir(PUNISHMENTS_DIR, { recursive: true })

  // Initialize files if they don't exist
  try {
    await fs.access(ACTIVE_FILE)
  } catch {
    await fs.writeFile(ACTIVE_FILE, `# Active Punishments

`, 'utf-8')
  }

  try {
    await fs.access(HISTORY_FILE)
  } catch {
    await fs.writeFile(HISTORY_FILE, `# Punishment History

`, 'utf-8')
  }
}

// Parse MD file to extract punishment records
function parsePunishmentsMd(content: string): PunishmentRecord[] {
  const records: PunishmentRecord[] = []
  const sections = content.split(/^## /m).slice(1) // Skip header

  for (const section of sections) {
    const lines = section.split('\n')
    const titleMatch = lines[0]?.match(/(.+?)\s*\((.+?)\)/)

    if (!titleMatch) continue

    const record: any = {
      punishment: {},
      challengeId: '',
      challengeName: titleMatch[1].trim()
    }

    for (const line of lines) {
      const match = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/i)
      if (match) {
        const key = match[1].toLowerCase().replace(/\s+/g, '_')
        let value: any = match[2].trim()

        // Parse special values
        if (value.match(/^\d+$/)) value = parseInt(value)

        // Assign to correct object
        if (['challenge_id', 'challenge_name'].includes(key)) {
          if (key === 'challenge_id') record.challengeId = value
          if (key === 'challenge_name') record.challengeName = value
        } else {
          record.punishment[key] = value
        }
      }
    }

    if (record.challengeId) {
      records.push(record)
    }
  }

  return records
}

// GET: List all active punishments
export async function GET(request: NextRequest) {
  try {
    await ensurePunishmentsDir()

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'active' or 'history'
    const challengeId = searchParams.get('challengeId')

    let filePath = type === 'history' ? HISTORY_FILE : ACTIVE_FILE
    const data = await fs.readFile(filePath, 'utf-8')
    let punishments: PunishmentRecord[] = parsePunishmentsMd(data)

    // Filter by challengeId if provided
    if (challengeId) {
      punishments = punishments.filter(p => p.challengeId === challengeId)
    }

    return NextResponse.json({ punishments })
  } catch (error: any) {
    console.error('Failed to fetch punishments:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST: Create a new punishment
export async function POST(request: NextRequest) {
  try {
    await ensurePunishmentsDir()
    const body = await request.json()
    const { punishment, challengeId, challengeName } = body as {
      punishment: Punishment
      challengeId: string
      challengeName: string
    }

    // Read current active punishments
    let content = await fs.readFile(ACTIVE_FILE, 'utf-8')

    // Add new punishment
    const newRecord: PunishmentRecord = {
      punishment: {
        ...punishment,
        id: punishment.id || `pun-${Date.now()}`,
        status: punishment.status || 'active',
      },
      challengeId,
      challengeName,
    }

    // Append new punishment entry
    const punishmentEntry = `## ${challengeName} (${newRecord.punishment.id})
- **Challenge ID:** ${challengeId}
- **Challenge Name:** ${challengeName}
- **ID:** ${newRecord.punishment.id}
- **Type:** ${newRecord.punishment.type || 'consequence'}
- **Description:** ${newRecord.punishment.description || 'No description'}
- **Status:** ${newRecord.punishment.status}
- **Created At:** ${newRecord.punishment.createdAt || new Date().toISOString()}
- **Triggered By:** ${newRecord.punishment.triggeredBy || 'streak_break'}

`

    content += punishmentEntry
    await fs.writeFile(ACTIVE_FILE, content, 'utf-8')

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file_created',
          data: {
            filePath: 'punishments/active.md',
            purpose: 'Active punishments registry',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      punishment: newRecord,
    })
  } catch (error: any) {
    console.error('Failed to create punishment:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

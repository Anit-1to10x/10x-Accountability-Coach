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

// GET: Get specific punishment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check active punishments
    const activeData = await fs.readFile(ACTIVE_FILE, 'utf-8')
    const activePunishments: PunishmentRecord[] = parsePunishmentsMd(activeData)
    const activePunishment = activePunishments.find(p => p.punishment.id === id)

    if (activePunishment) {
      return NextResponse.json({ punishment: activePunishment })
    }

    // Check history
    const historyData = await fs.readFile(HISTORY_FILE, 'utf-8')
    const historyPunishments: PunishmentRecord[] = parsePunishmentsMd(historyData)
    const historyPunishment = historyPunishments.find(p => p.punishment.id === id)

    if (historyPunishment) {
      return NextResponse.json({ punishment: historyPunishment })
    }

    return NextResponse.json(
      { error: 'Punishment not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error fetching punishment:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH: Update punishment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body as { status: 'executed' | 'forgiven' }

    // Read active punishments
    const activeData = await fs.readFile(ACTIVE_FILE, 'utf-8')
    let activePunishments: PunishmentRecord[] = parsePunishmentsMd(activeData)

    // Find and update punishment
    const punishmentIndex = activePunishments.findIndex(p => p.punishment.id === id)

    if (punishmentIndex === -1) {
      return NextResponse.json(
        { error: 'Punishment not found' },
        { status: 404 }
      )
    }

    const punishmentRecord = activePunishments[punishmentIndex]
    punishmentRecord.punishment.status = status
    punishmentRecord.punishment.executedAt = new Date().toISOString()

    // Move to history
    const historyData = await fs.readFile(HISTORY_FILE, 'utf-8')
    let historyContent = historyData

    // Append to history
    const historyEntry = `## ${punishmentRecord.challengeName} (${punishmentRecord.punishment.id})
- **Challenge ID:** ${punishmentRecord.challengeId}
- **Challenge Name:** ${punishmentRecord.challengeName}
- **ID:** ${punishmentRecord.punishment.id}
- **Type:** ${punishmentRecord.punishment.type || 'consequence'}
- **Description:** ${punishmentRecord.punishment.description || 'No description'}
- **Status:** ${status}
- **Created At:** ${punishmentRecord.punishment.createdAt || 'Unknown'}
- **Executed At:** ${punishmentRecord.punishment.executedAt}
- **Triggered By:** ${punishmentRecord.punishment.triggeredBy || 'streak_break'}

`

    historyContent += historyEntry

    // Remove from active (regenerate active file without this punishment)
    activePunishments = activePunishments.filter(p => p.punishment.id !== id)

    let newActiveContent = `# Active Punishments

`
    for (const record of activePunishments) {
      newActiveContent += `## ${record.challengeName} (${record.punishment.id})
- **Challenge ID:** ${record.challengeId}
- **Challenge Name:** ${record.challengeName}
- **ID:** ${record.punishment.id}
- **Type:** ${record.punishment.type || 'consequence'}
- **Description:** ${record.punishment.description || 'No description'}
- **Status:** ${record.punishment.status}
- **Created At:** ${record.punishment.createdAt || new Date().toISOString()}
- **Triggered By:** ${record.punishment.triggeredBy || 'streak_break'}

`
    }

    // Save both files
    await fs.writeFile(ACTIVE_FILE, newActiveContent, 'utf-8')
    await fs.writeFile(HISTORY_FILE, historyContent, 'utf-8')

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file_modified',
          data: {
            filePath: 'punishments/active.md',
            original: `Punishment ${id} was active`,
            changes: `Punishment ${status}`,
            date: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      punishment: punishmentRecord,
    })
  } catch (error: any) {
    console.error('Error updating punishment:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete punishment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Read active punishments
    const activeData = await fs.readFile(ACTIVE_FILE, 'utf-8')
    let activePunishments: PunishmentRecord[] = parsePunishmentsMd(activeData)

    // Filter out the punishment
    const originalLength = activePunishments.length
    activePunishments = activePunishments.filter(p => p.punishment.id !== id)

    if (activePunishments.length === originalLength) {
      return NextResponse.json(
        { error: 'Punishment not found' },
        { status: 404 }
      )
    }

    // Regenerate active file without the deleted punishment
    let newActiveContent = `# Active Punishments

`
    for (const record of activePunishments) {
      newActiveContent += `## ${record.challengeName} (${record.punishment.id})
- **Challenge ID:** ${record.challengeId}
- **Challenge Name:** ${record.challengeName}
- **ID:** ${record.punishment.id}
- **Type:** ${record.punishment.type || 'consequence'}
- **Description:** ${record.punishment.description || 'No description'}
- **Status:** ${record.punishment.status}
- **Created At:** ${record.punishment.createdAt || new Date().toISOString()}
- **Triggered By:** ${record.punishment.triggeredBy || 'streak_break'}

`
    }

    // Save
    await fs.writeFile(ACTIVE_FILE, newActiveContent, 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Punishment deleted',
    })
  } catch (error: any) {
    console.error('Error deleting punishment:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

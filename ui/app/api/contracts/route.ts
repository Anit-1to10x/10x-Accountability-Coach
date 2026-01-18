import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

export async function GET() {
  try {
    const contractsDir = path.join(DATA_DIR, 'contracts')
    const activeFile = path.join(contractsDir, 'active.json')

    try {
      const data = await fs.readFile(activeFile, 'utf-8')
      return NextResponse.json(JSON.parse(data))
    } catch {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Failed to load contracts:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const contractsDir = path.join(DATA_DIR, 'contracts')
    await fs.mkdir(contractsDir, { recursive: true })

    const contract = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      status: 'active',
      missCount: 0,
      totalPaid: 0,
      history: [],
    }

    // Save contract
    const activeFile = path.join(contractsDir, 'active.json')
    let contracts = []
    try {
      const existing = await fs.readFile(activeFile, 'utf-8')
      contracts = JSON.parse(existing)
    } catch {
      // File doesn't exist
    }

    contracts.push(contract)
    await fs.writeFile(activeFile, JSON.stringify(contracts, null, 2))

    // Create contract markdown file
    const contractMd = `# Commitment Contract

**Challenge:** ${contract.challengeName}
**Stakes:** $${contract.stakes} per miss
**Referee:** ${contract.refereeName} (${contract.refereeEmail})
${contract.antiCharity ? `**Anti-Charity:** ${contract.antiCharity}` : ''}
**Escalating:** ${contract.escalating ? 'Yes' : 'No'}

**Created:** ${contract.createdAt}

---

## Terms

I commit to completing my challenge: ${contract.challengeName}

If I miss a scheduled session without valid reason:
- I will pay $${contract.stakes} ${contract.antiCharity ? `to ${contract.antiCharity}` : ''}
- My referee (${contract.refereeName}) will be notified
${contract.escalating ? '- Stakes will double for each subsequent miss' : ''}

## History

*Contract signed. No misses yet.*
`

    await fs.writeFile(
      path.join(contractsDir, `${contract.id}.md`),
      contractMd
    )

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Failed to create contract:', error)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}

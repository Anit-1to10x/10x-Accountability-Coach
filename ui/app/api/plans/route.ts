import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

export async function GET() {
  try {
    const challengesDir = PATHS.challenges

    // Ensure challenges directory exists
    try {
      await fs.access(challengesDir)
    } catch {
      return NextResponse.json([])
    }

    const challenges = await fs.readdir(challengesDir)
    const plans = []

    for (const challengeId of challenges) {
      const planPath = path.join(challengesDir, challengeId, 'plan.md')
      const metaPath = path.join(challengesDir, challengeId, '.skill-meta.json')

      try {
        // Check if plan exists
        await fs.access(planPath)
        const planContent = await fs.readFile(planPath, 'utf-8')

        // Read metadata for challenge name
        let challengeName = challengeId
        try {
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'))
          challengeName = meta.name || challengeId
        } catch {
          // Metadata not found, use challengeId
        }

        plans.push({
          challengeId,
          challengeName,
          content: planContent,
          updatedAt: (await fs.stat(planPath)).mtime.toISOString(),
        })
      } catch {
        // Plan doesn't exist for this challenge
        continue
      }
    }

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, getProfilePaths } from '@/lib/paths'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    const plans: any[] = []

    // Source 1: Challenge-embedded plans (data/challenges/{id}/plan.md)
    const challengesDir = PATHS.challenges
    try {
      await fs.access(challengesDir)
      const challenges = await fs.readdir(challengesDir)

      for (const challengeId of challenges) {
        const planPath = path.join(challengesDir, challengeId, 'plan.md')
        const metaPath = path.join(challengesDir, challengeId, '.skill-meta.json')

        try {
          await fs.access(planPath)
          const planContent = (await fs.readFile(planPath, 'utf-8')).replace(/\r\n/g, '\n')

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
            source: 'challenge',
          })
        } catch {
          continue
        }
      }
    } catch {
      // Challenges dir doesn't exist
    }

    // Source 2: Profile-specific standalone plans (data/profiles/{profileId}/plans/)
    if (profileId) {
      const plansDir = path.join(getProfilePaths(profileId).profile, 'plans')
      try {
        await fs.access(plansDir)
        const planFiles = await fs.readdir(plansDir, { withFileTypes: true })

        for (const entry of planFiles) {
          if (entry.isDirectory()) {
            const planJsonPath = path.join(plansDir, entry.name, 'plan.json')
            try {
              const planData = JSON.parse(await fs.readFile(planJsonPath, 'utf-8'))
              plans.push({
                ...planData,
                challengeId: planData.id || entry.name,
                challengeName: planData.name || entry.name,
                content: JSON.stringify(planData, null, 2),
                updatedAt: (await fs.stat(planJsonPath)).mtime.toISOString(),
                source: 'profile',
              })
            } catch {
              continue
            }
          } else if (entry.name.endsWith('.json')) {
            try {
              const planData = JSON.parse(await fs.readFile(path.join(plansDir, entry.name), 'utf-8'))
              plans.push({
                ...planData,
                challengeId: planData.id || entry.name.replace('.json', ''),
                challengeName: planData.name || entry.name.replace('.json', ''),
                content: JSON.stringify(planData, null, 2),
                updatedAt: (await fs.stat(path.join(plansDir, entry.name))).mtime.toISOString(),
                source: 'profile',
              })
            } catch {
              continue
            }
          }
        }
      } catch {
        // Plans dir doesn't exist for this profile
      }
    }

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

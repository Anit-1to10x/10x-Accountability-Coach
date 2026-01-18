import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SKILLS_DIR, PATHS } from '@/lib/paths'
import { scanSkillsDirectory } from '@/lib/skillParser'
import type { Skill } from '@/types/skill'

// Helper to get current challenge day
async function getCurrentChallengeDay(): Promise<number> {
  try {
    const challengesDir = PATHS.challenges
    const folders = await fs.readdir(challengesDir)

    for (const folder of folders) {
      const configPath = path.join(challengesDir, folder, 'challenge-config.json')
      try {
        const content = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(content)
        if (config.status === 'active' && config.startDate) {
          const startDate = new Date(config.startDate)
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - startDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return Math.max(1, diffDays)
        }
      } catch {
        // Config doesn't exist or isn't valid
      }
    }
  } catch {
    // No challenges directory
  }
  return 1 // Default to day 1 if no active challenge
}

// Group skills by pack
function groupSkillsByPack(skills: Skill[]): {
  packs: Record<string, { name: string; value?: string; skills: Skill[] }>
  ungrouped: Skill[]
} {
  const packs: Record<string, { name: string; value?: string; skills: Skill[] }> = {}
  const ungrouped: Skill[] = []

  for (const skill of skills) {
    if (skill.pack) {
      if (!packs[skill.pack]) {
        packs[skill.pack] = {
          name: skill.packDisplayName || skill.pack,
          value: skill.packValue,
          skills: [],
        }
      }
      packs[skill.pack].skills.push(skill)
    } else {
      ungrouped.push(skill)
    }
  }

  return { packs, ungrouped }
}

// GET - List all available skills (scans skills/ directory)
export async function GET() {
  try {
    const currentDay = await getCurrentChallengeDay()
    const skills = await scanSkillsDirectory(SKILLS_DIR, currentDay)
    const { packs, ungrouped } = groupSkillsByPack(skills)

    // Count locked and unlocked
    const lockedCount = skills.filter((s) => s.isLocked).length
    const unlockedCount = skills.filter((s) => !s.isLocked).length

    return NextResponse.json({
      skills,
      packs,
      ungrouped,
      skillsPath: SKILLS_DIR,
      count: skills.length,
      lockedCount,
      unlockedCount,
      currentDay,
    })
  } catch (error) {
    console.error('Failed to load skills:', error)
    return NextResponse.json(
      { error: 'Failed to load skills' },
      { status: 500 }
    )
  }
}

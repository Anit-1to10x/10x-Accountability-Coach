import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SHARED_PATHS, getProfilePaths } from '@/lib/paths'

async function getCurrentProfileId(): Promise<string | null> {
  try {
    // Read profiles.md to get the current/default profile
    const profilesMd = (await fs.readFile(SHARED_PATHS.profilesMd, 'utf-8')).replace(/\r\n/g, '\n')
    const currentMatch = profilesMd.match(/\*\*Current:\*\*\s*(\S+)/)
    if (currentMatch) return currentMatch[1]

    // Fallback: get first profile directory
    const profiles = await fs.readdir(SHARED_PATHS.profiles)
    const profileDirs = profiles.filter(p => !p.endsWith('.md') && !p.startsWith('.'))
    if (profileDirs.length > 0) return profileDirs[0]
  } catch {
    // profiles.md doesn't exist, try to find any profile
    try {
      const profiles = await fs.readdir(SHARED_PATHS.profiles)
      const profileDirs = profiles.filter(p => !p.endsWith('.md') && !p.startsWith('.'))
      if (profileDirs.length > 0) return profileDirs[0]
    } catch {
      // No profiles directory
    }
  }
  return null
}

export async function GET(request: Request) {
  try {
    // Accept profileId from query param or header, fallback to auto-detect
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || await getCurrentProfileId()
    if (!profileId) {
      return NextResponse.json({
        name: 'User',
        totalStreak: 0,
        activeChallenges: 0,
        completedToday: false,
      })
    }

    const paths = getProfilePaths(profileId)
    const profilePath = path.join(paths.profile, 'profile.md')
    const challengesDir = paths.challenges

    // Read profile
    let name = 'User'
    let bigGoal = ''
    let email = ''
    let timezone = ''
    try {
      const profileContent = (await fs.readFile(profilePath, 'utf-8')).replace(/\r\n/g, '\n')
      const nameMatch = profileContent.match(/\*\*Name:\*\*\s*(.+)/)
      const goalMatch = profileContent.match(/Big goal:\s*(.+)/i)
      const emailMatch = profileContent.match(/\*\*Email:\*\*\s*(.+)/i)
      const tzMatch = profileContent.match(/\*\*Timezone:\*\*\s*(.+)/i)
      if (nameMatch) name = nameMatch[1].trim()
      if (goalMatch) bigGoal = goalMatch[1].trim()
      if (emailMatch) email = emailMatch[1].trim()
      if (tzMatch) timezone = tzMatch[1].trim()
    } catch {
      // Profile doesn't exist
    }

    // Count active challenges
    let activeChallenges = 0
    let totalStreak = 0
    let completedToday = false

    try {
      const challenges = await fs.readdir(challengesDir)
      for (const challenge of challenges) {
        const metaPath = path.join(challengesDir, challenge, '.skill-meta.json')
        try {
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'))
          if (meta.status === 'active') {
            activeChallenges++
            totalStreak = Math.max(totalStreak, meta.streak || 0)
          }
        } catch {
          // Invalid challenge folder
        }
      }
    } catch {
      // Challenges directory doesn't exist
    }

    // Check if checked in today
    const today = new Date().toISOString().split('T')[0]
    const checkinPath = path.join(paths.checkins, `${today}.md`)
    try {
      await fs.access(checkinPath)
      completedToday = true
    } catch {
      // No check-in today
    }

    return NextResponse.json({
      id: profileId,
      name,
      email,
      timezone,
      bigGoal,
      totalStreak,
      activeChallenges,
      completedToday,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({
      name: 'User',
      totalStreak: 0,
      activeChallenges: 0,
      completedToday: false,
    })
  }
}

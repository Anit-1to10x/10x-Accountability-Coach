import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getProfilePaths, SHARED_PATHS } from '@/lib/paths'

export async function GET(request: NextRequest) {
  try {
    // Get active profile ID from query param or header
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    if (!profileId) {
      // Check if any profiles exist
      try {
        const profilesContent = await fs.readFile(SHARED_PATHS.profilesMd, 'utf-8')
        const hasProfiles = profilesContent.includes('###')

        return NextResponse.json({
          onboardingCompleted: hasProfiles,
          hasProfiles,
          needsProfileSelection: hasProfiles
        })
      } catch {
        return NextResponse.json({ onboardingCompleted: false, hasProfiles: false })
      }
    }

    // Get profile-specific path
    const profilePaths = getProfilePaths(profileId)
    const profileMdPath = path.join(profilePaths.profile, 'profile.md')

    // Check if profile.md exists and parse user data
    try {
      const profileContent = await fs.readFile(profileMdPath, 'utf-8')

      // Parse markdown to extract user data
      const nameMatch = profileContent.match(/\*\*Name:\*\*\s*(.+)/i)
      const emailMatch = profileContent.match(/\*\*Email:\*\*\s*(.+)/i)
      const userIdMatch = profileContent.match(/\*\*User ID:\*\*\s*(.+)/i)
      const timezoneMatch = profileContent.match(/\*\*Timezone:\*\*\s*(.+)/i)
      const createdMatch = profileContent.match(/\*\*Created:\*\*\s*(.+)/i)
      const onboardingMatch = profileContent.match(/\*\*Onboarding Completed:\*\*\s*(.+)/i)

      const name = nameMatch ? nameMatch[1].trim() : null
      const email = emailMatch ? emailMatch[1].trim() : null
      const userId = userIdMatch ? userIdMatch[1].trim() : null
      const timezone = timezoneMatch ? timezoneMatch[1].trim() : null
      const createdAt = createdMatch ? createdMatch[1].trim() : null
      const onboardingCompleted = onboardingMatch
        ? onboardingMatch[1].trim().toLowerCase() === 'true'
        : false

      return NextResponse.json({
        onboardingCompleted,
        hasProfiles: true,
        user: email ? {
          id: userId,
          name,
          email,
          timezone,
          createdAt
        } : null
      })
    } catch {
      return NextResponse.json({ onboardingCompleted: false, hasProfiles: true })
    }
  } catch (error) {
    console.error('Error checking user status:', error)
    return NextResponse.json({ onboardingCompleted: false, hasProfiles: false })
  }
}

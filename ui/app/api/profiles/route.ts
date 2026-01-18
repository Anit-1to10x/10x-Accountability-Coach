import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '..', 'data')
const PROFILES_DIR = path.join(DATA_DIR, 'profiles')
const PROFILES_MD = path.join(PROFILES_DIR, 'profiles.md')

interface Profile {
  id: string
  name: string
  email: string
  created: string
  lastActive: string
  owner: boolean
}

// Parse profiles.md to extract all profiles
async function parseProfilesMd(): Promise<Profile[]> {
  try {
    const content = await fs.readFile(PROFILES_MD, 'utf-8')
    const profiles: Profile[] = []

    // Split by profile sections (###)
    const sections = content.split('###').filter(s => s.trim())

    for (const section of sections) {
      const idMatch = section.match(/^(.+)/)
      const nameMatch = section.match(/\*\*Name:\*\*\s*(.+)/i)
      const emailMatch = section.match(/\*\*Email:\*\*\s*(.+)/i)
      const createdMatch = section.match(/\*\*Created:\*\*\s*(.+)/i)
      const lastActiveMatch = section.match(/\*\*Last Active:\*\*\s*(.+)/i)
      const ownerMatch = section.match(/\*\*Owner:\*\*\s*(.+)/i)

      if (idMatch && nameMatch && emailMatch) {
        profiles.push({
          id: idMatch[1].trim(),
          name: nameMatch[1].trim(),
          email: emailMatch[1].trim(),
          created: createdMatch ? createdMatch[1].trim() : '',
          lastActive: lastActiveMatch ? lastActiveMatch[1].trim() : '',
          owner: ownerMatch ? ownerMatch[1].trim().toLowerCase() === 'true' : false,
        })
      }
    }

    return profiles
  } catch {
    return []
  }
}

// Write profiles array back to profiles.md
async function writeProfilesMd(profiles: Profile[]): Promise<void> {
  const ownerProfile = profiles.find(p => p.owner)

  let content = `# Profiles Registry\n\n`

  if (ownerProfile) {
    content += `## Owner Profile\n- **ID:** ${ownerProfile.id}\n\n`
  }

  content += `## All Profiles\n\n`

  for (const profile of profiles) {
    content += `### ${profile.id}\n`
    content += `- **Name:** ${profile.name}\n`
    content += `- **Email:** ${profile.email}\n`
    content += `- **Created:** ${profile.created}\n`
    content += `- **Last Active:** ${profile.lastActive}\n`
    content += `- **Owner:** ${profile.owner}\n\n`
  }

  await fs.mkdir(PROFILES_DIR, { recursive: true })
  await fs.writeFile(PROFILES_MD, content)
}

// GET: List all profiles
export async function GET() {
  try {
    const profiles = await parseProfilesMd()
    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json({ profiles: [] })
  }
}

// POST: Create new profile (placeholder only, actual creation in onboarding)
export async function POST(request: NextRequest) {
  try {
    const { id, name, email } = await request.json()

    const profiles = await parseProfilesMd()

    // Check if profile already exists
    if (profiles.some(p => p.id === id)) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      )
    }

    // First profile becomes owner
    const isOwner = profiles.length === 0

    const newProfile: Profile = {
      id,
      name,
      email,
      created: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      owner: isOwner,
    }

    profiles.push(newProfile)
    await writeProfilesMd(profiles)

    return NextResponse.json({ success: true, profile: newProfile })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a profile (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const { id, requesterId } = await request.json()

    const profiles = await parseProfilesMd()

    // Check if requester is owner
    const requester = profiles.find(p => p.id === requesterId)
    if (!requester || !requester.owner) {
      return NextResponse.json(
        { error: 'Only the owner can delete profiles' },
        { status: 403 }
      )
    }

    // Cannot delete owner
    const profileToDelete = profiles.find(p => p.id === id)
    if (profileToDelete?.owner) {
      return NextResponse.json(
        { error: 'Cannot delete owner profile' },
        { status: 400 }
      )
    }

    // Remove profile from registry
    const updatedProfiles = profiles.filter(p => p.id !== id)
    await writeProfilesMd(updatedProfiles)

    // Delete profile folder
    const profileDir = path.join(PROFILES_DIR, id)
    try {
      await fs.rm(profileDir, { recursive: true, force: true })
    } catch {
      // Folder might not exist, ignore
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}

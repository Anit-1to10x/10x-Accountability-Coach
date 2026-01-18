import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, getProfilePaths } from '@/lib/paths'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    // Use profile-specific path if profileId provided, otherwise fall back to legacy
    const scheduleDir = profileId
      ? getProfilePaths(profileId).schedule
      : path.join(DATA_DIR, 'schedule')
    const calendarFile = path.join(scheduleDir, 'calendar.json')

    try {
      const data = await fs.readFile(calendarFile, 'utf-8')
      const calendar = JSON.parse(data)

      // Find today's task/event
      const todayEvents = calendar.events?.filter((e: any) => e.date === date) || []
      const nextTask = todayEvents.find((e: any) => e.status === 'scheduled')

      return NextResponse.json({ task: nextTask, allEvents: todayEvents })
    } catch {
      return NextResponse.json({ task: null, allEvents: [] })
    }
  } catch (error) {
    console.error('Failed to load today schedule:', error)
    return NextResponse.json({ task: null, allEvents: [] }, { status: 500 })
  }
}

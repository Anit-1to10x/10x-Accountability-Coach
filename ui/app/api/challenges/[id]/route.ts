import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS, getProfilePaths } from '@/lib/paths'

// Parse challenge.md file to extract metadata
function parseChallengeMd(rawContent: string, id: string) {
  const content = rawContent.replace(/\r\n/g, '\n')
  const lines = content.split('\n')
  const data: Record<string, any> = { id }

  // Extract name from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) data.name = titleMatch[1].trim()

  // Extract key-value pairs like "- **Key:** Value"
  for (const line of lines) {
    const match = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/i)
    if (match) {
      const key = match[1].toLowerCase().replace(/\s+/g, '_')
      let value = match[2].trim()

      if (value.match(/^\d+$/)) value = parseInt(value) as any
      if (value === 'None' || value === 'none') value = null as any

      data[key] = value
    }
  }

  // Extract goal from ## Goal section
  const goalMatch = content.match(/##\s*Goal\n+([^\n#]+)/i)
  if (goalMatch) data.goal = goalMatch[1].trim()

  return data
}

// GET - Get a single challenge by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const challengeDir = path.join(PATHS.challenges, challengeId)

    // Check if challenge exists
    try {
      await fs.access(challengeDir)
    } catch {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Try MD format first
    const mdPath = path.join(challengeDir, 'challenge.md')
    const jsonPath = path.join(challengeDir, 'challenge-config.json')

    let config: any = null

    try {
      const mdContent = await fs.readFile(mdPath, 'utf-8')
      config = parseChallengeMd(mdContent, challengeId)
    } catch {
      try {
        const jsonContent = await fs.readFile(jsonPath, 'utf-8')
        config = JSON.parse(jsonContent)
      } catch {
        return NextResponse.json(
          { error: 'Challenge configuration not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({ challenge: config })
  } catch (error: any) {
    console.error('Error fetching challenge:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a challenge and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    const challengeDir = path.join(PATHS.challenges, challengeId)

    // Check if challenge exists
    try {
      await fs.access(challengeDir)
    } catch {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // 1. Delete the challenge directory recursively
    await fs.rm(challengeDir, { recursive: true, force: true })

    // 2. Update the registry - remove challenge entry
    const registryPath = path.join(DATA_DIR, '.registry', 'challenges.md')
    try {
      let registryContent = await fs.readFile(registryPath, 'utf-8')
      // Remove the challenge entry from registry (section starting with ### {name} ({id}))
      const regex = new RegExp(`### [^\\n]+\\(${challengeId}\\)[\\s\\S]*?(?=###|$)`, 'g')
      registryContent = registryContent.replace(regex, '')
      await fs.writeFile(registryPath, registryContent.trim() + '\n\n', 'utf-8')
    } catch (error) {
      console.log('Registry update skipped:', error)
    }

    // 3. Clean up profile-specific todos related to this challenge
    if (profileId) {
      const profilePaths = getProfilePaths(profileId)

      // Clean todos
      try {
        const todosFile = path.join(profilePaths.todos, 'active.md')
        let todosContent = await fs.readFile(todosFile, 'utf-8')

        // Remove todo items that reference this challenge
        const lines = todosContent.split('\n')
        const filteredLines = lines.filter(line => {
          // Keep lines that don't reference the deleted challenge
          return !line.toLowerCase().includes(challengeId.toLowerCase())
        })

        await fs.writeFile(todosFile, filteredLines.join('\n'), 'utf-8')
      } catch (error) {
        console.log('Todos cleanup skipped:', error)
      }

      // Clean schedule/calendar
      try {
        const calendarFile = path.join(profilePaths.schedule, 'calendar.json')
        const calendarContent = await fs.readFile(calendarFile, 'utf-8')
        const calendar = JSON.parse(calendarContent)

        // Filter out events related to this challenge
        if (calendar.events) {
          calendar.events = calendar.events.filter((event: any) =>
            event.challenge !== challengeId && event.challengeId !== challengeId
          )
        }

        await fs.writeFile(calendarFile, JSON.stringify(calendar, null, 2), 'utf-8')
      } catch (error) {
        console.log('Calendar cleanup skipped:', error)
      }

      // Clean checkins related to this challenge
      try {
        const checkinsDir = profilePaths.checkins
        const checkinFiles = await fs.readdir(checkinsDir)

        for (const file of checkinFiles) {
          if (file.includes(challengeId)) {
            await fs.rm(path.join(checkinsDir, file), { force: true })
          }
        }
      } catch (error) {
        console.log('Checkins cleanup skipped:', error)
      }
    }

    // 4. Also clean global schedule if it exists
    try {
      const globalCalendarFile = path.join(DATA_DIR, 'schedule', 'calendar.json')
      const calendarContent = await fs.readFile(globalCalendarFile, 'utf-8')
      const calendar = JSON.parse(calendarContent)

      if (calendar.events) {
        calendar.events = calendar.events.filter((event: any) =>
          event.challenge !== challengeId && event.challengeId !== challengeId
        )
      }

      await fs.writeFile(globalCalendarFile, JSON.stringify(calendar, null, 2), 'utf-8')
    } catch (error) {
      console.log('Global calendar cleanup skipped:', error)
    }

    // 5. Clean from-challenges todos
    try {
      const fromChallengesFile = path.join(DATA_DIR, 'todos', 'from-challenges.json')
      const content = await fs.readFile(fromChallengesFile, 'utf-8')
      const todos = JSON.parse(content)

      const filteredTodos = todos.filter((todo: any) =>
        todo.challengeId !== challengeId
      )

      await fs.writeFile(fromChallengesFile, JSON.stringify(filteredTodos, null, 2), 'utf-8')
    } catch (error) {
      console.log('From-challenges cleanup skipped:', error)
    }

    return NextResponse.json({
      success: true,
      message: `Challenge "${challengeId}" and all related data have been deleted`,
      deletedItems: {
        challenge: challengeId,
        cascadeDeleted: ['todos', 'calendar events', 'checkins']
      }
    })
  } catch (error: any) {
    console.error('Error deleting challenge:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

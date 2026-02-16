import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, getProfilePaths } from '@/lib/paths'

// Parse todos from active.md
function parseTodosMd(content: string) {
  const todos: any[] = []
  const today = new Date().toISOString().split('T')[0]

  // Split by newlines and trim \r from each line (Windows line endings)
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''))

  let currentDate: string | null = today
  let currentChallenge = ''
  let isThisWeek = false

  for (const line of lines) {
    // Check for date sections: ## Today (2026-01-01)
    const dateSectionMatch = line.match(/^##\s+Today\s*\((\d{4}-\d{2}-\d{2})\)/i)
    if (dateSectionMatch) {
      currentDate = dateSectionMatch[1]
      isThisWeek = false
      continue
    }

    // Check for "This Week" section - tasks here are NOT for today
    if (line.match(/^##\s+This Week/i)) {
      isThisWeek = true
      currentDate = null
      continue
    }

    // Track current challenge/section header (### Challenge Name)
    const sectionMatch = line.match(/^###\s+(.+)/)
    if (sectionMatch) {
      currentChallenge = sectionMatch[1].trim()
      continue
    }

    // Match todo items: - [x] or - [ ] followed by text (plain or **bold**)
    const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(?:\*\*)?(.+?)(?:\*\*)?$/)
    if (todoMatch) {
      const completed = todoMatch[1].toLowerCase() === 'x'
      const title = todoMatch[2].trim()

      todos.push({
        id: `todo-${todos.length + 1}`,
        title,
        text: title,
        status: completed ? 'completed' : 'pending',
        completed,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        challengeId: null,
        challengeName: currentChallenge || null,
        dueDate: currentDate,
        date: currentDate,
        isThisWeek: isThisWeek,
      })
    }
  }

  return todos
}

export async function GET(request: NextRequest) {
  try {
    // Get active profile ID from header or query param
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    // Use profile-specific path if profileId provided, otherwise fall back to legacy
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos

    // Try MD file first
    const mdFile = path.join(todosDir, 'active.md')
    try {
      const data = await fs.readFile(mdFile, 'utf-8')
      const todos = parseTodosMd(data)
      if (todos.length > 0) {
        return NextResponse.json(todos)
      }
    } catch {}

    // Fall back to JSON
    const jsonFile = path.join(todosDir, 'active.json')
    try {
      const data = await fs.readFile(jsonFile, 'utf-8')
      return NextResponse.json(JSON.parse(data))
    } catch {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Failed to load todos:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const todo = await request.json()

    // Get active profile ID from header or query param
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')

    // Use profile-specific path if profileId provided, otherwise fall back to legacy
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos
    const activeFile = path.join(todosDir, 'active.md')

    await fs.mkdir(todosDir, { recursive: true })

    // Read existing MD file
    let mdContent = ''
    let existingTodos = 0
    try {
      mdContent = await fs.readFile(activeFile, 'utf-8')
      // Count existing todos
      existingTodos = (mdContent.match(/^-\s*\[[ xX]\]/gm) || []).length
    } catch {
      // File doesn't exist, create default structure
      mdContent = `# Tasks\n\n## Today (${new Date().toISOString().split('T')[0]})\n\n### General Tasks\n`
    }

    const newTodo = {
      id: `todo-${existingTodos + 1}`,
      createdAt: new Date().toISOString(),
      ...todo,
    }

    // Append new todo to MD file
    // Find the first section header or create one
    const lines = mdContent.split('\n')
    let insertIndex = lines.findIndex(line => line.startsWith('### '))
    if (insertIndex === -1) {
      // No section found, add to end
      insertIndex = lines.length
      lines.push('### General Tasks')
    } else {
      // Insert after the section header
      insertIndex++
    }

    const todoLine = `- [ ] ${newTodo.title || newTodo.text || 'New task'}`
    lines.splice(insertIndex, 0, todoLine)

    await fs.writeFile(activeFile, lines.join('\n'))

    // Log to index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'file_modified',
          data: {
            filePath: 'todos/active.md',
            original: `${existingTodos} todos`,
            changes: `Added todo: ${newTodo.title || newTodo.text}`,
            date: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json(newTodo)
  } catch (error) {
    console.error('Failed to create todo:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}

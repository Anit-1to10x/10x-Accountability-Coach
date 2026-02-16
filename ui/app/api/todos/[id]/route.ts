import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, getProfilePaths } from '@/lib/paths'

interface Todo {
  id: string
  title: string
  completed: boolean
  status: 'pending' | 'completed'
  challengeId?: string
  challengeName?: string
  date?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
}

// Parse todos from MD file
function parseTodosMd(content: string): Todo[] {
  const todos: Todo[] = []
  const today = new Date().toISOString().split('T')[0]
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''))

  let currentDate: string | null = today
  let currentChallenge = ''

  for (const line of lines) {
    // Check for date sections
    const dateSectionMatch = line.match(/^##\s+Today\s*\((\d{4}-\d{2}-\d{2})\)/i)
    if (dateSectionMatch) {
      currentDate = dateSectionMatch[1]
      continue
    }

    // Track section headers
    const sectionMatch = line.match(/^###\s+(.+)/)
    if (sectionMatch) {
      currentChallenge = sectionMatch[1].trim()
      continue
    }

    // Match todo items
    const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(?:\*\*)?(.+?)(?:\*\*)?$/)
    if (todoMatch) {
      const completed = todoMatch[1].toLowerCase() === 'x'
      const title = todoMatch[2].trim()

      todos.push({
        id: `todo-${todos.length + 1}`,
        title,
        status: completed ? 'completed' : 'pending',
        completed,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        challengeName: currentChallenge || null,
        dueDate: currentDate,
        date: currentDate,
      } as Todo)
    }
  }

  return todos
}

// GET: Read specific todo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get profile ID from query or header
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos

    // Try MD file first
    const mdFile = path.join(todosDir, 'active.md')
    try {
      const mdContent = await fs.readFile(mdFile, 'utf-8')
      const todos = parseTodosMd(mdContent)
      const todo = todos.find((t) => t.id === params.id)

      if (todo) {
        return NextResponse.json({ todo })
      }
    } catch {
      // MD file doesn't exist, try JSON
    }

    // Fall back to JSON
    const jsonFile = path.join(todosDir, 'active.json')
    try {
      const content = await fs.readFile(jsonFile, 'utf-8')
      const todos: Todo[] = JSON.parse(content)
      const todo = todos.find((t) => t.id === params.id)

      if (todo) {
        return NextResponse.json({ todo })
      }
    } catch {
      // JSON file doesn't exist either
    }

    return NextResponse.json(
      { error: 'Todo not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Failed to load todo:', error)
    return NextResponse.json(
      { error: 'Failed to load todo' },
      { status: 500 }
    )
  }
}

// PATCH: Update todo (toggle completion, update fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { completed, title, date, priority } = body

    // Get profile ID from query or header
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos

    // Read existing todos from MD file (MD is the only source of truth)
    const mdFile = path.join(todosDir, 'active.md')
    let usingMdFile = false
    let updatedTodo: Partial<Todo> = { id: params.id }

    try {
      const mdContent = await fs.readFile(mdFile, 'utf-8')
      const lines = mdContent.split('\n')

      // Parse and update MD file
      let todoCounter = 0
      const updatedLines: string[] = []

      for (const line of lines) {
        // Track section headers
        const sectionMatch = line.match(/^###\s+(.+)/)
        if (sectionMatch) {
          updatedLines.push(line)
          continue
        }

        // Match todo items
        const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(.+)$/)
        if (todoMatch) {
          todoCounter++
          const todoId = `todo-${todoCounter}`

          // If this is the todo to update
          if (todoId === params.id) {
            if (completed !== undefined) {
              // Update the checkbox
              const checkbox = completed ? '[x]' : '[ ]'
              const taskText = title || todoMatch[2]
              updatedLines.push(`- ${checkbox} ${taskText}`)
              usingMdFile = true
              updatedTodo = {
                ...updatedTodo,
                completed,
                status: completed ? 'completed' : 'pending',
                title: taskText
              }
            } else {
              updatedLines.push(line)
            }
          } else {
            updatedLines.push(line)
          }
        } else {
          updatedLines.push(line)
        }
      }

      if (usingMdFile) {
        // Ensure directory exists
        await fs.mkdir(todosDir, { recursive: true })
        // Write updated MD file
        await fs.writeFile(mdFile, updatedLines.join('\n'))
      }
    } catch (mdError) {
      // MD file doesn't exist or failed to parse
      usingMdFile = false
    }

    // If MD file wasn't used, try creating it with the todo
    if (!usingMdFile) {
      // Create a new MD file with default structure
      try {
        await fs.mkdir(todosDir, { recursive: true })
        const today = new Date().toISOString().split('T')[0]
        const defaultContent = `# Tasks\n\n## Today (${today})\n\n### General Tasks\n- [ ] New task\n`
        await fs.writeFile(mdFile, defaultContent)

        return NextResponse.json(
          { error: 'Todo not found. Created new todo file.' },
          { status: 404 }
        )
      } catch {
        return NextResponse.json(
          { error: 'Todo not found' },
          { status: 404 }
        )
      }
    }

    // Update index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'todo_updated',
          data: {
            todoId: params.id,
            completed: completed,
            date: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      todo: { ...updatedTodo, date, priority },
    })
  } catch (error: any) {
    console.error('Failed to update todo:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Remove todo from MD file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get profile ID from query or header
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || request.headers.get('X-Profile-Id')
    const todosDir = profileId ? getProfilePaths(profileId).todos : PATHS.todos

    const mdFile = path.join(todosDir, 'active.md')
    let deletedTodo: Todo | null = null

    try {
      const mdContent = await fs.readFile(mdFile, 'utf-8')
      const lines = mdContent.split('\n')

      let todoCounter = 0
      const updatedLines: string[] = []

      for (const line of lines) {
        // Match todo items
        const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(.+)$/)
        if (todoMatch) {
          todoCounter++
          const todoId = `todo-${todoCounter}`

          // Skip this todo (delete it)
          if (todoId === params.id) {
            deletedTodo = {
              id: todoId,
              title: todoMatch[2].trim(),
              completed: todoMatch[1].toLowerCase() === 'x',
              status: todoMatch[1].toLowerCase() === 'x' ? 'completed' : 'pending',
              createdAt: new Date().toISOString(),
            }
            continue // Skip this line (delete the todo)
          }
        }
        updatedLines.push(line)
      }

      if (!deletedTodo) {
        return NextResponse.json(
          { error: 'Todo not found' },
          { status: 404 }
        )
      }

      // Write updated MD file
      await fs.writeFile(mdFile, updatedLines.join('\n'))

    } catch {
      return NextResponse.json(
        { error: 'Todo file not found' },
        { status: 404 }
      )
    }

    // Update index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'todo_deleted',
          data: {
            todoId: params.id,
            title: deletedTodo?.title,
            date: new Date().toISOString(),
          },
        }),
      })
    } catch (error) {
      console.error('Failed to update index.md:', error)
    }

    return NextResponse.json({
      success: true,
      deletedTodo,
    })
  } catch (error: any) {
    console.error('Failed to delete todo:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

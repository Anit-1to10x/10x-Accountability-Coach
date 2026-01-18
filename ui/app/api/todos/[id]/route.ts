import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, getProfilePaths } from '@/lib/paths'

const TODOS_FILE = path.join(PATHS.todos, 'active.json')

interface Todo {
  id: string
  title: string
  completed: boolean
  challengeId?: string
  date?: string
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
}

// GET: Read specific todo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = await fs.readFile(TODOS_FILE, 'utf-8')
    const todos: Todo[] = JSON.parse(content)
    const todo = todos.find((t) => t.id === params.id)

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ todo })
  } catch (error) {
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
              const currentlyCompleted = todoMatch[1].toLowerCase() === 'x'

              // IMMUTABILITY PROTECTION: Prevent unchecking completed todos
              if (currentlyCompleted && !completed) {
                return NextResponse.json(
                  {
                    error: 'Cannot uncheck completed todo. Once checked in, it stays checked.',
                    immutable: true
                  },
                  { status: 403 }
                )
              }

              // Update the checkbox
              const checkbox = completed ? '[x]' : '[ ]'
              const taskText = todoMatch[2]
              updatedLines.push(`- ${checkbox} ${taskText}`)
              usingMdFile = true
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
        // Write updated MD file
        await fs.writeFile(mdFile, updatedLines.join('\n'))
      }
    } catch (mdError) {
      // MD file doesn't exist or failed to parse, fall back to JSON
      usingMdFile = false
    }

    // MD file is the only source of truth
    if (!usingMdFile) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
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
      todo: { id: params.id, completed, title, date, priority },
    })
  } catch (error: any) {
    console.error('Failed to update todo:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Remove todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Read existing todos
    let todos: Todo[] = []
    try {
      const content = await fs.readFile(TODOS_FILE, 'utf-8')
      todos = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'Todos file not found' },
        { status: 404 }
      )
    }

    // Find todo
    const todoIndex = todos.findIndex((t) => t.id === params.id)
    if (todoIndex === -1) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    // Remove todo
    const deletedTodo = todos.splice(todoIndex, 1)[0]

    // Save updated todos
    await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2))

    // Update index.md
    try {
      await fetch(`${request.nextUrl.origin}/api/system/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'todo_deleted',
          data: {
            todoId: params.id,
            title: deletedTodo.title,
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

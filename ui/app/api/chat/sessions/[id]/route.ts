import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS, DATA_DIR } from '@/lib/paths'

interface ChatSession {
  id: string
  title: string
  date: string
  agentId: string
  preview?: string
  messageCount?: number
  lastUpdated: string
}

const SESSIONS_FILE = path.join(DATA_DIR, 'chat-sessions.json')

async function loadSessions(): Promise<ChatSession[]> {
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveSessions(sessions: ChatSession[]): Promise<void> {
  await fs.mkdir(path.dirname(SESSIONS_FILE), { recursive: true })
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
}

// GET - Get a specific chat session with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const sessions = await loadSessions()
    const session = sessions.find(s => s.id === sessionId)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Load messages from the chat file
    const chatFile = path.join(PATHS.chats, session.date, `${sessionId}.md`)
    let messages: any[] = []

    try {
      const content = await fs.readFile(chatFile, 'utf-8')

      // Parse markdown to messages
      const lines = content.split('\n')
      let currentMessage: any = null
      let skipHeader = true

      for (const line of lines) {
        // Skip header until we hit the first message
        if (line.startsWith('---')) {
          skipHeader = false
          continue
        }
        if (skipHeader) continue

        if (line.startsWith('## ')) {
          if (currentMessage) {
            messages.push(currentMessage)
          }
          currentMessage = null
        } else if (line.startsWith('**User:**')) {
          currentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'user',
            content: line.replace('**User:**', '').trim(),
            timestamp: new Date().toISOString(),
            agentId: session.agentId,
          }
        } else if (line.startsWith('**Agent:**') || line.startsWith('**Coach:**') || line.startsWith('**Assistant:**')) {
          if (currentMessage) {
            messages.push(currentMessage)
          }
          currentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: line.replace(/\*\*(Agent|Coach|Assistant):\*\*/, '').trim(),
            timestamp: new Date().toISOString(),
            agentId: session.agentId,
          }
        } else if (currentMessage && line.trim()) {
          currentMessage.content += '\n' + line
        }
      }

      if (currentMessage) {
        messages.push(currentMessage)
      }
    } catch {
      // File doesn't exist yet
    }

    return NextResponse.json({ session, messages })
  } catch (error) {
    console.error('Failed to load chat session:', error)
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
  }
}

// PATCH - Update chat session (rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const sessions = await loadSessions()
    const sessionIndex = sessions.findIndex(s => s.id === sessionId)

    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    sessions[sessionIndex].title = title
    sessions[sessionIndex].lastUpdated = new Date().toISOString()

    await saveSessions(sessions)

    // Also update the chat file header
    const session = sessions[sessionIndex]
    const chatFile = path.join(PATHS.chats, session.date, `${sessionId}.md`)

    try {
      let content = await fs.readFile(chatFile, 'utf-8')
      // Update the title in the file
      content = content.replace(/^# .+$/m, `# ${title}`)
      await fs.writeFile(chatFile, content)
    } catch {
      // File doesn't exist, that's okay
    }

    return NextResponse.json({ success: true, session: sessions[sessionIndex] })
  } catch (error) {
    console.error('Failed to update chat session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

// DELETE - Delete a chat session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const sessions = await loadSessions()
    const sessionIndex = sessions.findIndex(s => s.id === sessionId)

    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const session = sessions[sessionIndex]

    // Remove from sessions list
    sessions.splice(sessionIndex, 1)
    await saveSessions(sessions)

    // Delete the chat file
    const chatFile = path.join(PATHS.chats, session.date, `${sessionId}.md`)
    try {
      await fs.unlink(chatFile)
    } catch {
      // File doesn't exist, that's okay
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat session:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}

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

// File to store chat session metadata
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

// Generate title from first message
function generateTitle(content: string): string {
  // Take first 50 characters of first line
  const firstLine = content.split('\n')[0].trim()
  if (firstLine.length <= 50) return firstLine
  return firstLine.substring(0, 47) + '...'
}

// GET - List all chat sessions for an agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    let sessions = await loadSessions()

    // Filter by agentId if provided
    if (agentId) {
      sessions = sessions.filter(s => s.agentId === agentId)
    }

    // Sort by lastUpdated descending
    sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Failed to load chat sessions:', error)
    return NextResponse.json({ sessions: [] }, { status: 500 })
  }
}

// POST - Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, title, firstMessage } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const sessions = await loadSessions()
    const now = new Date()
    const date = now.toISOString().split('T')[0]

    const newSession: ChatSession = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: title || (firstMessage ? generateTitle(firstMessage) : 'New Chat'),
      date,
      agentId,
      preview: firstMessage ? firstMessage.substring(0, 100) : undefined,
      messageCount: firstMessage ? 1 : 0,
      lastUpdated: now.toISOString()
    }

    sessions.unshift(newSession)
    await saveSessions(sessions)

    // Create the chat file
    const chatDir = path.join(PATHS.chats, date)
    await fs.mkdir(chatDir, { recursive: true })

    const chatFile = path.join(chatDir, `${newSession.id}.md`)
    let chatContent = `# ${newSession.title}\n\n`
    chatContent += `**Session ID:** ${newSession.id}\n`
    chatContent += `**Agent:** ${agentId}\n`
    chatContent += `**Created:** ${now.toISOString()}\n\n---\n\n`

    if (firstMessage) {
      const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      chatContent += `## ${timestamp}\n**User:** ${firstMessage}\n\n`
    }

    await fs.writeFile(chatFile, chatContent)

    return NextResponse.json({ success: true, session: newSession })
  } catch (error) {
    console.error('Failed to create chat session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

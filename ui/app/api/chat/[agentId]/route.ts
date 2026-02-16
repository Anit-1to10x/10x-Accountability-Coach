import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const agentId = params.agentId

    const chatFile = path.join(PATHS.chats, date, `${agentId}.md`)

    try {
      const content = await fs.readFile(chatFile, 'utf-8')

      // Parse markdown to messages - handles multi-line content properly
      const messages: Array<{
        id: string
        role: string
        content: string
        timestamp: string
        agentId: string
      }> = []
      let currentMessage: typeof messages[0] | null = null
      let messageIndex = 0

      const lines = content.split('\n')

      for (const line of lines) {
        // Skip metadata headers
        if (line.startsWith('# ') || line.startsWith('**Session') || line.startsWith('**Agent:') && line.includes('**Created:')) {
          continue
        }

        if (line.startsWith('---')) {
          continue
        }

        // Timestamp section header
        if (line.startsWith('## ')) {
          if (currentMessage) {
            currentMessage.content = currentMessage.content.trim()
            messages.push(currentMessage)
            currentMessage = null
          }
          continue
        }

        if (line.startsWith('**User:**')) {
          if (currentMessage) {
            currentMessage.content = currentMessage.content.trim()
            messages.push(currentMessage)
          }
          messageIndex++
          currentMessage = {
            id: `hist-${date}-${messageIndex}`,
            role: 'user',
            content: line.replace('**User:**', '').trim(),
            timestamp: new Date().toISOString(),
            agentId,
          }
        } else if (line.startsWith('**Agent:**') || line.startsWith('**Coach:**') || line.startsWith('**Assistant:**')) {
          if (currentMessage) {
            currentMessage.content = currentMessage.content.trim()
            messages.push(currentMessage)
          }
          messageIndex++
          currentMessage = {
            id: `hist-${date}-${messageIndex}`,
            role: 'assistant',
            content: line.replace(/\*\*(Agent|Coach|Assistant):\*\*/, '').trim(),
            timestamp: new Date().toISOString(),
            agentId,
          }
        } else if (currentMessage) {
          // Append multi-line content (preserve empty lines within messages)
          currentMessage.content += '\n' + line
        }
      }

      if (currentMessage) {
        currentMessage.content = currentMessage.content.trim()
        messages.push(currentMessage)
      }

      return NextResponse.json({ messages })
    } catch {
      return NextResponse.json({ messages: [] })
    }
  } catch (error) {
    console.error('Failed to load chat history:', error)
    return NextResponse.json({ messages: [] }, { status: 500 })
  }
}

/**
 * POST - Append user and assistant messages to the daily chat file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { date, userMessage, assistantMessage } = await request.json()
    const agentId = params.agentId
    const chatDate = date || new Date().toISOString().split('T')[0]

    const chatDir = path.join(PATHS.chats, chatDate)
    await fs.mkdir(chatDir, { recursive: true })

    const chatFile = path.join(chatDir, `${agentId}.md`)
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    // Check if file exists, create header if not
    let fileExists = false
    try {
      await fs.access(chatFile)
      fileExists = true
    } catch {
      // File doesn't exist
    }

    let content = ''
    if (!fileExists) {
      content += `# Chat with ${agentId}\n\n`
      content += `**Date:** ${chatDate}\n\n---\n\n`
    }

    content += `## ${timestamp}\n`
    if (userMessage) {
      content += `**User:** ${userMessage}\n\n`
    }
    if (assistantMessage) {
      content += `**Assistant:** ${assistantMessage}\n\n`
    }

    await fs.appendFile(chatFile, content)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save chat message:', error)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }
}

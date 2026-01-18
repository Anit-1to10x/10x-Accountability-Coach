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

      // Parse markdown to messages
      const messages = []
      const lines = content.split('\n')
      let currentMessage = null

      for (const line of lines) {
        if (line.startsWith('## ')) {
          if (currentMessage) {
            messages.push(currentMessage)
          }
          currentMessage = null
        } else if (line.startsWith('**User:**')) {
          currentMessage = {
            id: Date.now().toString() + Math.random(),
            role: 'user',
            content: line.replace('**User:**', '').trim(),
            timestamp: new Date().toISOString(),
            agentId,
          }
        } else if (line.startsWith('**Agent:**') || line.startsWith('**Coach:**')) {
          if (currentMessage) {
            messages.push(currentMessage)
          }
          currentMessage = {
            id: Date.now().toString() + Math.random(),
            role: 'agent',
            content: line.replace(/\*\*(Agent|Coach):\*\*/, '').trim(),
            timestamp: new Date().toISOString(),
            agentId,
          }
        } else if (currentMessage && line.trim()) {
          currentMessage.content += '\n' + line
        }
      }

      if (currentMessage) {
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

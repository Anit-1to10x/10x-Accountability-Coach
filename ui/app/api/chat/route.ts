import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS } from '@/lib/paths'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const agentId = formData.get('agentId') as string
    const content = formData.get('content') as string
    const files = formData.getAll('files') as File[]

    if (!agentId || !content) {
      return NextResponse.json({ error: 'Missing agentId or content' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const chatDir = path.join(PATHS.chats, today)
    const chatFile = path.join(chatDir, `${agentId}.md`)

    // Create chat directory if it doesn't exist
    await fs.mkdir(chatDir, { recursive: true })

    // Handle file uploads
    const attachments = []
    if (files.length > 0) {
      const uploadsDir = path.join(DATA_DIR, 'assets', 'uploads')
      await fs.mkdir(uploadsDir, { recursive: true })

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileName = `${Date.now()}-${file.name}`
        const filePath = path.join(uploadsDir, fileName)
        await fs.writeFile(filePath, buffer)
        attachments.push({
          type: file.type.startsWith('image/') ? 'image' : 'file',
          path: `assets/uploads/${fileName}`,
          name: file.name,
        })
      }
    }

    // Append message to chat file
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    let chatContent = ''

    try {
      chatContent = await fs.readFile(chatFile, 'utf-8')
    } catch {
      // File doesn't exist, create header
      chatContent = `# Chat with ${agentId} - ${today}\n\n`
    }

    chatContent += `## ${timestamp}\n**User:** ${content}\n\n`

    if (attachments.length > 0) {
      for (const att of attachments) {
        chatContent += `[Uploaded: ${att.name}]\n\n`
      }
    }

    await fs.writeFile(chatFile, chatContent)

    // Update chat index
    const indexFile = path.join(PATHS.chats, 'index.json')
    let index: { dates: string[]; agentIds: Record<string, string[]> } = { dates: [], agentIds: {} }
    try {
      const indexData = await fs.readFile(indexFile, 'utf-8')
      index = JSON.parse(indexData)
    } catch {
      // Index doesn't exist
    }

    if (!index.dates.includes(today)) {
      index.dates.push(today)
      index.dates.sort().reverse()
    }
    if (!index.agentIds[today]) {
      index.agentIds[today] = []
    }
    if (!index.agentIds[today].includes(agentId)) {
      index.agentIds[today].push(agentId)
    }

    await fs.writeFile(indexFile, JSON.stringify(index, null, 2))

    return NextResponse.json({ success: true, attachments })
  } catch (error) {
    console.error('Failed to save chat message:', error)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }
}

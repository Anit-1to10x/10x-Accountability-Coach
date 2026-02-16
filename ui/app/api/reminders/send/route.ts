import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create mailto URL
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    // Open default email client (cross-platform)
    const command = process.platform === 'darwin'
      ? `open "${mailtoUrl}"`
      : process.platform === 'win32'
      ? `start "" "${mailtoUrl}"`
      : `xdg-open "${mailtoUrl}"`

    try {
      await execAsync(command)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Failed to open email client:', error)
      return NextResponse.json({ error: 'Failed to open email client' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to send reminder:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}

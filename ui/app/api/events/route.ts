import { NextRequest } from 'next/server'
import { getFileWatcher } from '@/lib/fileWatcher'

export const dynamic = 'force-dynamic'

// Server-Sent Events endpoint for real-time updates
export async function GET(request: NextRequest) {
  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  // Start file watcher if not already started
  const watcher = getFileWatcher()
  watcher.start()

  // Send initial connection message
  writer.write(
    encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
  )

  // Listen for file changes
  const unsubscribe = watcher.onChange((event) => {
    writer.write(
      encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
    )
  })

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    writer.write(encoder.encode(`: heartbeat\n\n`))
  }, 30000)

  // Clean up on connection close
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeat)
    unsubscribe()
    writer.close()
  })

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

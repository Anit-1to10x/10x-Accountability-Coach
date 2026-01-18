'use client'

import React, { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ChatPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const message = searchParams?.get('message')
  const agent = searchParams?.get('agent') || 'accountability-coach'

  useEffect(() => {
    // Redirect to agent page with message
    const redirectUrl = message
      ? `/agent/${agent}?message=${encodeURIComponent(message)}`
      : `/agent/${agent}`
    router.replace(redirectUrl)
  }, [message, agent, router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-oa-text-secondary">Redirecting to chat...</div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}

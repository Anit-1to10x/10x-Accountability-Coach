'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatWithSidebar } from '@/components/chat'
import { useAgentStore } from '@/lib/store'

function ChatPageContent() {
  const searchParams = useSearchParams()
  const { agents, loadAgents } = useAgentStore()
  const [isLoading, setIsLoading] = useState(true)

  const agentId = searchParams?.get('agent') || 'accountability-coach'

  useEffect(() => {
    const init = async () => {
      await loadAgents()
      setIsLoading(false)
    }
    init()
  }, [loadAgents])

  const agent = Array.isArray(agents) ? agents.find((a) => a.id === agentId) : undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-oa-accent border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <ChatWithSidebar
        agent={agent}
        showSidebar={true}
      />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-oa-accent border-t-transparent"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}

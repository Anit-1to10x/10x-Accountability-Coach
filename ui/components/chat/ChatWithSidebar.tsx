'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChatSidebar } from './ChatSidebar'
import { UnifiedChat } from './UnifiedChat'
import { useChatStore } from '@/lib/store'
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'
import type { Agent } from '@/types'

interface ChatWithSidebarProps {
  agent?: Agent
  onCheckinClick?: () => void
  onCreateSkillClick?: () => void
  showSidebar?: boolean
}

export function ChatWithSidebar({
  agent,
  onCheckinClick,
  onCreateSkillClick,
  showSidebar = true
}: ChatWithSidebarProps) {
  const profileId = useProfileId()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { clearMessages, loadSessionMessages } = useChatStore()

  const agentId = agent?.id || 'unified'

  // Load messages for the current chat session
  const loadChatSession = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${chatId}`)
      const data = await res.json()

      if (data.messages && data.messages.length > 0) {
        // Load the messages into the store
        loadSessionMessages(agentId, data.messages)
      }
    } catch (error) {
      console.error('Failed to load chat session:', error)
    }
  }, [agentId, loadSessionMessages])

  const handleSelectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId)
    loadChatSession(chatId)
  }, [loadChatSession])

  const handleNewChat = useCallback(async () => {
    // Clear current messages
    clearMessages(agentId)
    setCurrentChatId(null)

    // Create a new session when the user sends their first message
    // The session will be created automatically by the chat store
  }, [agentId, clearMessages])

  // Auto-create session when first message is sent
  useEffect(() => {
    const store = useChatStore.getState()
    const messages = store.messages[agentId] || []

    // If we have messages but no current chat ID, create a session
    if (messages.length > 0 && !currentChatId) {
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        createSession(firstUserMessage.content)
      }
    }
  }, [agentId, currentChatId])

  const createSession = async (firstMessage: string) => {
    try {
      const url = addProfileId('/api/chat/sessions', profileId)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getProfileHeaders(profileId) },
        body: JSON.stringify({
          agentId,
          firstMessage,
          profileId
        })
      })

      const data = await res.json()
      if (data.session) {
        setCurrentChatId(data.session.id)
      }
    } catch (error) {
      console.error('Failed to create chat session:', error)
    }
  }

  if (!showSidebar) {
    return (
      <UnifiedChat
        agent={agent}
        onCheckinClick={onCheckinClick}
        onCreateSkillClick={onCreateSkillClick}
      />
    )
  }

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <ChatSidebar
        agentId={agentId}
        currentChatId={currentChatId || undefined}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 h-full overflow-hidden">
        <UnifiedChat
          agent={agent}
          onCheckinClick={onCheckinClick}
          onCreateSkillClick={onCreateSkillClick}
        />
      </div>
    </div>
  )
}

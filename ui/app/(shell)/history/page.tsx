'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Input } from '@/components/ui'
import { Calendar, MessageSquare, Search, ChevronRight } from 'lucide-react'
import type { ChatHistory, ChatIndex } from '@/types'

interface ChatSession {
  agentId: string
  agentName: string
  date: string
  messageCount: number
  lastMessage: string
  preview: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    loadChatHistory()
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      const agentsData = await response.json()
      setAgents(agentsData)
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const loadChatHistory = async () => {
    try {
      setIsLoading(true)
      // Load chat index to get all dates and agents
      const indexRes = await fetch('/api/chat/index')
      const index: ChatIndex = await indexRes.json()

      // Load chat histories for all dates
      const sessions: ChatSession[] = []

      for (const date of index.dates || []) {
        const agentIds = index.agentIds[date] || []

        for (const agentId of agentIds) {
          try {
            const historyRes = await fetch(`/api/chat/${agentId}?date=${date}`)
            const history: ChatHistory = await historyRes.json()

            if (history.messages && history.messages.length > 0) {
              const lastMessage = history.messages[history.messages.length - 1]
              const preview =
                lastMessage.content.length > 100
                  ? lastMessage.content.substring(0, 100) + '...'
                  : lastMessage.content

              sessions.push({
                agentId,
                agentName: agentId
                  .split('-')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' '),
                date,
                messageCount: history.messages.length,
                lastMessage: lastMessage.content,
                preview,
              })
            }
          } catch (error) {
            console.error(`Failed to load chat history for ${agentId} on ${date}:`, error)
          }
        }
      }

      // Sort by date (newest first)
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setChatSessions(sessions)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionClick = (session: ChatSession) => {
    router.push(`/agent/${session.agentId}`)
  }

  // Filter sessions by search query and date
  const filteredSessions = chatSessions.filter((session) => {
    const matchesSearch =
      searchQuery === '' ||
      session.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDate = selectedDate === '' || session.date === selectedDate

    return matchesSearch && matchesDate
  })

  // Group sessions by date
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = []
    }
    acc[session.date].push(session)
    return acc
  }, {} as Record<string, ChatSession[]>)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    if (date.getTime() === today.getTime()) {
      return 'Today'
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
  }

  // Get unique dates for filter
  const uniqueDates = Array.from(new Set(chatSessions.map((s) => s.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Chat History</h1>

        {/* Search and Filters */}
        <Card className="mb-6 p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-oa-text-secondary" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10"
              />
            </div>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-oa-bg-primary border border-oa-border rounded text-sm text-oa-text-primary focus:outline-none focus:border-oa-accent"
            >
              <option value="">All Dates</option>
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-8 text-center">
            <div className="text-oa-text-secondary">Loading chat history...</div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && chatSessions.length === 0 && (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-oa-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-oa-text-primary mb-2">No chat history yet</h3>
            <p className="text-sm text-oa-text-secondary">
              Start a conversation with an agent to see your chat history here.
            </p>
          </Card>
        )}

        {/* No Results */}
        {!isLoading && chatSessions.length > 0 && filteredSessions.length === 0 && (
          <Card className="p-8 text-center">
            <Search className="w-12 h-12 text-oa-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-oa-text-primary mb-2">No results found</h3>
            <p className="text-sm text-oa-text-secondary">
              Try adjusting your search or filter criteria.
            </p>
          </Card>
        )}

        {/* Chat Sessions by Date */}
        {!isLoading && filteredSessions.length > 0 && (
          <div className="space-y-8">
            {Object.entries(sessionsByDate).map(([date, sessions]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-oa-text-secondary" />
                  <h2 className="text-lg font-semibold text-oa-text-primary">
                    {formatDate(date)}
                  </h2>
                  <span className="text-sm text-oa-text-secondary">
                    ({sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'})
                  </span>
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {sessions.map((session, index) => (
                      <motion.div
                        key={`${session.agentId}-${session.date}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                          delay: index * 0.05,
                        }}
                        onClick={() => handleSessionClick(session)}
                        className="cursor-pointer"
                      >
                        <Card className="p-4 hover:border-oa-accent/30 transition-all group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-oa-text-primary">
                                  {session.agentName}
                                </h3>
                                <span className="text-xs text-oa-text-secondary px-2 py-0.5 bg-oa-bg-secondary rounded">
                                  {session.messageCount} messages
                                </span>
                              </div>
                              <p className="text-sm text-oa-text-secondary line-clamp-2">
                                {session.preview}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-oa-text-secondary group-hover:text-oa-accent transition-colors flex-shrink-0" />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

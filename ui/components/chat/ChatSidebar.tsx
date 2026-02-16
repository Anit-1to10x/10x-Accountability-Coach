'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'

interface ChatSession {
  id: string
  title: string
  date: string
  agentId: string
  preview?: string
  messageCount?: number
  lastUpdated: string
}

interface ChatSidebarProps {
  agentId: string
  currentChatId?: string
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ChatSidebar({
  agentId,
  currentChatId,
  onSelectChat,
  onNewChat,
  isCollapsed = false,
  onToggleCollapse
}: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Load chat sessions
  useEffect(() => {
    loadChats()
  }, [agentId])

  // Focus input when editing
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingChatId])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenChatId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadChats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/chat/sessions?agentId=${agentId}`)
      const data = await res.json()
      if (data.sessions) {
        setChats(data.sessions)
      }
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async (chatId: string) => {
    if (!editTitle.trim()) {
      setEditingChatId(null)
      return
    }

    try {
      const res = await fetch(`/api/chat/sessions/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() })
      })

      if (res.ok) {
        setChats(prev => prev.map(chat =>
          chat.id === chatId ? { ...chat, title: editTitle.trim() } : chat
        ))
      }
    } catch (error) {
      console.error('Failed to rename chat:', error)
    }

    setEditingChatId(null)
    setMenuOpenChatId(null)
  }

  const handleDelete = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${chatId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setChats(prev => prev.filter(chat => chat.id !== chatId))
        if (currentChatId === chatId) {
          onNewChat()
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }

    setDeleteConfirmId(null)
    setMenuOpenChatId(null)
  }

  const startEditing = (chat: ChatSession) => {
    setEditTitle(chat.title)
    setEditingChatId(chat.id)
    setMenuOpenChatId(null)
  }

  const groupChatsByDate = (chats: ChatSession[]) => {
    const groups: Record<string, ChatSession[]> = {}
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    chats.forEach(chat => {
      let groupKey: string
      if (chat.date === today) {
        groupKey = 'Today'
      } else if (chat.date === yesterday) {
        groupKey = 'Yesterday'
      } else {
        // Group by month/year
        const date = new Date(chat.date)
        groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(chat)
    })

    return groups
  }

  const chatGroups = groupChatsByDate(chats)

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-oa-bg-primary border-r border-oa-border flex flex-col items-center py-4">
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg hover:bg-oa-bg-secondary transition-colors mb-4"
          title="New Chat"
        >
          <Plus size={20} className="text-oa-text-secondary" />
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-oa-bg-secondary transition-colors mt-auto"
          title="Expand Sidebar"
        >
          <ChevronRight size={20} className="text-oa-text-secondary" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-oa-bg-primary border-r border-oa-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-oa-border flex items-center justify-between">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-3 py-2 bg-oa-accent hover:bg-oa-accent-hover text-white rounded-lg transition-colors flex-1 mr-2"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">New Chat</span>
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-oa-bg-secondary transition-colors"
          title="Collapse Sidebar"
        >
          <ChevronLeft size={18} className="text-oa-text-secondary" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-oa-text-secondary" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-10 h-10 text-oa-text-secondary mx-auto mb-2 opacity-50" />
            <p className="text-sm text-oa-text-secondary">No conversations yet</p>
            <p className="text-xs text-oa-text-secondary mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          Object.entries(chatGroups).map(([groupName, groupChats]) => (
            <div key={groupName} className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-oa-text-secondary uppercase tracking-wider">
                {groupName}
              </div>

              {groupChats.map(chat => (
                <div
                  key={chat.id}
                  className="relative px-2"
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => {
                    if (menuOpenChatId !== chat.id) {
                      setHoveredChatId(null)
                    }
                  }}
                >
                  {editingChatId === chat.id ? (
                    // Edit mode
                    <div className="flex items-center gap-2 px-2 py-2">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(chat.id)
                          if (e.key === 'Escape') setEditingChatId(null)
                        }}
                        className="flex-1 bg-oa-bg-secondary border border-oa-border rounded px-2 py-1 text-sm text-oa-text-primary focus:outline-none focus:border-oa-accent"
                      />
                      <button
                        onClick={() => handleRename(chat.id)}
                        className="p-1 hover:bg-oa-bg-secondary rounded"
                      >
                        <Check size={14} className="text-green-500" />
                      </button>
                      <button
                        onClick={() => setEditingChatId(null)}
                        className="p-1 hover:bg-oa-bg-secondary rounded"
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                    </div>
                  ) : deleteConfirmId === chat.id ? (
                    // Delete confirmation
                    <div className="flex items-center justify-between px-2 py-2 bg-red-500/10 rounded-lg">
                      <span className="text-xs text-red-400">Delete?</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(chat.id)}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 hover:bg-oa-bg-secondary rounded"
                        >
                          <X size={14} className="text-oa-text-secondary" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal chat item
                    <motion.button
                      onClick={() => onSelectChat(chat.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left group ${
                        currentChatId === chat.id
                          ? 'bg-oa-accent/20 border border-oa-accent/50'
                          : 'hover:bg-oa-bg-secondary'
                      }`}
                      whileHover={{ x: 2 }}
                    >
                      <MessageSquare size={16} className="text-oa-text-secondary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          currentChatId === chat.id ? 'text-oa-accent font-medium' : 'text-oa-text-primary'
                        }`}>
                          {chat.title}
                        </p>
                        {chat.preview && (
                          <p className="text-xs text-oa-text-secondary truncate">
                            {chat.preview}
                          </p>
                        )}
                      </div>

                      {/* Hover menu trigger */}
                      <AnimatePresence>
                        {(hoveredChatId === chat.id || menuOpenChatId === chat.id) && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuOpenChatId(menuOpenChatId === chat.id ? null : chat.id)
                            }}
                            className="p-1 hover:bg-oa-bg-tertiary rounded"
                          >
                            <MoreHorizontal size={14} className="text-oa-text-secondary" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {menuOpenChatId === chat.id && (
                      <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-2 top-full z-50 mt-1 py-1 bg-oa-bg-secondary border border-oa-border rounded-lg shadow-lg min-w-[120px]"
                      >
                        <button
                          onClick={() => startEditing(chat)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-oa-text-primary hover:bg-oa-bg-tertiary transition-colors"
                        >
                          <Pencil size={14} />
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(chat.id)
                            setMenuOpenChatId(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

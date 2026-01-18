'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Sparkles, Check, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Agent } from '@/types'
import { addProfileId, useProfileId } from '@/lib/useProfileId'

interface QuickActionsPanelProps {
  agent?: Agent
  onCheckinClick?: () => void
  onCreateSkillClick?: () => void
}

interface Todo {
  id: string
  title: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
  createdAt?: string
}

export function QuickActionsPanel({ agent, onCheckinClick, onCreateSkillClick }: QuickActionsPanelProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completedNotification, setCompletedNotification] = useState<string | null>(null)
  const profileId = useProfileId()

  useEffect(() => {
    loadTodos()
  }, [profileId])

  const loadTodos = async () => {
    try {
      const url = addProfileId('/api/todos', profileId)
      const response = await fetch(url)
      const allTodos = await response.json()

      // Filter to pending todos only (use 'completed' boolean)
      const pending = Array.isArray(allTodos)
        ? allTodos.filter((t: Todo) => !t.completed).slice(0, 3)
        : []

      setTodos(pending)
    } catch (error) {
      console.error('Failed to load todos:', error)
      setTodos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteTodo = async (todo: Todo) => {
    setCompletingId(todo.id)

    try {
      // Update todo via API
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      if (response.ok) {
        // Show completion notification
        setCompletedNotification(todo.title)

        // Remove from list after animation
        setTimeout(() => {
          setTodos(prev => prev.filter(t => t.id !== todo.id))
          setCompletingId(null)
        }, 500)

        // Hide notification after 3 seconds
        setTimeout(() => {
          setCompletedNotification(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to complete todo:', error)
      setCompletingId(null)
    }
  }

  const agentCapabilities = agent ? [
    { label: 'Track Progress', description: 'Monitor your daily check-ins', auto: true },
    { label: 'Generate Insights', description: 'AI-powered pattern analysis', auto: true },
    { label: 'Suggest Next Steps', description: 'Smart recommendations', auto: false },
  ] : []

  if (loading) {
    return (
      <div className="w-full p-4 text-center">
        <div className="animate-pulse text-sm text-oa-text-secondary">
          Loading quick actions...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Completion Notification Toast */}
      {completedNotification && (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg shadow-lg">
            <Check size={16} />
            <span className="text-sm font-medium">Completed: {completedNotification}</span>
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-sm text-oa-text-secondary text-center">
        Here's what's on your plate today
      </p>

      {/* Upcoming Todos */}
      {todos.length > 0 && (
        <div className="space-y-2">
          {todos.map((todo) => {
            const isCompleting = completingId === todo.id
            return (
              <button
                key={todo.id}
                onClick={() => handleCompleteTodo(todo)}
                disabled={isCompleting}
                className={`w-full flex items-center gap-3 px-4 py-3 border border-oa-border rounded-lg text-left group transition-all duration-300 ${
                  isCompleting
                    ? 'bg-green-500/10 border-green-500/30 opacity-50 line-through'
                    : 'hover:bg-oa-bg-secondary hover:border-oa-accent/50'
                }`}
              >
                {isCompleting ? (
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                ) : (
                  <Circle size={16} className="text-oa-text-secondary flex-shrink-0 group-hover:text-oa-accent" />
                )}
                <span className={`flex-1 text-sm transition-all ${
                  isCompleting ? 'text-green-400' : 'text-oa-text-primary'
                }`}>
                  {todo.title}
                </span>
                {todo.priority === 'high' && !isCompleting && (
                  <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">
                    High
                  </span>
                )}
                {todo.priority === 'medium' && !isCompleting && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded">
                    Medium
                  </span>
                )}
              </button>
            )
          })}

          {/* See All Todos Link */}
          <Link
            href="/schedule"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-oa-accent hover:text-oa-accent/80 hover:bg-oa-bg-secondary rounded-lg transition-colors"
          >
            <span>See All Todos</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Quick action buttons - Removed Daily Check-in */}
      {agent && onCreateSkillClick && (
        <div className="space-y-2">
          <button
            onClick={onCreateSkillClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors font-medium"
          >
            <Sparkles size={18} />
            <span>Create Custom Skill</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-oa-text-secondary mb-4">
            No pending todos. You're all caught up!
          </p>
          <div className="flex flex-col gap-2 items-center">
            {onCheckinClick && (
              <button
                onClick={onCheckinClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <CheckCircle2 size={16} />
                <span>Complete Check-in</span>
              </button>
            )}
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1 text-sm text-oa-accent hover:text-oa-accent/80 transition-colors"
            >
              <span>View Schedule</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

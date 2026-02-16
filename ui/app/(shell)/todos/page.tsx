'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTodoStore } from '@/lib/store'
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'
import { toDateString, getTodayString, getYesterdayString } from '@/lib/datetime'
import { Input, Button, Card } from '@/components/ui'
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Clock,
  Target,
  X,
  ArrowLeft,
  ChevronRight,
  Trash2,
  Edit2,
  CheckCircle,
  Flame,
  Timer,
  Shuffle,
  FileText
} from 'lucide-react'
import Link from 'next/link'

interface TodoDetailProps {
  todo: any
  onClose: () => void
  onToggle: (id: string) => void
  onDelete?: (id: string) => void
}

function TodoDetailPanel({ todo, onClose, onToggle, onDelete }: TodoDetailProps) {
  const router = useRouter()
  const isCompleted = todo.status === 'completed'

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-oa-bg-primary border-l border-oa-border shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-oa-border flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-oa-text-secondary hover:text-oa-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Todos</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-oa-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Status badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isCompleted
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
          }`}>
            {isCompleted ? 'Completed' : 'Pending'}
          </span>
          {todo.priority && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              todo.priority === 'high'
                ? 'border-red-500/30 text-red-400 bg-red-500/10'
                : todo.priority === 'medium'
                ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                : 'border-green-500/30 text-green-400 bg-green-500/10'
            }`}>
              {todo.priority} priority
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className={`text-xl font-semibold mb-4 ${isCompleted ? 'line-through text-oa-text-secondary' : 'text-oa-text-primary'}`}>
          {todo.text || todo.title}
        </h2>

        {/* Description */}
        {todo.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-oa-text-secondary mb-2">Description</h3>
            <p className="text-oa-text-primary">{todo.description}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-4 mb-6">
          {/* Duration */}
          {todo.duration && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-oa-text-secondary">Duration</div>
                <div className="text-sm font-medium text-oa-text-primary">{todo.duration} minutes</div>
              </div>
            </div>
          )}

          {/* Flexibility */}
          {todo.flexibility && (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                todo.flexibility === 'fixed' ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}>
                <Shuffle className={`w-5 h-5 ${
                  todo.flexibility === 'fixed' ? 'text-red-400' : 'text-green-400'
                }`} />
              </div>
              <div>
                <div className="text-xs text-oa-text-secondary">Scheduling</div>
                <div className="text-sm font-medium text-oa-text-primary capitalize">
                  {todo.flexibility === 'fixed' ? 'Fixed time - cannot be rescheduled' : 'Flexible - can be rescheduled'}
                </div>
              </div>
            </div>
          )}

          {todo.time && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-oa-bg-secondary flex items-center justify-center">
                <Clock className="w-5 h-5 text-oa-accent" />
              </div>
              <div>
                <div className="text-xs text-oa-text-secondary">Scheduled Time</div>
                <div className="text-sm font-medium text-oa-text-primary">{todo.time}</div>
              </div>
            </div>
          )}

          {(todo.date || todo.dueDate) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-oa-bg-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-oa-accent" />
              </div>
              <div>
                <div className="text-xs text-oa-text-secondary">Due Date</div>
                <div className="text-sm font-medium text-oa-text-primary">
                  {new Date(todo.dueDate || todo.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}

          {todo.challengeName && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-oa-accent/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-oa-accent" />
              </div>
              <div>
                <div className="text-xs text-oa-text-secondary">Challenge</div>
                <div className="text-sm font-medium text-oa-text-primary">{todo.challengeName}</div>
              </div>
            </div>
          )}

          {todo.day && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-xs text-oa-text-secondary">Day</div>
                <div className="text-sm font-medium text-oa-text-primary">
                  Day {todo.day}{todo.dayTitle ? ` - ${todo.dayTitle}` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Challenge Link */}
        {todo.challengeId && (
          <div className="p-4 bg-oa-bg-secondary rounded-lg border border-oa-border mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-oa-text-secondary mb-1">Part of Challenge</div>
                <div className="text-sm font-medium text-oa-text-primary">{todo.challengeName || 'View Challenge'}</div>
              </div>
              <button
                onClick={() => router.push(`/streak/${todo.challengeId}`)}
                className="flex items-center gap-1 text-oa-accent text-sm hover:underline"
              >
                View
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-oa-border flex gap-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            isCompleted
              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
              : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(todo.id)}
            className="px-4 py-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function TodosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileId = useProfileId()
  const { todos, loadTodos, addTodo, toggleTodo, deleteTodo } = useTodoStore()
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [selectedTodo, setSelectedTodo] = useState<any | null>(null)
  const [challengeTasks, setChallengeTasks] = useState<any[]>([])
  const hasLoaded = useRef(false)

  // Get URL params from calendar navigation
  const todoId = searchParams.get('id')
  const todoDate = searchParams.get('date')
  const todoType = searchParams.get('type')

  // Load todos and challenge tasks
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      loadTodos()
      loadChallengeTasks()
    }
  }, [])

  // Load challenge tasks from API
  const loadChallengeTasks = async () => {
    try {
      const url = addProfileId('/api/todos/from-challenges', profileId)
      const res = await fetch(url)
      const data = await res.json()
      // API returns tasks with pre-calculated dueDates
      setChallengeTasks(data.tasks || [])
    } catch (error) {
      console.error('Failed to load challenge tasks:', error)
    }
  }

  // Re-fetch challenge tasks when files change via CLI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.category === 'challenge' || detail?.category === 'todo') {
        loadChallengeTasks()
      }
    }
    window.addEventListener('file-sync', handler)
    return () => window.removeEventListener('file-sync', handler)
  }, [])

  // Find and select the todo when coming from calendar
  useEffect(() => {
    if (todoId && (todos.length > 0 || challengeTasks.length > 0)) {
      // First check regular todos
      let foundTodo = todos.find(t => t.id === todoId)

      // If not found, check challenge tasks
      if (!foundTodo) {
        foundTodo = challengeTasks.find(t => t.id === todoId)
      }

      // If still not found but we have date, try matching by date and close to the position
      if (!foundTodo && todoDate) {
        // Look for todos on the same date
        const matchingTodos = [...todos, ...challengeTasks].filter(t =>
          t.date === todoDate || new Date(t.createdAt).toISOString().split('T')[0] === todoDate
        )
        if (matchingTodos.length > 0) {
          foundTodo = matchingTodos[0]
        }
      }

      if (foundTodo) {
        setSelectedTodo(foundTodo)
      }
    }
  }, [todoId, todoDate, todos, challengeTasks])

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return

    await addTodo({
      text: newTodoTitle,
      priority: 'medium',
      status: 'pending',
      agent: 'accountability-coach',
    })

    setNewTodoTitle('')
  }

  const handleToggleTodo = async (id: string) => {
    // Check if it's a challenge task
    const challengeTask = challengeTasks.find(t => t.id === id)
    if (challengeTask) {
      // Handle challenge task toggle
      try {
        const newStatus = challengeTask.status === 'completed' ? 'pending' : 'completed'
        const url = addProfileId('/api/todos/challenge-task', profileId)
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getProfileHeaders(profileId) },
          body: JSON.stringify({
            challengeId: challengeTask.challengeId,
            day: challengeTask.day,
            title: challengeTask.title,
            completed: newStatus === 'completed',
            profileId
          })
        })
        if (res.ok) {
          const isCompleted = newStatus === 'completed'
          // Update local state
          setChallengeTasks(prev =>
            prev.map(t => t.id === id ? { ...t, status: newStatus, completed: isCompleted } : t)
          )
          if (selectedTodo?.id === id) {
            setSelectedTodo({ ...selectedTodo, status: newStatus, completed: isCompleted })
          }
        }
      } catch (error) {
        console.error('Failed to toggle challenge task:', error)
      }
    } else {
      // Regular todo toggle
      await toggleTodo(id)
      if (selectedTodo?.id === id) {
        const updatedTodo = todos.find(t => t.id === id)
        if (updatedTodo) {
          setSelectedTodo({
            ...selectedTodo,
            status: updatedTodo.status === 'completed' ? 'pending' : 'completed'
          })
        }
      }
    }
  }

  const handleDeleteTodo = async (id: string) => {
    if (deleteTodo) {
      await deleteTodo(id)
      setSelectedTodo(null)
      // Clear URL params
      router.replace('/todos')
    }
  }

  const handleCloseDetail = () => {
    setSelectedTodo(null)
    // Clear URL params
    router.replace('/todos')
  }

  // Get today and yesterday dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Combine and filter todos by date
  const allTodos = useMemo(() => {
    const combined = [
      ...todos.map(t => ({ ...t, source: 'regular' })),
      ...challengeTasks.map(t => ({ ...t, source: 'challenge' }))
    ]
    return combined
  }, [todos, challengeTasks])

  // Helper to get date string for comparison (handles dueDate from challenges)
  const getTodoDateStr = (t: any) => t.dueDate || t.date || t.createdAt

  const todayTodos = useMemo(() => {
    const todayStr = toDateString(today)
    return allTodos.filter((t) => {
      const dateStr = getTodoDateStr(t)
      if (!dateStr) return false
      return dateStr.startsWith(todayStr)
    })
  }, [allTodos, today])

  const yesterdayTodos = useMemo(() => {
    const yesterdayStr = toDateString(yesterday)
    return allTodos.filter((t) => {
      const dateStr = getTodoDateStr(t)
      if (!dateStr) return false
      return dateStr.startsWith(yesterdayStr)
    })
  }, [allTodos, yesterday])

  const upcomingTodos = useMemo(() => {
    const todayStr = toDateString(today)
    return allTodos.filter((t) => {
      const dateStr = getTodoDateStr(t)
      if (!dateStr) return false
      return dateStr > todayStr
    }).sort((a, b) => {
      const dateA = getTodoDateStr(a) || ''
      const dateB = getTodoDateStr(b) || ''
      return dateA.localeCompare(dateB)
    })
  }, [allTodos, today])

  const earlierTodos = useMemo(() => {
    const yesterdayStr = toDateString(yesterday)
    return allTodos.filter((t) => {
      const dateStr = getTodoDateStr(t)
      if (!dateStr) return false
      return dateStr < yesterdayStr
    })
  }, [allTodos, yesterday])

  // Calculate progress
  const todayCompleted = todayTodos.filter((t) => t.status === 'completed').length
  const todayTotal = todayTodos.length
  const todayProgress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0

  const yesterdayCompleted = yesterdayTodos.filter((t) => t.status === 'completed').length
  const yesterdayTotal = yesterdayTodos.length
  const yesterdayProgress = yesterdayTotal > 0 ? (yesterdayCompleted / yesterdayTotal) * 100 : 0

  const TodoItem = ({ todo, showDate = false }: { todo: any; showDate?: boolean }) => {
    const isCompleted = todo.status === 'completed'
    const isSelected = selectedTodo?.id === todo.id

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card
          className={`flex items-start gap-3 p-4 cursor-pointer transition-all ${
            isSelected
              ? 'border-oa-accent bg-oa-accent/5'
              : 'hover:border-oa-accent/30'
          }`}
          onClick={() => setSelectedTodo(todo)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleTodo(todo.id)
            }}
            className="mt-0.5 flex-shrink-0 transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-oa-accent" />
            ) : (
              <Circle className="w-5 h-5 text-oa-text-secondary hover:text-oa-accent" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div
              className={`text-base font-medium ${
                isCompleted ? 'line-through text-oa-text-secondary' : 'text-oa-text-primary'
              }`}
            >
              {todo.text || todo.title}
            </div>
            {todo.challengeName && (
              <div className="flex items-center gap-1 text-xs text-oa-accent mt-1">
                <Target className="w-3 h-3" />
                {todo.challengeName}
                {todo.day && <span className="text-oa-text-secondary">Day {todo.day}</span>}
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              {todo.duration && (
                <div className="flex items-center gap-1 text-xs text-oa-text-secondary">
                  <Timer className="w-3 h-3" />
                  {todo.duration}m
                </div>
              )}
              {todo.time && (
                <div className="flex items-center gap-1 text-xs text-oa-text-secondary">
                  <Clock className="w-3 h-3" />
                  {todo.time}
                </div>
              )}
            </div>
            {showDate && (
              <div className="text-xs text-oa-text-secondary mt-1">
                {new Date(todo.dueDate || todo.date || todo.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {todo.source === 'challenge' && (
              <span className="text-xs px-2 py-0.5 rounded border border-oa-accent/30 text-oa-accent bg-oa-accent/5">
                Challenge
              </span>
            )}
            {todo.priority && (
              <span
                className={`text-xs px-2 py-1 rounded border flex-shrink-0 ${
                  todo.priority === 'high'
                    ? 'border-red-500/30 text-red-500 bg-red-500/5'
                    : todo.priority === 'medium'
                    ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'
                    : 'border-green-500/30 text-green-500 bg-green-500/5'
                }`}
              >
                {todo.priority}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Todos</h1>
          <div className="text-sm text-oa-text-secondary">
            {todayCompleted} of {todayTotal} completed today
          </div>
        </div>

        {/* Add Todo Form */}
        <Card className="mb-8 p-4">
          <div className="flex gap-3">
            <Input
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="What do you want to accomplish today?"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              className="flex-1 text-base"
            />
            <Button onClick={handleAddTodo} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </Card>

        <div className="space-y-8">
          {/* Today's Todos */}
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-oa-text-primary">
                  Today
                </h2>
                <span className="text-sm text-oa-text-secondary">
                  {todayCompleted}/{todayTotal}
                </span>
              </div>
              {todayTotal > 0 && (
                <div className="w-full bg-oa-bg-tertiary rounded-full h-2.5">
                  <motion.div
                    className="bg-oa-accent rounded-full h-2.5 transition-all duration-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${todayProgress}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              {todayTodos.length > 0 ? (
                todayTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-sm text-oa-text-secondary">
                    No todos for today. Add one above to get started!
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Upcoming Todos */}
          {upcomingTodos.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-oa-text-primary">
                  Upcoming
                </h2>
              </div>
              <div className="space-y-2">
                {upcomingTodos.slice(0, 10).map((todo) => (
                  <TodoItem key={todo.id} todo={todo} showDate />
                ))}
                {upcomingTodos.length > 10 && (
                  <div className="text-center py-2">
                    <Link href="/schedule" className="text-sm text-oa-accent hover:underline">
                      View all {upcomingTodos.length} upcoming tasks in Calendar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Yesterday's Todos */}
          {yesterdayTodos.length > 0 && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-oa-text-secondary">
                    Yesterday
                  </h2>
                  <span className="text-sm text-oa-text-secondary">
                    {yesterdayCompleted}/{yesterdayTotal}
                  </span>
                </div>
                <div className="w-full bg-oa-bg-tertiary rounded-full h-2">
                  <motion.div
                    className={`rounded-full h-2 transition-all duration-500 ${
                      yesterdayProgress === 100 ? 'bg-green-500' : 'bg-oa-text-secondary'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${yesterdayProgress}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
              <div className="space-y-2 opacity-75">
                {yesterdayTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            </div>
          )}

          {/* Earlier Todos */}
          {earlierTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-oa-text-secondary mb-4">
                Earlier
              </h2>
              <div className="space-y-2 opacity-60">
                {earlierTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} showDate />
                ))}
              </div>
            </div>
          )}

          {/* Link to Schedule for Challenge Tasks */}
          <Card className="mt-8 p-6 border-dashed border-oa-accent/30 bg-oa-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-oa-accent" />
                <div>
                  <h3 className="text-base font-medium text-oa-text-primary">
                    View Full Calendar
                  </h3>
                  <p className="text-sm text-oa-text-secondary">
                    See all your tasks and challenges in calendar view
                  </p>
                </div>
              </div>
              <Link href="/schedule">
                <Button variant="outline" className="border-oa-accent text-oa-accent hover:bg-oa-accent hover:text-white">
                  View Calendar
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Todo Detail Panel */}
      <AnimatePresence>
        {selectedTodo && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={handleCloseDetail}
            />
            {/* Detail Panel */}
            <TodoDetailPanel
              todo={selectedTodo}
              onClose={handleCloseDetail}
              onToggle={handleToggleTodo}
              onDelete={selectedTodo.source !== 'challenge' ? handleDeleteTodo : undefined}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

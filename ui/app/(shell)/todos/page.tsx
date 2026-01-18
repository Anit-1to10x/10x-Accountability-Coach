'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTodoStore } from '@/lib/store'
import { Input, Button, Card } from '@/components/ui'
import { CheckCircle2, Circle, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TodosPage() {
  const { todos, loadTodos, addTodo, toggleTodo } = useTodoStore()
  const [newTodoTitle, setNewTodoTitle] = useState('')

  useEffect(() => {
    loadTodos()
  }, [])

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

  // Get today and yesterday dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Filter todos by date
  const todayTodos = Array.isArray(todos)
    ? todos.filter((t) => {
        const createdDate = new Date(t.createdAt)
        createdDate.setHours(0, 0, 0, 0)
        return createdDate.getTime() === today.getTime()
      })
    : []

  const yesterdayTodos = Array.isArray(todos)
    ? todos.filter((t) => {
        const createdDate = new Date(t.createdAt)
        createdDate.setHours(0, 0, 0, 0)
        return createdDate.getTime() === yesterday.getTime()
      })
    : []

  // Calculate progress
  const todayCompleted = todayTodos.filter((t) => t.status === 'completed').length
  const todayTotal = todayTodos.length
  const todayProgress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0

  const yesterdayCompleted = yesterdayTodos.filter((t) => t.status === 'completed').length
  const yesterdayTotal = yesterdayTodos.length
  const yesterdayProgress = yesterdayTotal > 0 ? (yesterdayCompleted / yesterdayTotal) * 100 : 0

  const TodoItem = ({ todo, showDate = false }: { todo: any; showDate?: boolean }) => {
    const isCompleted = todo.status === 'completed'

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card className="flex items-start gap-3 p-4 hover:border-oa-accent/30 transition-colors">
          <button
            onClick={() => toggleTodo(todo.id)}
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
            {todo.description && (
              <div className="text-sm text-oa-text-secondary mt-1">{todo.description}</div>
            )}
            {showDate && (
              <div className="text-xs text-oa-text-secondary mt-1">
                {new Date(todo.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <div
            className={`text-xs px-2 py-1 rounded border flex-shrink-0 ${
              todo.priority === 'high'
                ? 'border-red-500/30 text-red-500 bg-red-500/5'
                : todo.priority === 'medium'
                ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'
                : 'border-green-500/30 text-green-500 bg-green-500/5'
            }`}
          >
            {todo.priority}
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

          {/* All Other Todos */}
          {todos.filter((t) => {
            const createdDate = new Date(t.createdAt)
            createdDate.setHours(0, 0, 0, 0)
            return (
              createdDate.getTime() !== today.getTime() &&
              createdDate.getTime() !== yesterday.getTime()
            )
          }).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-oa-text-secondary mb-4">
                Earlier
              </h2>
              <div className="space-y-2 opacity-60">
                {todos
                  .filter((t) => {
                    const createdDate = new Date(t.createdAt)
                    createdDate.setHours(0, 0, 0, 0)
                    return (
                      createdDate.getTime() !== today.getTime() &&
                      createdDate.getTime() !== yesterday.getTime()
                    )
                  })
                  .map((todo) => (
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
                    Challenge Tasks
                  </h3>
                  <p className="text-sm text-oa-text-secondary">
                    View and manage your challenge tasks in the Schedule
                  </p>
                </div>
              </div>
              <Link href="/schedule">
                <Button variant="outline" className="border-oa-accent text-oa-accent hover:bg-oa-accent hover:text-white">
                  View Schedule
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

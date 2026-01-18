'use client'

import { motion } from 'framer-motion'
import { Check, Trash2, Sparkles, Flag, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  aiGenerated: boolean
  challengeId?: string
  challengeName?: string
}

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onCheckin?: (todo: Todo) => void
}

const priorityColors = {
  high: 'border-l-red-400 bg-red-500/5',
  medium: 'border-l-yellow-400 bg-yellow-500/5',
  low: 'border-l-green-400 bg-green-500/5',
}

const priorityIcons = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
}

export default function TodoList({ todos, onToggle, onDelete, onCheckin }: TodoListProps) {
  const router = useRouter()
  const safeTodos = Array.isArray(todos) ? todos : []

  // Handle card click for check-in
  const handleCardClick = (todo: Todo) => {
    if (onCheckin) {
      onCheckin(todo)
    } else {
      // Default: navigate to chat with check-in message
      const checkinMessage = encodeURIComponent(`Check in for: ${todo.text}`)
      router.push(`/chat?agent=accountability-coach&message=${checkinMessage}`)
    }
  }

  return (
    <div className="space-y-3">
      {safeTodos.map((todo, index) => (
        <motion.div
          key={todo.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleCardClick(todo)}
          className={`
            glass rounded-xl p-4 border-l-4 transition-all cursor-pointer
            ${priorityColors[todo.priority]}
            ${todo.completed ? 'opacity-60' : ''}
            hover:scale-[1.02] hover:shadow-lg hover:border-oa-accent/50
          `}
        >
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(todo.id)
              }}
              className={`
                flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                ${todo.completed
                  ? 'bg-oa-success border-oa-success'
                  : 'border-white/30 hover:border-oa-primary'
                }
              `}
            >
              {todo.completed && <Check size={16} className="text-white" />}
            </motion.button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p
                  className={`
                    text-white font-medium
                    ${todo.completed ? 'line-through opacity-60' : ''}
                  `}
                >
                  {todo.text}
                </p>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {todo.aiGenerated && (
                    <span
                      className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full flex items-center gap-1"
                      title="AI Generated"
                    >
                      <Sparkles size={12} />
                      AI
                    </span>
                  )}

                  <span className="text-lg" title={`${todo.priority} priority`}>
                    {priorityIcons[todo.priority]}
                  </span>
                </div>
              </div>

              {todo.dueDate && (
                <p className="text-white/40 text-xs mb-2">
                  Due: {new Date(todo.dueDate).toLocaleDateString()}
                </p>
              )}

              {/* Check-in hint */}
              {!todo.completed && (
                <div className="flex items-center gap-1 mt-2 text-xs text-oa-accent/70">
                  <MessageCircle size={12} />
                  <span>Click to check in</span>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(todo.id)
              }}
              className="flex-shrink-0 p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
            >
              <Trash2 size={16} className="text-white/40 group-hover:text-red-400" />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

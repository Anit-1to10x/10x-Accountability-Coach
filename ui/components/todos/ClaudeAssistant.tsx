'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Send, Wand2, Loader2 } from 'lucide-react'
import ChatMessage from '@/components/chat/ChatMessage'
import { StreamingStatus, StreamingPhase } from '@/components/chat/StreamingStatus'

interface ClaudeAssistantProps {
  onGenerate: (todos: Partial<any>[]) => void
  onClose: () => void
  userName: string
  profileId?: string
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface SuggestedTodo {
  text: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * Claude Assistant - AI-powered todo planning
 * Uses OpenAnalyst API for actual AI responses (not simulated)
 */
export default function ClaudeAssistant({ onGenerate, onClose, userName, profileId }: ClaudeAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi ${userName}! I'm your AI accountability assistant. I can help you:\n\n• Break down your challenges into actionable todos\n• Prioritize tasks based on your goals\n• Suggest next steps for your active challenges\n• Create a realistic daily plan\n\nWhat would you like help with?`,
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingPhase, setStreamingPhase] = useState<StreamingPhase>('idle')
  const [suggestedTodos, setSuggestedTodos] = useState<SuggestedTodo[]>([])
  const [currentStreamingText, setCurrentStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions = [
    'Suggest todos for today',
    'Break down my current challenge',
    'What should I focus on next?',
    'Create a realistic daily plan',
  ]

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentStreamingText])

  const handleSend = async (message: string) => {
    if (!message.trim() || isStreaming) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)
    setStreamingPhase('thinking')
    setCurrentStreamingText('')
    setSuggestedTodos([])

    try {
      // Build system prompt for todo generation
      const systemPrompt = `You are an AI accountability assistant helping ${userName} plan their todos and tasks.

Your role is to:
1. Suggest actionable, specific todos based on the user's goals and challenges
2. Prioritize tasks (high, medium, low) based on importance and urgency
3. Keep suggestions realistic and achievable
4. Reference their actual context when available

When suggesting todos, format them as a JSON array at the end of your response like this:
\`\`\`json
[
  {"text": "Task description", "priority": "high"},
  {"text": "Another task", "priority": "medium"}
]
\`\`\`

Keep your conversational response friendly and encouraging. Then provide the structured todos.`

      // Call the streaming API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'todo-assistant',
          content: message,
          profileId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process SSE events
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          if (!event.startsWith('data: ')) continue

          try {
            const data = JSON.parse(event.slice(6))

            switch (data.type) {
              case 'start':
                setStreamingPhase('thinking')
                break

              case 'skill_match':
                setStreamingPhase('matching_skill')
                break

              case 'chunk':
                if (data.content) {
                  fullContent += data.content
                  setCurrentStreamingText(fullContent)
                  setStreamingPhase('generating')
                }
                break

              case 'end':
                setStreamingPhase('complete')
                break

              case 'error':
                throw new Error(data.error || 'Unknown error')
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

      // Parse todos from response
      const todos = parseTodosFromResponse(fullContent)
      if (todos.length > 0) {
        setSuggestedTodos(todos)
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fullContent.replace(/```json[\s\S]*?```/g, '').trim(),
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
      setCurrentStreamingText('')

    } catch (error) {
      console.error('Claude Assistant error:', error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsStreaming(false)
      setStreamingPhase('idle')
    }
  }

  // Parse todos from AI response
  const parseTodosFromResponse = (text: string): SuggestedTodo[] => {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t): t is SuggestedTodo =>
              typeof t.text === 'string' &&
              ['high', 'medium', 'low'].includes(t.priority)
          )
        }
      }
    } catch (e) {
      console.error('Failed to parse todos:', e)
    }
    return []
  }

  const handleAddTodos = () => {
    onGenerate(suggestedTodos)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-oa-dark rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Todo Assistant</h2>
              <p className="text-white/60 text-sm">AI-powered todo planning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence>
            {messages.map(message => (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))}
          </AnimatePresence>

          {/* Streaming text */}
          {currentStreamingText && (
            <ChatMessage
              message={currentStreamingText}
              isUser={false}
              timestamp={new Date()}
            />
          )}

          {/* Streaming status */}
          {isStreaming && (
            <div className="flex justify-start mb-4">
              <StreamingStatus
                phase={streamingPhase}
                isVisible={true}
              />
            </div>
          )}

          {/* Suggested Todos Preview */}
          {suggestedTodos.length > 0 && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Wand2 size={16} />
                  Suggested Todos ({suggestedTodos.length})
                </h4>
                <div className="space-y-2 mb-4">
                  {suggestedTodos.map((todo, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-white/80"
                    >
                      <span>
                        {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <span>{todo.text}</span>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddTodos}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
                >
                  Add All Todos
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          {messages.length === 1 && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <p className="text-white/40 text-sm mb-3">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <motion.button
                    key={action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(action)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
                  >
                    {action}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask for help with your todos..."
              disabled={isStreaming}
              className="flex-1 bg-transparent text-white placeholder-white/40 outline-none disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isStreaming}
              className={`
                p-2 rounded-lg transition-colors
                ${input.trim() && !isStreaming
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
                }
              `}
            >
              {isStreaming ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

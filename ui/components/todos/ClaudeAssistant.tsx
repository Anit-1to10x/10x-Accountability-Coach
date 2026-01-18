'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Send, Wand2 } from 'lucide-react'
import ChatMessage from '@/components/chat/ChatMessage'
import TypingIndicator from '@/components/chat/TypingIndicator'

interface ClaudeAssistantProps {
  onGenerate: (todos: Partial<any>[]) => void
  onClose: () => void
  userName: string
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ClaudeAssistant({ onGenerate, onClose, userName }: ClaudeAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi ${userName}! I'm Claude, your AI accountability assistant. I can help you:\n\n• Break down your challenges into actionable todos\n• Prioritize tasks based on your goals\n• Suggest next steps for your active challenges\n• Create a realistic daily plan\n\nWhat would you like help with?`,
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestedTodos, setSuggestedTodos] = useState<any[]>([])

  const quickActions = [
    'Suggest todos for today',
    'Break down my Python challenge',
    'What should I focus on next?',
    'Create a realistic daily plan',
  ]

  const handleSend = async (message: string) => {
    if (!message.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate Claude response
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate AI response based on input
    let response = ''
    let todos: any[] = []

    if (message.toLowerCase().includes('today') || message.toLowerCase().includes('suggest')) {
      response = "Based on your active Python challenge and current streak, here are today's priorities:\n\nI've created these todos to keep your momentum going. Want me to add them?"

      todos = [
        { text: 'Complete Python lesson 6 (30 min)', priority: 'high' },
        { text: 'Review yesterday\'s concepts (15 min)', priority: 'medium' },
        { text: 'Practice 3 coding exercises', priority: 'medium' },
        { text: 'Update your challenge log', priority: 'low' },
      ]
    } else if (message.toLowerCase().includes('python') || message.toLowerCase().includes('break down')) {
      response = "Let's break down your Python learning into manageable steps for this week:\n\nThese will help you make steady progress. Should I add them?"

      todos = [
        { text: 'Complete NumPy basics module', priority: 'high' },
        { text: 'Build a simple calculator project', priority: 'high' },
        { text: 'Read Python documentation on data structures', priority: 'medium' },
        { text: 'Watch tutorial on Pandas DataFrame', priority: 'medium' },
        { text: 'Join Python community forum and introduce yourself', priority: 'low' },
      ]
    } else if (message.toLowerCase().includes('focus') || message.toLowerCase().includes('next')) {
      response = "Looking at your 12-day streak, you're building great momentum! Here's what I recommend focusing on next:\n\nWant me to create these todos?"

      todos = [
        { text: 'Deep dive into data visualization (1 hour)', priority: 'high' },
        { text: 'Start planning your first data project', priority: 'high' },
        { text: 'Review all concepts learned so far', priority: 'medium' },
      ]
    } else {
      response = "I understand you're looking for guidance. Based on your current challenges and progress, I can suggest specific todos. Try asking:\n\n• 'What should I work on today?'\n• 'Break down my active challenge'\n• 'Create a realistic plan for this week'"
    }

    setIsTyping(false)

    const claudeMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, claudeMessage])
    setSuggestedTodos(todos)
  }

  const handleAddTodos = () => {
    onGenerate(suggestedTodos)
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
              <h2 className="text-xl font-semibold text-white">Claude Assistant</h2>
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

          {isTyping && <TypingIndicator />}

          {/* Suggested Todos Preview */}
          {suggestedTodos.length > 0 && !isTyping && (
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
          {messages.length === 1 && (
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
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask Claude for help..."
              className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className={`
                p-2 rounded-lg transition-colors
                ${input.trim() && !isTyping
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
                }
              `}
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'

interface ChatMessageProps {
  message: string
  isUser: boolean
  timestamp?: Date
}

export default function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
          isUser
            ? 'bg-oa-primary text-white rounded-br-sm'
            : 'bg-white/10 text-white rounded-bl-sm'
        }`}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">{message}</p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-white/60' : 'text-white/40'}`}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  )
}

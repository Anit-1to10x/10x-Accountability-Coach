'use client'

import { motion } from 'framer-motion'

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-start mb-4"
    >
      <div className="bg-white/10 rounded-2xl rounded-bl-sm px-5 py-3">
        <div className="flex space-x-2">
          <span className="typing-dot w-2 h-2 bg-white/60 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-white/60 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-white/60 rounded-full" />
        </div>
      </div>
    </motion.div>
  )
}

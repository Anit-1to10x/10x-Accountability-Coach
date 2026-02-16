'use client'

import { useState, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface TodoInputProps {
  onAdd: (text: string, priority: 'high' | 'medium' | 'low') => void
  onCancel: () => void
}

export default function TodoInput({ onAdd, onCancel }: TodoInputProps) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')

  const handleSubmit = () => {
    if (text.trim()) {
      onAdd(text.trim(), priority)
      setText('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          autoFocus
          className="flex-1 bg-transparent text-white placeholder-white/40 text-lg outline-none"
        />

        <div className="flex items-center gap-2">
          {/* Priority Selector */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`
                  px-3 py-1 rounded text-xs font-medium transition-all
                  ${priority === p
                    ? p === 'high'
                      ? 'bg-red-500 text-white'
                      : p === 'medium'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-green-500 text-white'
                    : 'text-white/40 hover:text-white/60'
                  }
                `}
              >
                {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'}
              </button>
            ))}
          </div>

          {/* Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={`
              p-2 rounded-lg transition-colors
              ${text.trim()
                ? 'bg-oa-primary hover:bg-oa-secondary text-white'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
              }
            `}
          >
            <Plus size={20} />
          </motion.button>

          {/* Cancel Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>
      </div>

      <div className="mt-3 text-xs text-white/40">
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd> to add •{' '}
        <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> to cancel
      </div>
    </motion.div>
  )
}

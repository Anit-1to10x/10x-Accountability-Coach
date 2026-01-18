'use client'

import React, { useState, useRef } from 'react'
import { Paperclip, ToggleLeft, ToggleRight, Zap, ArrowUp, X } from 'lucide-react'
import { QuickActionsPopup } from './QuickActionsPopup'
import type { Agent } from '@/types'

interface ChatInputEnhancedProps {
  onSend: (message: string, files?: File[]) => void
  disabled?: boolean
  placeholder?: string
  agent?: Agent
  onQuickAction?: (actionId: string) => void
}

export function ChatInputEnhanced({
  onSend,
  disabled = false,
  placeholder = 'Type your message here...',
  agent,
  onQuickAction
}: ChatInputEnhancedProps) {
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [quickMode, setQuickMode] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!message.trim() && attachedFiles.length === 0) return

    onSend(message, attachedFiles)
    setMessage('')
    setAttachedFiles([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setAttachedFiles(prev => [...prev, ...filesArray])
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full">
      {/* File attachments preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1 bg-oa-bg-secondary border border-oa-border rounded-lg text-sm"
            >
              <Paperclip size={14} className="text-oa-text-secondary" />
              <span className="text-oa-text-primary">{file.name}</span>
              <button
                onClick={() => removeFile(idx)}
                className="text-oa-text-secondary hover:text-oa-text-primary"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center gap-3 px-5 py-4 bg-oa-bg-secondary border border-oa-border rounded-xl hover:border-oa-text-secondary transition-colors">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-oa-text-secondary hover:text-oa-text-primary transition-colors"
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Quick mode toggle */}
        <button
          onClick={() => setQuickMode(!quickMode)}
          className="text-oa-text-secondary hover:text-oa-text-primary transition-colors"
          title={quickMode ? 'Quick mode ON' : 'Quick mode OFF'}
        >
          {quickMode ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>

        {/* Text input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-oa-text-primary placeholder-oa-text-secondary outline-none text-sm"
        />

        {/* Lightning/quick action button */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="text-oa-text-secondary hover:text-oa-text-primary transition-colors"
            title="Quick actions"
          >
            <Zap size={20} />
          </button>

          <QuickActionsPopup
            isOpen={showQuickActions}
            onClose={() => setShowQuickActions(false)}
            agent={agent}
            onActionClick={(actionId) => {
              onQuickAction?.(actionId)
            }}
          />
        </div>

        {/* Send button - circular with blue background */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachedFiles.length === 0)}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-all
            ${disabled || (!message.trim() && attachedFiles.length === 0)
              ? 'bg-oa-border text-oa-text-secondary cursor-not-allowed'
              : 'bg-oa-accent text-white hover:opacity-90'
            }
          `}
          title="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </div>

      {/* Quick mode indicator */}
      {quickMode && (
        <div className="mt-2 flex items-center gap-2 text-xs text-oa-text-secondary">
          <Zap size={12} />
          <span>Quick mode: Faster responses, less detailed</span>
        </div>
      )}
    </div>
  )
}

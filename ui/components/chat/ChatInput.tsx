'use client'

import React, { useState, useRef } from 'react'
import { useChatStore, useAgentStore } from '@/lib/store'

export default function ChatInput() {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { sendMessage } = useChatStore()
  const { activeAgentId } = useAgentStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() && files.length === 0) return
    if (!activeAgentId) return

    await sendMessage(activeAgentId, message, files)
    setMessage('')
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  return (
    <div className="border-t border-oa-border p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div key={idx} className="text-xs bg-oa-bg-secondary border border-oa-border px-2 py-1 flex items-center gap-2">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                  className="text-oa-text-secondary hover:text-oa-text-primary"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 border border-oa-border hover:bg-oa-bg-secondary text-sm transition-colors"
            disabled={!activeAgentId}
          >
            📎
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={activeAgentId ? "Type a message..." : "Select an agent first"}
            disabled={!activeAgentId}
            className="flex-1 px-4 py-2 border border-oa-border bg-oa-bg-primary text-oa-text-primary text-sm focus:outline-none focus:border-oa-text-primary transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!activeAgentId || (!message.trim() && files.length === 0)}
            className="px-6 py-2 border border-oa-text-primary bg-oa-bg-primary text-oa-text-primary hover:bg-oa-text-primary hover:text-oa-bg-primary text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

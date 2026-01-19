'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip,
  ToggleLeft,
  ToggleRight,
  Zap,
  ArrowUp,
  X,
  Image as ImageIcon,
  FileText,
  FileCode,
  FileJson,
  Video,
  Music,
  FileSpreadsheet,
  File,
  Loader2,
} from 'lucide-react'
import { QuickActionsPopup } from './QuickActionsPopup'
import type { Agent } from '@/types'

interface ChatInputEnhancedProps {
  onSend: (message: string, files?: File[]) => void
  disabled?: boolean
  placeholder?: string
  agent?: Agent
  onQuickAction?: (actionId: string) => void
  agentId?: string
  profileId?: string
}

// Allowed file types
const ACCEPTED_FILES = '.md,.txt,.json,.yaml,.yml,.csv,.pdf,.js,.ts,.jsx,.tsx,.py,.html,.css,.sql,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.mp3,.wav,.zip,.xml'

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

function getFileIcon(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon size={14} className="text-purple-400" />
  }
  if (['mp4', 'webm', 'mov'].includes(ext)) {
    return <Video size={14} className="text-red-400" />
  }
  if (['mp3', 'wav'].includes(ext)) {
    return <Music size={14} className="text-pink-400" />
  }
  if (['json'].includes(ext)) {
    return <FileJson size={14} className="text-yellow-400" />
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'css', 'html', 'sql'].includes(ext)) {
    return <FileCode size={14} className="text-green-400" />
  }
  if (['md', 'txt'].includes(ext)) {
    return <FileText size={14} className="text-blue-400" />
  }
  if (['csv', 'xlsx', 'xls'].includes(ext)) {
    return <FileSpreadsheet size={14} className="text-emerald-400" />
  }

  return <File size={14} className="text-oa-text-secondary" />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ChatInputEnhanced({
  onSend,
  disabled = false,
  placeholder = 'Type your message here...',
  agent,
  onQuickAction,
  agentId,
  profileId,
}: ChatInputEnhancedProps) {
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [quickMode, setQuickMode] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!message.trim() && attachedFiles.length === 0) return
    if (uploadingFiles.size > 0) return // Don't send while uploading

    // Upload files first
    const uploadedFiles: File[] = []
    for (const file of attachedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        if (agentId) formData.append('agentId', agentId)
        if (profileId) formData.append('profileId', profileId)

        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          uploadedFiles.push(file)
        }
      } catch (error) {
        console.error('Failed to upload file:', error)
      }
    }

    onSend(message, attachedFiles)
    setMessage('')
    setAttachedFiles([])
    setImagePreviews({})
    setUploadError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const filesArray = Array.from(e.target.files)
    const validFiles: File[] = []
    let errorMessage = ''

    for (const file of filesArray) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errorMessage = `${file.name} exceeds 10MB limit`
        continue
      }

      validFiles.push(file)

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string,
          }))
        }
        reader.readAsDataURL(file)
      }
    }

    if (errorMessage) {
      setUploadError(errorMessage)
      setTimeout(() => setUploadError(null), 3000)
    }

    setAttachedFiles(prev => [...prev, ...validFiles])

    // Clear input
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    const file = attachedFiles[index]
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))

    // Remove image preview
    if (file && imagePreviews[file.name]) {
      setImagePreviews(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[file.name]
        return newPreviews
      })
    }
  }

  return (
    <div className="w-full">
      {/* Error message */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400"
          >
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File attachments preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, idx) => (
            <motion.div
              key={`${file.name}-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative"
            >
              {/* Image preview */}
              {imagePreviews[file.name] ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-oa-border">
                  <img
                    src={imagePreviews[file.name]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg">
                  {uploadingFiles.has(file.name) ? (
                    <Loader2 size={14} className="text-oa-accent animate-spin" />
                  ) : (
                    getFileIcon(file)
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs text-oa-text-primary truncate max-w-[120px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-oa-text-secondary">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="ml-1 text-oa-text-secondary hover:text-oa-text-primary transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center gap-3 px-5 py-4 bg-oa-bg-secondary border border-oa-border rounded-xl hover:border-oa-text-secondary transition-colors">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-oa-text-secondary hover:text-oa-text-primary transition-colors"
          title="Attach file (images, documents, code, etc.)"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILES}
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
          disabled={disabled || uploadingFiles.size > 0 || (!message.trim() && attachedFiles.length === 0)}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-all
            ${disabled || uploadingFiles.size > 0 || (!message.trim() && attachedFiles.length === 0)
              ? 'bg-oa-border text-oa-text-secondary cursor-not-allowed'
              : 'bg-oa-accent text-white hover:opacity-90'
            }
          `}
          title="Send message"
        >
          {uploadingFiles.size > 0 ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ArrowUp size={18} />
          )}
        </button>
      </div>

      {/* Quick mode indicator */}
      {quickMode && (
        <div className="mt-2 flex items-center gap-2 text-xs text-oa-text-secondary">
          <Zap size={12} />
          <span>Quick mode: Faster responses, less detailed</span>
        </div>
      )}

      {/* Supported file types hint */}
      {attachedFiles.length === 0 && (
        <div className="mt-2 text-[10px] text-oa-text-secondary/60 text-center">
          Supports: Images, PDFs, Markdown, JSON, CSV, Python, JavaScript, and more
        </div>
      )}
    </div>
  )
}

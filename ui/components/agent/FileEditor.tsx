'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  Undo,
  Redo,
  Copy,
  Check,
  FileCode,
  FileText,
  FileJson,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'

interface FileEditorProps {
  content: string
  path: string
  onSave: (content: string) => Promise<void>
  onClose?: () => void
}

function getFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400" />
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'css':
    case 'html':
      return <FileCode className="w-4 h-4 text-green-400" />
    case 'md':
      return <FileText className="w-4 h-4 text-blue-400" />
    default:
      return <FileText className="w-4 h-4 text-oa-text-secondary" />
  }
}

function getFileName(path: string) {
  return path.split('/').pop() || path
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'py':
      return 'python'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    case 'css':
      return 'css'
    case 'html':
      return 'html'
    case 'yaml':
    case 'yml':
      return 'yaml'
    default:
      return 'text'
  }
}

export function FileEditor({ content: initialContent, path, onSave, onClose }: FileEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<string[]>([initialContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const fileName = getFileName(path)
  const language = getLanguage(path)
  const lineCount = content.split('\n').length

  useEffect(() => {
    setContent(initialContent)
    setHasChanges(false)
    setHistory([initialContent])
    setHistoryIndex(0)
    setSaveError(null)
  }, [initialContent, path])

  // Sync scroll between line numbers and textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(newContent !== initialContent)
    setSaveError(null)

    // Add to history (debounced)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    if (newHistory.length > 50) newHistory.shift() // Limit history
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex])
      setHasChanges(history[newIndex] !== initialContent)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex])
      setHasChanges(history[newIndex] !== initialContent)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(content)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save file:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save file')
    } finally {
      setIsSaving(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          if (hasChanges && !isSaving) handleSave()
        } else if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          handleRedo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, isSaving, historyIndex, history])

  // Handle Tab key for indentation
  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd

      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      handleContentChange(newContent)

      // Reset cursor position
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="h-full flex flex-col bg-oa-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-oa-border bg-oa-bg-secondary/50">
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(path)}
          <span className="text-sm font-medium text-oa-text-primary truncate">
            {fileName}
          </span>
          {hasChanges && (
            <span className="w-2 h-2 bg-orange-400 rounded-full" title="Unsaved changes" />
          )}
          <span className="text-xs text-oa-text-secondary bg-oa-bg-tertiary px-2 py-0.5 rounded">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 hover:bg-oa-bg-secondary rounded transition-colors disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4 text-oa-text-secondary" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 hover:bg-oa-bg-secondary rounded transition-colors disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4 text-oa-text-secondary" />
          </button>

          <div className="w-px h-4 bg-oa-border mx-1" />

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-oa-bg-secondary rounded transition-colors"
            title="Copy all"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-oa-text-secondary" />
            )}
          </button>

          <div className="w-px h-4 bg-oa-border mx-1" />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              hasChanges && !isSaving
                ? 'bg-oa-accent text-white hover:bg-oa-accent/80'
                : 'bg-oa-bg-secondary text-oa-text-secondary'
            } disabled:opacity-50`}
            title="Save (Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">Save</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-oa-bg-secondary rounded transition-colors ml-1"
              title="Close editor"
            >
              <X className="w-4 h-4 text-oa-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400">{saveError}</span>
        </motion.div>
      )}

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 py-3 px-3 bg-oa-bg-secondary/30 border-r border-oa-border text-right select-none overflow-hidden"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-[11px] text-oa-text-secondary/50 leading-5 font-mono">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDownTextarea}
          className="flex-1 py-3 px-4 bg-oa-bg-primary text-oa-text-primary font-mono text-[11px] leading-5 resize-none focus:outline-none overflow-auto"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-oa-border bg-oa-bg-secondary/50 text-[10px] text-oa-text-secondary">
        <div className="flex items-center gap-3">
          <span>Lines: {lineCount}</span>
          <span>Characters: {content.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-oa-text-secondary/60">{path}</span>
        </div>
      </div>
    </div>
  )
}

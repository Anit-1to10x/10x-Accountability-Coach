'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui'

interface FileEditorProps {
  content: string
  path: string
  onSave: (content: string) => Promise<void>
}

export function FileEditor({ content: initialContent, path, onSave }: FileEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setContent(initialContent)
    setHasChanges(false)
  }, [initialContent, path])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save file:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-oa-border flex items-center justify-between">
        <p className="text-xs text-oa-text-secondary">{path}</p>
        <div className="flex gap-2">
          {hasChanges && (
            <span className="text-xs text-oa-text-secondary">Unsaved changes</span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="text-xs px-3 py-1"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setHasChanges(e.target.value !== initialContent)
        }}
        className="flex-1 p-4 bg-oa-bg-primary text-oa-text-primary font-mono text-xs resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  )
}

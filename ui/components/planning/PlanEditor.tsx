'use client'

import React, { useEffect, useState } from 'react'
import { Save, Loader, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui'

interface PlanEditorProps {
  challengeId: string
  challengeName?: string
  onSave?: () => void
  onCancel?: () => void
}

export function PlanEditor({ challengeId, challengeName, onSave, onCancel }: PlanEditorProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    loadPlan()
  }, [challengeId])

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!content || loading) return

    const timeout = setTimeout(() => {
      savePlan()
    }, 2000) // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timeout)
  }, [content])

  const loadPlan = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/plans/${challengeId}`)

      if (response.ok) {
        const data = await response.json()
        setContent(data.content)
      } else {
        // Plan doesn't exist yet, start with empty content
        setContent('')
      }
    } catch (error) {
      console.error('Failed to load plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePlan = async () => {
    try {
      setSaving(true)

      // Determine if we're creating or updating
      const response = await fetch(`/api/plans/${challengeId}`)
      const method = response.ok ? 'PUT' : 'POST'

      await fetch(`/api/plans/${challengeId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      setLastSaved(new Date())
      onSave?.()
    } catch (error) {
      console.error('Failed to save plan:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAskAIToRevise = async () => {
    // Send current plan to chat for AI revision
    try {
      setSaving(true)

      // Create a message with the current plan asking for revision
      const revisionRequest = `I need help revising my plan for "${challengeName}". Here's my current plan:\n\n${content}\n\nCan you suggest improvements, identify gaps, and help me make this plan more effective?`

      // Navigate to chat with the request pre-filled
      const chatUrl = `/agent/${challengeId.split('-')[0]}?message=${encodeURIComponent(revisionRequest)}&context=plan-revision`
      window.location.href = chatUrl
    } catch (error) {
      console.error('Failed to request AI revision:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-6 h-6 text-oa-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-oa-border">
        <div>
          <h2 className="text-xl font-semibold text-oa-text-primary mb-1">
            {challengeName || 'Edit Plan'}
          </h2>
          {lastSaved && (
            <p className="text-xs text-oa-text-secondary">
              {saving ? 'Saving...' : `Last saved ${lastSaved.toLocaleTimeString()}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleAskAIToRevise}>
            <Sparkles size={16} className="mr-2" />
            Ask AI to Revise
          </Button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
            >
              <X size={20} className="text-oa-text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your plan here...&#10;&#10;You can use markdown formatting:&#10;# Headings&#10;- Bullet points&#10;1. Numbered lists&#10;**Bold text**&#10;*Italic text*"
            className="w-full h-[600px] bg-oa-bg-secondary border border-oa-border rounded-lg p-6 text-oa-text-primary font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-oa-accent focus:border-transparent"
            style={{
              lineHeight: '1.7',
            }}
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-oa-text-secondary">
              {content.split('\n').length} lines • {content.length} characters
            </div>

            <Button onClick={savePlan} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

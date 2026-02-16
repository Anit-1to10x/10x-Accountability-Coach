'use client'

import React, { useEffect, useState } from 'react'
import { X, Edit2, Save } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface SkillDetailModalProps {
  skillId: string | null
  isOpen: boolean
  onClose: () => void
  onSave?: (skillId: string, content: string) => Promise<void>
}

export function SkillDetailModal({ skillId, isOpen, onClose, onSave }: SkillDetailModalProps) {
  const [content, setContent] = useState<string>('')
  const [editedContent, setEditedContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && skillId) {
      loadSkillDetails()
      setIsEditing(false)
    }
  }, [isOpen, skillId])

  const loadSkillDetails = async () => {
    if (!skillId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/skills/${skillId}`)
      const data = await response.json()
      setContent(data.content || '')
      setEditedContent(data.content || '')
    } catch (error) {
      console.error('Failed to load skill details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!skillId || !onSave) return

    try {
      setIsSaving(true)
      await onSave(skillId, editedContent)
      setContent(editedContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save skill:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-oa-border">
          <h2 className="text-xl font-semibold text-oa-text-primary">
            {isEditing ? 'Edit Skill' : 'Skill Details'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && onSave && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-oa-text-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-oa-text-primary border-t-transparent"></div>
            </div>
          ) : isEditing ? (
            <div className="h-full">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full min-h-[500px] p-4 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-oa-accent"
                placeholder="Edit skill content in Markdown format..."
              />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-oa-text-primary">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold text-oa-text-primary mb-4" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-semibold text-oa-text-primary mt-6 mb-3" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-semibold text-oa-text-primary mt-4 mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-oa-text-secondary mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside text-oa-text-secondary mb-4 space-y-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside text-oa-text-secondary mb-4 space-y-2" {...props} />
                  ),
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code className="bg-oa-bg-tertiary px-1.5 py-0.5 rounded text-oa-accent text-sm" {...props} />
                    ) : (
                      <code className="block bg-oa-bg-tertiary p-4 rounded-lg text-sm overflow-x-auto mb-4" {...props} />
                    ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-oa-accent pl-4 italic text-oa-text-secondary my-4" {...props} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-oa-border flex justify-end gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

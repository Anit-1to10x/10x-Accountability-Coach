'use client'

import React, { useState } from 'react'
import { X, FileText, Loader } from 'lucide-react'

interface CreatePlanModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (planId: string) => void
}

export function CreatePlanModal({ isOpen, onClose, onCreated }: CreatePlanModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      // Create plan ID from name
      const planId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      // Create the plan via API
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `# ${name}\n\n${description}\n\n## Goals\n\n- \n\n## Action Items\n\n- \n\n## Timeline\n\n- \n`,
          challengeName: name,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create plan')
      }

      // Reset form
      setName('')
      setDescription('')
      onCreated(planId)
    } catch (error) {
      console.error('Failed to create plan:', error)
      alert('Failed to create plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-oa-border">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-oa-accent" />
              <h2 className="text-xl font-semibold text-oa-text-primary">
                Create New Plan
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-oa-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Learn React in 30 Days"
                className="w-full px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this plan about?"
                rows={3}
                className="w-full px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-oa-accent"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-oa-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

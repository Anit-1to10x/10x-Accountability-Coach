'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Eye, Zap, MessageSquare } from 'lucide-react'
import type { Prompt } from '@/types/prompt'

interface DynamicPrompt {
  id: string
  name: string
  description: string
  keywords: string[]
  intent: string[]
  category: string
  priority: number
  template: string
  skill?: string
  isDynamic: true
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [dynamicPrompts, setDynamicPrompts] = useState<DynamicPrompt[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null)
  const [viewingDynamic, setViewingDynamic] = useState<DynamicPrompt | null>(null)
  const [activeTab, setActiveTab] = useState<'dynamic' | 'custom'>('dynamic')

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setPrompts(data.prompts || [])
      setDynamicPrompts(data.dynamicPrompts || [])
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePrompt = async (promptData: Partial<Prompt>) => {
    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      })
      await loadPrompts()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create prompt:', error)
    }
  }

  const handleUpdatePrompt = async (promptId: string, updates: Partial<Prompt>) => {
    try {
      await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      await loadPrompts()
      setEditingPrompt(null)
    } catch (error) {
      console.error('Failed to update prompt:', error)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })
      await loadPrompts()
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading prompts...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-oa-bg-primary">
      {/* Header */}
      <div className="px-8 py-6 border-b border-oa-border">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-oa-text-primary">
            Prompts Library
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Prompt
          </button>
        </div>
        <p className="text-sm text-oa-text-secondary mb-4">
          Dynamic prompts are automatically matched to user queries. Custom prompts are for manual use.
        </p>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('dynamic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dynamic'
                ? 'bg-oa-accent text-white'
                : 'bg-oa-bg-secondary text-oa-text-secondary hover:bg-oa-bg-tertiary'
            }`}
          >
            <Zap className="w-4 h-4" />
            Dynamic Prompts ({dynamicPrompts.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'bg-oa-accent text-white'
                : 'bg-oa-bg-secondary text-oa-text-secondary hover:bg-oa-bg-tertiary'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Custom Prompts ({prompts.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'dynamic' ? (
          /* Dynamic Prompts */
          dynamicPrompts.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-oa-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-oa-text-secondary mb-2">No dynamic prompts yet</p>
              <p className="text-sm text-oa-text-secondary">
                Create .md files in data/prompts/ with keywords and templates
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dynamicPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-oa-bg-secondary border border-oa-border rounded-lg p-5 hover:border-oa-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-oa-text-primary">
                          {prompt.name}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                          Dynamic
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          prompt.category === 'motivation' ? 'bg-orange-500/10 text-orange-400' :
                          prompt.category === 'checkin' ? 'bg-green-500/10 text-green-400' :
                          prompt.category === 'planning' ? 'bg-blue-500/10 text-blue-400' :
                          prompt.category === 'support' ? 'bg-purple-500/10 text-purple-400' :
                          prompt.category === 'accountability' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {prompt.category}
                        </span>
                        <span className="text-xs text-oa-text-secondary">
                          Priority: {prompt.priority}
                        </span>
                      </div>
                      <p className="text-sm text-oa-text-secondary mb-3">
                        {prompt.description}
                      </p>

                      {/* Keywords */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs text-oa-text-secondary">Keywords:</span>
                        {prompt.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="text-xs px-2 py-0.5 bg-oa-bg-tertiary text-oa-accent rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>

                      {/* Intent */}
                      {prompt.intent.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-oa-text-secondary">Intent:</span>
                          {prompt.intent.map((intent) => (
                            <span
                              key={intent}
                              className="text-xs px-2 py-0.5 bg-oa-accent/10 text-oa-accent rounded"
                            >
                              {intent}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setViewingDynamic(prompt)}
                      className="p-2 hover:bg-oa-bg-tertiary rounded-lg transition-colors"
                      title="View template"
                    >
                      <Eye className="w-4 h-4 text-oa-text-secondary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Custom Prompts */
          prompts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-oa-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-oa-text-secondary mb-4">No custom prompts yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-oa-accent hover:underline"
              >
                Create your first prompt
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-oa-bg-secondary border border-oa-border rounded-lg p-5 hover:border-oa-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-oa-text-primary">
                          {prompt.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          prompt.isGlobal
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {prompt.isGlobal ? 'Global' : 'Agent-specific'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          prompt.category === 'system' ? 'bg-green-500/10 text-green-400' :
                          prompt.category === 'user' ? 'bg-yellow-500/10 text-yellow-400' :
                          prompt.category === 'assistant' ? 'bg-pink-500/10 text-pink-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {prompt.category}
                        </span>
                      </div>
                      <p className="text-sm text-oa-text-secondary mb-3 line-clamp-2">
                        {prompt.description}
                      </p>
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {prompt.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-oa-bg-tertiary text-oa-text-secondary rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingPrompt(prompt)}
                        className="p-2 hover:bg-oa-bg-tertiary rounded-lg transition-colors"
                        title="View prompt"
                      >
                        <Eye className="w-4 h-4 text-oa-text-secondary" />
                      </button>
                      <button
                        onClick={() => setEditingPrompt(prompt)}
                        className="p-2 hover:bg-oa-bg-tertiary rounded-lg transition-colors"
                        title="Edit prompt"
                      >
                        <Edit2 className="w-4 h-4 text-oa-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete prompt"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Create/Edit Modal - Simple implementation for now */}
      {(showCreateModal || editingPrompt) && (
        <PromptModal
          prompt={editingPrompt}
          onClose={() => {
            setShowCreateModal(false)
            setEditingPrompt(null)
          }}
          onSave={(data) => {
            if (editingPrompt) {
              handleUpdatePrompt(editingPrompt.id, data)
            } else {
              handleCreatePrompt(data)
            }
          }}
        />
      )}

      {/* View Modal */}
      {viewingPrompt && (
        <ViewPromptModal
          prompt={viewingPrompt}
          onClose={() => setViewingPrompt(null)}
        />
      )}

      {/* View Dynamic Prompt Modal */}
      {viewingDynamic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-oa-border">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-oa-text-primary">{viewingDynamic.name}</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                  Dynamic
                </span>
              </div>
              <p className="text-sm text-oa-text-secondary mt-2">{viewingDynamic.description}</p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-oa-text-primary mb-2">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {viewingDynamic.keywords.map((k) => (
                    <span key={k} className="text-xs px-2 py-1 bg-oa-bg-tertiary text-oa-accent rounded">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-oa-text-primary mb-2">Intent Phrases</h3>
                <div className="flex flex-wrap gap-2">
                  {viewingDynamic.intent.map((i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-oa-accent/10 text-oa-accent rounded">
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-oa-text-primary mb-2">Template</h3>
                <pre className="bg-oa-bg-tertiary p-4 rounded-lg text-sm text-oa-text-primary font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {viewingDynamic.template}
                </pre>
              </div>

              <div className="text-xs text-oa-text-secondary">
                <p>Variables available: {'{{name}}'}, {'{{task_list}}'}, {'{{challenge_list}}'}, {'{{completed_tasks}}'}, {'{{pending_tasks}}'}, {'{{completion_rate}}'}, {'{{current_streak}}'}, {'{{today_date}}'}, {'{{today_day}}'}</p>
              </div>
            </div>

            <div className="p-6 border-t border-oa-border flex justify-end">
              <button
                onClick={() => setViewingDynamic(null)}
                className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Modal Components
function PromptModal({
  prompt,
  onClose,
  onSave,
}: {
  prompt: Prompt | null
  onClose: () => void
  onSave: (data: Partial<Prompt>) => void
}) {
  const [formData, setFormData] = useState({
    name: prompt?.name || '',
    description: prompt?.description || '',
    content: prompt?.content || '',
    category: prompt?.category || 'custom' as Prompt['category'],
    isGlobal: prompt?.isGlobal ?? true,
    tags: prompt?.tags?.join(', ') || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          <div className="p-6 border-b border-oa-border">
            <h2 className="text-xl font-semibold text-oa-text-primary">
              {prompt ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-64 px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-oa-accent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Prompt['category'] })}
                  className="w-full px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                >
                  <option value="system">System</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isGlobal"
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isGlobal" className="text-sm font-medium text-oa-text-primary">
                  Make global (available to all agents)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                placeholder="motivation, accountability, planning"
              />
            </div>
          </div>

          <div className="p-6 border-t border-oa-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
            >
              {prompt ? 'Update' : 'Create'} Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewPromptModal({
  prompt,
  onClose,
}: {
  prompt: Prompt
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-oa-border">
          <h2 className="text-xl font-semibold text-oa-text-primary">{prompt.name}</h2>
          <p className="text-sm text-oa-text-secondary mt-1">{prompt.description}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <pre className="bg-oa-bg-tertiary p-4 rounded-lg text-sm text-oa-text-primary font-mono whitespace-pre-wrap">
            {prompt.content}
          </pre>
        </div>

        <div className="p-6 border-t border-oa-border flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

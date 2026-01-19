'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Sparkles, Check } from 'lucide-react'
import type { Agent, AgentColor } from '@/types'
import type { Skill } from '@/types/skill'

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateAgent: (agent: Partial<Agent>) => Promise<void>
  onCreateSkill: () => void
}

// Color options for agents
const COLOR_OPTIONS: { value: AgentColor; label: string; bg: string; border: string }[] = [
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
  { value: 'green', label: 'Green', bg: 'bg-green-500', border: 'border-green-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', border: 'border-orange-500' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500', border: 'border-pink-500' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-500' },
]

// Emoji options for quick selection
const EMOJI_OPTIONS = [
  // Activity & Sports
  '🎯', '💪', '🏃', '🧘', '🏋️', '⚡', '🔥',
  // Work & Productivity
  '💼', '📊', '📈', '💡', '🎨', '✨', '🚀',
  // Learning & Education
  '📚', '🎓', '🧠', '💻', '📝', '🔬', '🎵',
  // Wellness & Health
  '🧘', '🌱', '💚', '🍎', '😊', '🌟', '❤️',
  // Communication
  '💬', '🤝', '👋', '🎤', '📣', '💭', '🗣️',
  // Fun
  '🤖', '🦾', '🎮', '🎲', '🌈', '⭐', '🏆',
]

export function CreateAgentModal({ isOpen, onClose, onCreateAgent, onCreateSkill }: CreateAgentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '🤖',
    description: '',
    color: 'purple' as AgentColor,
    skills: [] as string[],
  })
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingSkill, setIsCreatingSkill] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSkills()
    }
  }, [isOpen])

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/skills')
      const data = await response.json()
      setAvailableSkills(data.skills || [])
    } catch (error) {
      console.error('Failed to load skills:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onCreateAgent({
        name: formData.name,
        icon: formData.icon,
        description: formData.description,
        color: formData.color,
        skills: formData.skills,
      })

      // Reset form
      setFormData({
        name: '',
        icon: '🤖',
        description: '',
        color: 'purple',
        skills: [],
      })
      onClose()
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId]
    }))
  }

  const handleCreateNewSkill = () => {
    setIsCreatingSkill(true)
    onCreateSkill()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="p-6 border-b border-oa-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-oa-text-primary">
                Create New Agent
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-oa-text-secondary" />
              </button>
            </div>
            <p className="text-sm text-oa-text-secondary mt-2">
              Create a custom AI agent with specific skills and personality
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-oa-text-primary uppercase tracking-wide">
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  placeholder="e.g., Fitness Coach, Study Buddy, etc."
                  required
                />
              </div>

              {/* Icon/Emoji Picker */}
              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Choose an Icon
                </label>
                <div className="flex items-start gap-4">
                  {/* Selected icon preview */}
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 transition-all ${
                      COLOR_OPTIONS.find(c => c.value === formData.color)?.bg || 'bg-purple-500'
                    } shadow-lg`}
                  >
                    {formData.icon}
                  </div>
                  {/* Emoji grid */}
                  <div className="flex-1 grid grid-cols-7 gap-1.5 p-2 bg-oa-bg-tertiary rounded-lg border border-oa-border max-h-32 overflow-y-auto">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all hover:scale-110 ${
                          formData.icon === emoji
                            ? 'bg-oa-accent/30 ring-2 ring-oa-accent'
                            : 'hover:bg-oa-bg-secondary'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Custom emoji input */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-oa-text-secondary">Or type your own:</span>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value.slice(-2) })}
                    className="w-12 h-8 text-lg text-center bg-oa-bg-tertiary border border-oa-border rounded focus:outline-none focus:ring-2 focus:ring-oa-accent"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 px-3 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  placeholder="What does this agent help you with?"
                  required
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Agent Color
                </label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`
                        w-10 h-10 rounded-lg ${color.bg} transition-all duration-200
                        flex items-center justify-center
                        ${formData.color === color.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-oa-bg-primary scale-110'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                        }
                      `}
                      title={color.label}
                    >
                      {formData.color === color.value && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-oa-text-primary uppercase tracking-wide">
                  Select Skills ({formData.skills.length})
                </h3>
                <button
                  type="button"
                  onClick={handleCreateNewSkill}
                  className="flex items-center gap-2 px-3 py-1.5 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-accent hover:text-white hover:border-oa-accent transition-colors text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Create New Skill
                </button>
              </div>

              {availableSkills.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-oa-text-secondary mb-3">No skills available</p>
                  <button
                    type="button"
                    onClick={handleCreateNewSkill}
                    className="text-oa-accent hover:underline text-sm"
                  >
                    Create your first skill
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableSkills.map((skill) => {
                    const isSelected = formData.skills.includes(skill.id)
                    return (
                      <label
                        key={skill.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-oa-accent bg-oa-accent/5'
                            : 'border-oa-border hover:border-oa-accent/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSkill(skill.id)}
                          className="mt-1 w-4 h-4 rounded border-oa-border"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-oa-text-primary">
                              {skill.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              skill.category === 'health' ? 'bg-green-500/10 text-green-400' :
                              skill.category === 'productivity' ? 'bg-blue-500/10 text-blue-400' :
                              skill.category === 'learning' ? 'bg-purple-500/10 text-purple-400' :
                              skill.category === 'creative' ? 'bg-pink-500/10 text-pink-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {skill.category}
                            </span>
                          </div>
                          <p className="text-xs text-oa-text-secondary line-clamp-2">
                            {skill.description}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
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
              disabled={isLoading || !formData.name || !formData.description}
              className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

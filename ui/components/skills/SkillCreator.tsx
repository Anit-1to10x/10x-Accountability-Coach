'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { AnimatedButton } from '../ui/AnimatedButton'

interface SkillCreatorProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  onSkillCreated?: (skillId: string) => void
}

export function SkillCreator({ isOpen, onClose, agentId, onSkillCreated }: SkillCreatorProps) {
  const [step, setStep] = useState<'details' | 'instructions' | 'confirmation'>('details')
  const [loading, setLoading] = useState(false)
  const [skillData, setSkillData] = useState({
    name: '',
    description: '',
    category: 'custom' as 'productivity' | 'health' | 'learning' | 'creative' | 'custom',
    triggers: '',
    instructions: '',
    examples: ''
  })
  const [createdSkillId, setCreatedSkillId] = useState('')

  const handleCreate = async () => {
    if (!skillData.name || !skillData.description || !skillData.instructions) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/skills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: skillData.name,
          description: skillData.description,
          category: skillData.category,
          triggers: skillData.triggers.split(',').map(t => t.trim()).filter(Boolean),
          instructions: skillData.instructions,
          examples: skillData.examples.split('\n---\n').filter(Boolean),
          createdByAgentId: agentId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to create skill')
        return
      }

      setCreatedSkillId(data.skill.id)
      setStep('confirmation')

      if (onSkillCreated) {
        onSkillCreated(data.skill.id)
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to create skill:', error)
      alert('An error occurred while creating the skill')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('details')
    setSkillData({
      name: '',
      description: '',
      category: 'custom',
      triggers: '',
      instructions: '',
      examples: ''
    })
    setCreatedSkillId('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-oa-bg-primary border border-oa-border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-oa-border sticky top-0 bg-oa-bg-primary z-10">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-oa-text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold text-oa-text-primary">
                      Create New Skill
                    </h2>
                    <p className="text-sm text-oa-text-secondary mt-1">
                      This skill will be added to the marketplace and attached to this agent
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'details' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    {/* Skill Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Skill Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={skillData.name}
                        onChange={(e) => setSkillData({ ...skillData, name: e.target.value })}
                        placeholder="e.g., Python Code Reviewer"
                        className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg focus:outline-none focus:border-oa-text-primary"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={skillData.description}
                        onChange={(e) => setSkillData({ ...skillData, description: e.target.value })}
                        placeholder="What does this skill do? Be specific."
                        className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg focus:outline-none focus:border-oa-text-primary resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Category
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['productivity', 'health', 'learning', 'creative', 'custom'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSkillData({ ...skillData, category: cat as any })}
                            className={`px-3 py-2 rounded-lg border text-sm capitalize transition-all ${
                              skillData.category === cat
                                ? 'border-oa-text-primary bg-oa-bg-secondary'
                                : 'border-oa-border hover:border-oa-text-secondary'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Triggers */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Triggers (Optional)
                      </label>
                      <input
                        type="text"
                        value={skillData.triggers}
                        onChange={(e) => setSkillData({ ...skillData, triggers: e.target.value })}
                        placeholder="e.g., review, code review, check code (comma-separated)"
                        className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg focus:outline-none focus:border-oa-text-primary"
                      />
                      <p className="text-xs text-oa-text-secondary mt-1">
                        Keywords that will automatically activate this skill in chat
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <AnimatedButton onClick={handleClose} variant="secondary">
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => setStep('instructions')}
                        variant="primary"
                        disabled={!skillData.name || !skillData.description}
                      >
                        Next: Instructions
                      </AnimatedButton>
                    </div>
                  </motion.div>
                )}

                {step === 'instructions' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    {/* Instructions */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Instructions <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={skillData.instructions}
                        onChange={(e) => setSkillData({ ...skillData, instructions: e.target.value })}
                        placeholder="How should the agent use this skill? What should it do when triggered?"
                        className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg focus:outline-none focus:border-oa-text-primary resize-none font-mono text-sm"
                        rows={12}
                      />
                      <p className="text-xs text-oa-text-secondary mt-1">
                        Be detailed - this is what the agent will follow
                      </p>
                    </div>

                    {/* Examples */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Examples (Optional)
                      </label>
                      <textarea
                        value={skillData.examples}
                        onChange={(e) => setSkillData({ ...skillData, examples: e.target.value })}
                        placeholder="Provide example inputs/outputs. Separate multiple examples with '---'"
                        className="w-full px-3 py-2 bg-oa-bg-primary border border-oa-border rounded-lg focus:outline-none focus:border-oa-text-primary resize-none text-sm"
                        rows={6}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <AnimatedButton onClick={() => setStep('details')} variant="secondary">
                        Back
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={handleCreate}
                        variant="primary"
                        disabled={!skillData.instructions || loading}
                        icon={loading ? Loader2 : undefined}
                      >
                        {loading ? 'Creating...' : 'Create Skill'}
                      </AnimatedButton>
                    </div>
                  </motion.div>
                )}

                {step === 'confirmation' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Skill Created!</h3>
                    <p className="text-oa-text-secondary mb-4">
                      <span className="font-medium">{skillData.name}</span> has been added to the marketplace
                    </p>
                    <div className="text-sm text-oa-text-secondary space-y-1">
                      <p>✓ Added to Skills Marketplace</p>
                      <p>✓ Attached to this agent</p>
                      <p>✓ Other agents can add it later</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

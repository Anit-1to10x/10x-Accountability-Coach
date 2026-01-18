'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image, Target, Heart, Sparkles, Layout, Check, ChevronRight, Upload, Plus, Trash2 } from 'lucide-react'
import type { VisionBoard, VisionBoardGoal, VisionBoardImage } from '@/types/visionboard'

interface VisionBoardWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (visionboard: VisionBoard) => Promise<void>
  agentId: string
}

const GOAL_CATEGORIES = [
  { value: 'career', label: 'Career & Professional', icon: '💼' },
  { value: 'health', label: 'Health & Fitness', icon: '💪' },
  { value: 'relationships', label: 'Relationships & Social', icon: '❤️' },
  { value: 'personal', label: 'Personal Growth', icon: '🌱' },
  { value: 'financial', label: 'Financial & Wealth', icon: '💰' },
  { value: 'creative', label: 'Creative & Hobbies', icon: '🎨' },
  { value: 'custom', label: 'Custom', icon: '✨' },
]

const THEMES = [
  { value: 'dark', label: 'Dark Mode', preview: 'bg-gray-900 text-white' },
  { value: 'light', label: 'Light Mode', preview: 'bg-white text-gray-900' },
  { value: 'gradient', label: 'Gradient', preview: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' },
]

const LAYOUTS = [
  { value: 'grid', label: 'Grid', description: 'Organized grid layout', icon: Layout },
  { value: 'masonry', label: 'Masonry', description: 'Pinterest-style layout', icon: Layout },
  { value: 'collage', label: 'Collage', description: 'Free-form collage', icon: Sparkles },
]

export function VisionBoardWizard({ isOpen, onClose, onComplete, agentId }: VisionBoardWizardProps) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goals, setGoals] = useState<VisionBoardGoal[]>([])
  const [newGoal, setNewGoal] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('personal')
  const [affirmations, setAffirmations] = useState<string[]>([])
  const [newAffirmation, setNewAffirmation] = useState('')
  const [images, setImages] = useState<VisionBoardImage[]>([])
  const [theme, setTheme] = useState<'dark' | 'light' | 'gradient'>('dark')
  const [layout, setLayout] = useState<'grid' | 'masonry' | 'collage'>('grid')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddGoal = () => {
    if (!newGoal.trim()) return

    const goal: VisionBoardGoal = {
      id: `goal-${Date.now()}`,
      text: newGoal,
      category: selectedCategory as any,
      achieved: false,
    }

    setGoals([...goals, goal])
    setNewGoal('')
  }

  const handleRemoveGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id))
  }

  const handleAddAffirmation = () => {
    if (!newAffirmation.trim()) return
    setAffirmations([...affirmations, newAffirmation])
    setNewAffirmation('')
  }

  const handleRemoveAffirmation = (index: number) => {
    setAffirmations(affirmations.filter((_, i) => i !== index))
  }

  const [uploadingImages, setUploadingImages] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const uploadedImages: VisionBoardImage[] = []

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'images')

        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedImages.push({
            id: `image-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            url: data.url,
            addedAt: new Date().toISOString(),
          })
        }
      }

      setImages([...images, ...uploadedImages])
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      alert('Please enter a prompt for the image')
      return
    }

    setGeneratingImage(true)
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        const newImage: VisionBoardImage = {
          id: `image-${Date.now()}`,
          url: data.url,
          caption: imagePrompt,
          addedAt: new Date().toISOString(),
        }
        setImages([...images, newImage])
        setImagePrompt('')
      } else {
        alert(data.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Image generation failed:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages(images.filter(img => img.id !== id))
  }

  const handleComplete = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your vision board')
      return
    }

    const visionboard: VisionBoard = {
      id: `vb-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      agentId,
      images,
      goals,
      affirmations,
      theme,
      layout,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      setIsLoading(true)
      await onComplete(visionboard)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to create vision board:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setTitle('')
    setDescription('')
    setGoals([])
    setAffirmations([])
    setImages([])
    setTheme('dark')
    setLayout('grid')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const totalSteps = 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-oa-border">
          <div>
            <h2 className="text-2xl font-semibold text-oa-text-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-oa-accent" />
              Create Vision Board
            </h2>
            <p className="text-sm text-oa-text-secondary mt-1">
              Step {step} of {totalSteps}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-oa-text-secondary" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i < step ? 'bg-oa-accent' : 'bg-oa-bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-oa-text-primary mb-2">
                    Vision Board Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My 2025 Goals"
                    className="w-full px-4 py-3 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder:text-oa-text-muted focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-oa-text-primary mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this vision board represents..."
                    rows={4}
                    className="w-full px-4 py-3 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder:text-oa-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-oa-text-secondary">
                  Add goals you want to achieve. Be specific!
                </p>

                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  >
                    {GOAL_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                    placeholder="Enter a goal..."
                    className="flex-1 px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder:text-oa-text-muted focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  />

                  <button
                    onClick={handleAddGoal}
                    className="px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-3 bg-oa-bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Target className="w-4 h-4 text-oa-accent flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-oa-text-primary">{goal.text}</p>
                          <p className="text-xs text-oa-text-muted">
                            {GOAL_CATEGORIES.find(c => c.value === goal.category)?.label}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveGoal(goal.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>

                {goals.length === 0 && (
                  <div className="text-center py-8 text-oa-text-muted">
                    No goals added yet. Add your first goal above!
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Affirmations */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-oa-text-secondary">
                  Add positive affirmations to keep you motivated
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAffirmation}
                    onChange={(e) => setNewAffirmation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAffirmation()}
                    placeholder="I am capable of achieving my goals..."
                    className="flex-1 px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder:text-oa-text-muted focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  />

                  <button
                    onClick={handleAddAffirmation}
                    className="px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {affirmations.map((affirmation, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-oa-bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Heart className="w-4 h-4 text-pink-400 flex-shrink-0" />
                        <p className="text-sm text-oa-text-primary italic">&quot;{affirmation}&quot;</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAffirmation(index)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>

                {affirmations.length === 0 && (
                  <div className="text-center py-8 text-oa-text-muted">
                    No affirmations added yet. Add your first affirmation above!
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-oa-text-secondary">
                  Add inspirational images to your vision board
                </p>

                {/* Upload Section */}
                <label className="block">
                  <div className={`border-2 border-dashed border-oa-border rounded-lg p-8 text-center hover:border-oa-accent transition-colors ${uploadingImages ? 'opacity-50' : 'cursor-pointer'}`}>
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-oa-accent border-t-transparent mx-auto mb-3"></div>
                        <p className="text-sm text-oa-text-primary">Uploading images...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-3 text-oa-text-muted" />
                        <p className="text-sm text-oa-text-primary mb-1">Click to upload images</p>
                        <p className="text-xs text-oa-text-muted">PNG, JPG up to 10MB each</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                </label>

                {/* AI Image Generation Section */}
                <div className="border border-oa-border rounded-lg p-4 bg-oa-bg-secondary/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-oa-accent" />
                    <span className="text-sm font-medium text-oa-text-primary">Generate with AI</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !generatingImage && handleGenerateImage()}
                      placeholder="Describe the image you want to create..."
                      disabled={generatingImage}
                      className="flex-1 px-4 py-2 bg-oa-bg-primary border border-oa-border rounded-lg text-oa-text-primary placeholder:text-oa-text-muted focus:outline-none focus:ring-2 focus:ring-oa-accent disabled:opacity-50"
                    />
                    <button
                      onClick={handleGenerateImage}
                      disabled={generatingImage || !imagePrompt.trim()}
                      className="px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {generatingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.caption || ''}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {image.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate rounded-b-lg">
                          {image.caption}
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveImage(image.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {images.length === 0 && (
                  <div className="text-center py-8 text-oa-text-muted">
                    No images added yet. Upload images or generate with AI!
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: Customization */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-oa-text-primary mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTheme(t.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === t.value
                            ? 'border-oa-accent'
                            : 'border-oa-border hover:border-oa-accent/50'
                        }`}
                      >
                        <div className={`h-20 rounded mb-2 ${t.preview}`} />
                        <p className="text-sm text-oa-text-primary">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-oa-text-primary mb-3">
                    Layout
                  </label>
                  <div className="space-y-2">
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLayout(l.value as any)}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          layout === l.value
                            ? 'border-oa-accent bg-oa-accent/10'
                            : 'border-oa-border hover:border-oa-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <l.icon className="w-5 h-5 text-oa-accent" />
                          <div>
                            <p className="font-medium text-oa-text-primary">{l.label}</p>
                            <p className="text-sm text-oa-text-secondary">{l.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-oa-border flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            className="px-6 py-3 border border-oa-border rounded-lg hover:bg-oa-bg-secondary transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !title.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isLoading || !title.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Vision Board
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

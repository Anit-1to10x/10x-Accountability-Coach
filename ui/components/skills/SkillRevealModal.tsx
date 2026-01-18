'use client'

import React, { useEffect, useState } from 'react'
import { X, Sparkles, Gift, ChevronRight, Package } from 'lucide-react'
import type { Skill } from '@/types/skill'

interface SkillRevealModalProps {
  skills: Skill[]
  isOpen: boolean
  onClose: () => void
  onViewSkill?: (skillId: string) => void
}

// Confetti particle component
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-sm animate-confetti"
      style={{
        backgroundColor: color,
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}ms`,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  )
}

export function SkillRevealModal({ skills, isOpen, onClose, onViewSkill }: SkillRevealModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && skills.length > 0) {
      setShowConfetti(true)
      setCurrentSkillIndex(0)

      // Stop confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, skills])

  if (!isOpen || skills.length === 0) return null

  const currentSkill = skills[currentSkillIndex]
  const hasMultipleSkills = skills.length > 1
  const isPackReveal = skills.every(s => s.pack && s.pack === skills[0]?.pack)

  const handleNext = () => {
    if (currentSkillIndex < skills.length - 1) {
      setCurrentSkillIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const handleViewSkill = () => {
    if (onViewSkill && currentSkill) {
      onViewSkill(currentSkill.id)
      onClose()
    }
  }

  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F59E0B', '#10B981']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {/* Confetti container */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 50}
              color={confettiColors[i % confettiColors.length]}
            />
          ))}
        </div>
      )}

      <div className="relative bg-gradient-to-b from-oa-bg-primary to-oa-bg-secondary border border-oa-accent/30 rounded-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-oa-accent/10 to-transparent pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-oa-bg-tertiary rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-oa-text-secondary" />
        </button>

        {/* Header with icon */}
        <div className="relative pt-8 pb-4 px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-oa-accent to-purple-600 mb-4 animate-pulse-glow">
            {isPackReveal ? (
              <Package className="w-10 h-10 text-white" />
            ) : (
              <Gift className="w-10 h-10 text-white" />
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-sparkle" />
            <h2 className="text-2xl font-bold text-oa-text-primary">
              {isPackReveal ? 'Pack Unlocked!' : 'Skill Unlocked!'}
            </h2>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-sparkle" />
          </div>

          {hasMultipleSkills && (
            <p className="text-sm text-oa-text-secondary">
              {currentSkillIndex + 1} of {skills.length} skills
            </p>
          )}
        </div>

        {/* Skill content */}
        <div className="px-6 pb-6">
          {/* Pack badge */}
          {currentSkill.pack && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1 bg-oa-accent/10 text-oa-accent text-sm font-medium rounded-full">
                {currentSkill.packDisplayName || currentSkill.pack}
              </span>
              {currentSkill.packValue && (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm font-medium rounded-full">
                  {currentSkill.packValue} Value
                </span>
              )}
            </div>
          )}

          {/* Skill card */}
          <div className="bg-oa-bg-tertiary border border-oa-border rounded-xl p-5 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-oa-accent/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-oa-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-oa-text-primary mb-1">
                  {currentSkill.name}
                </h3>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${
                  currentSkill.category === 'health' ? 'bg-green-500/10 text-green-400' :
                  currentSkill.category === 'productivity' ? 'bg-blue-500/10 text-blue-400' :
                  currentSkill.category === 'learning' ? 'bg-purple-500/10 text-purple-400' :
                  currentSkill.category === 'creative' ? 'bg-pink-500/10 text-pink-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}>
                  {currentSkill.category}
                </span>
                <p className="text-sm text-oa-text-secondary line-clamp-3">
                  {currentSkill.description}
                </p>
              </div>
            </div>
          </div>

          {/* Reveal message */}
          {currentSkill.revealMessage && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-yellow-400 italic">
                "{currentSkill.revealMessage}"
              </p>
            </div>
          )}

          {/* Day badge */}
          <div className="text-center mb-6">
            <span className="text-xs text-oa-text-secondary">
              Unlocked on Day {currentSkill.unlockDay}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleViewSkill}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-tertiary transition-colors"
            >
              View Skill
            </button>
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
            >
              {currentSkillIndex < skills.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                'Got it!'
              )}
            </button>
          </div>
        </div>

        {/* Progress dots for multiple skills */}
        {hasMultipleSkills && (
          <div className="flex items-center justify-center gap-2 pb-6">
            {skills.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSkillIndex
                    ? 'bg-oa-accent'
                    : index < currentSkillIndex
                    ? 'bg-oa-accent/50'
                    : 'bg-oa-border'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

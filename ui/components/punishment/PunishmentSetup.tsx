'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Zap, Skull, Heart, DollarSign, MessageCircle, X, Check } from 'lucide-react'
import type { Punishment } from '@/types/streak'

interface PunishmentSetupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (punishment: Omit<Punishment, 'id' | 'status'>) => Promise<void>
  challengeId?: string
  challengeName?: string
}

const TRIGGER_OPTIONS = [
  { type: 'streak_days', label: 'Streak Break', description: 'When you miss consecutive days', icon: Zap },
  { type: 'missed_count', label: 'Missed Check-ins', description: 'After missing X check-ins total', icon: AlertTriangle },
  { type: 'deadline', label: 'Deadline Miss', description: 'When you miss a deadline', icon: Skull },
]

const CONSEQUENCE_TYPES = [
  { type: 'message', label: 'Shame Message', description: 'Receive a stern reminder', severity: 'mild', icon: MessageCircle },
  { type: 'restriction', label: 'Feature Restriction', description: 'Lose access to certain features', severity: 'moderate', icon: AlertTriangle },
  { type: 'donation', label: 'Donation Pledge', description: 'Donate to charity or cause', severity: 'severe', icon: DollarSign },
  { type: 'public_shame', label: 'Public Accountability', description: 'Post confession to social media', severity: 'severe', icon: Skull },
  { type: 'custom', label: 'Custom Punishment', description: 'Define your own consequence', severity: 'moderate', icon: Heart },
]

export function PunishmentSetup({
  isOpen,
  onClose,
  onSave,
  challengeId,
  challengeName
}: PunishmentSetupProps) {
  const [step, setStep] = useState(1)
  const [triggerType, setTriggerType] = useState<string>('')
  const [triggerValue, setTriggerValue] = useState(3)
  const [consequenceType, setConsequenceType] = useState<string>('')
  const [customDescription, setCustomDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!triggerType || !consequenceType) return

    const selectedConsequence = CONSEQUENCE_TYPES.find(c => c.type === consequenceType)

    const punishment: Omit<Punishment, 'id' | 'status'> = {
      type: triggerType === 'streak_days' ? 'streak_break' :
            triggerType === 'missed_count' ? 'missed_todo' : 'deadline_missed',
      trigger: {
        type: triggerType as any,
        value: triggerValue,
      },
      consequence: {
        type: consequenceType as any,
        description: consequenceType === 'custom' ? customDescription :
          getDefaultDescription(consequenceType, triggerValue, triggerType),
        severity: selectedConsequence?.severity as any || 'moderate',
      },
    }

    try {
      setIsSaving(true)
      await onSave(punishment)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to save punishment:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getDefaultDescription = (type: string, value: number, trigger: string): string => {
    const triggerText = trigger === 'streak_days' ? `missing ${value} consecutive days` :
                        trigger === 'missed_count' ? `missing ${value} check-ins` : 'missing a deadline'

    switch (type) {
      case 'message':
        return `Receive a stern accountability message for ${triggerText}`
      case 'restriction':
        return `Lose access to streak badges and rewards for 24 hours after ${triggerText}`
      case 'donation':
        return `Donate $10 to a charity of your choice for ${triggerText}`
      case 'public_shame':
        return `Post a confession about ${triggerText} to your social media`
      default:
        return ''
    }
  }

  const resetForm = () => {
    setStep(1)
    setTriggerType('')
    setTriggerValue(3)
    setConsequenceType('')
    setCustomDescription('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-oa-border">
          <div>
            <h2 className="text-xl font-semibold text-oa-text-primary">
              Setup Punishment
            </h2>
            {challengeName && (
              <p className="text-sm text-oa-text-secondary mt-1">
                For: {challengeName}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-oa-text-secondary" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s <= step
                      ? 'bg-oa-accent text-white'
                      : 'bg-oa-bg-secondary text-oa-text-secondary'
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      s < step ? 'bg-oa-accent' : 'bg-oa-bg-secondary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-oa-text-secondary">
            <span>Trigger</span>
            <span>Threshold</span>
            <span>Consequence</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-oa-text-secondary mb-4">
                  What should trigger the punishment?
                </p>
                {TRIGGER_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      setTriggerType(option.type)
                      setStep(2)
                    }}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      triggerType === option.type
                        ? 'border-oa-accent bg-oa-accent/10'
                        : 'border-oa-border hover:border-oa-accent/50 hover:bg-oa-bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="w-5 h-5 text-oa-accent" />
                      <div>
                        <div className="font-medium text-oa-text-primary">
                          {option.label}
                        </div>
                        <div className="text-sm text-oa-text-secondary">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-oa-text-secondary">
                  {triggerType === 'streak_days'
                    ? 'How many consecutive days before punishment triggers?'
                    : triggerType === 'missed_count'
                    ? 'How many missed check-ins before punishment triggers?'
                    : 'Configure deadline trigger'}
                </p>

                <div className="flex items-center gap-4 justify-center py-8">
                  <button
                    onClick={() => setTriggerValue(Math.max(1, triggerValue - 1))}
                    className="w-12 h-12 rounded-full border border-oa-border text-2xl hover:bg-oa-bg-secondary transition-colors"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-oa-accent">
                      {triggerValue}
                    </div>
                    <div className="text-sm text-oa-text-secondary mt-1">
                      {triggerType === 'streak_days' ? 'days' : 'times'}
                    </div>
                  </div>
                  <button
                    onClick={() => setTriggerValue(triggerValue + 1)}
                    className="w-12 h-12 rounded-full border border-oa-border text-2xl hover:bg-oa-bg-secondary transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-oa-border rounded-lg hover:bg-oa-bg-secondary transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-oa-text-secondary mb-4">
                  What&apos;s the consequence?
                </p>
                {CONSEQUENCE_TYPES.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setConsequenceType(option.type)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      consequenceType === option.type
                        ? 'border-oa-accent bg-oa-accent/10'
                        : 'border-oa-border hover:border-oa-accent/50 hover:bg-oa-bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        option.severity === 'mild' ? 'bg-yellow-500/20' :
                        option.severity === 'moderate' ? 'bg-orange-500/20' : 'bg-red-500/20'
                      }`}>
                        <option.icon className={`w-4 h-4 ${
                          option.severity === 'mild' ? 'text-yellow-400' :
                          option.severity === 'moderate' ? 'text-orange-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-oa-text-primary">
                            {option.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            option.severity === 'mild' ? 'bg-yellow-500/20 text-yellow-400' :
                            option.severity === 'moderate' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {option.severity}
                          </span>
                        </div>
                        <div className="text-sm text-oa-text-secondary">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {consequenceType === 'custom' && (
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Describe your custom punishment..."
                    className="w-full p-3 mt-3 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder:text-oa-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-oa-accent"
                    rows={3}
                  />
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 border border-oa-border rounded-lg hover:bg-oa-bg-secondary transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!consequenceType || (consequenceType === 'custom' && !customDescription) || isSaving}
                    className="flex-1 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Punishment'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

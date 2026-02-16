'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Check } from 'lucide-react'
import { useState } from 'react'
import { AnimatedButton } from '../ui/AnimatedButton'

interface LateCheckinDialogProps {
  hoursLate: number
  onAccept: () => void
  onCancel: () => void
}

export function LateCheckinDialog({ hoursLate, onAccept, onCancel }: LateCheckinDialogProps) {
  const [aiAccepted, setAiAccepted] = useState(false)

  const handleSubmit = () => {
    if (aiAccepted) {
      onAccept()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/10 backdrop-blur-md border border-orange-500/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-500/20 rounded-full">
            <AlertTriangle className="w-12 h-12 text-orange-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-4 text-white">
          Late Check-In Detected
        </h2>

        {/* Message */}
        <div className="text-center mb-6 space-y-3">
          <p className="text-gray-300">
            This check-in is <span className="font-bold text-orange-400">{hoursLate} hours late</span>.
          </p>
          <p className="text-sm text-gray-400">
            To maintain accountability, please confirm that you actually completed these tasks.
          </p>
        </div>

        {/* AI Acceptance Checkbox */}
        <div
          className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl mb-6 cursor-pointer hover:bg-white/10 transition-colors"
          onClick={() => setAiAccepted(!aiAccepted)}
        >
          <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            aiAccepted
              ? 'bg-green-500 border-green-500'
              : 'border-gray-500'
          }`}>
            {aiAccepted && <Check className="w-4 h-4 text-white" />}
          </div>
          <label className="text-sm text-gray-300 cursor-pointer select-none">
            I confirm that I actually completed these tasks on time, and I understand that late check-ins should be the exception, not the rule.
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <AnimatedButton
            onClick={handleSubmit}
            disabled={!aiAccepted}
            variant="primary"
            className="flex-1"
          >
            Accept & Check In
          </AnimatedButton>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          Consistent late check-ins may trigger accountability measures
        </p>
      </motion.div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface LoadingStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete' | 'error'
}

interface LoadingScreenProps {
  steps: LoadingStep[]
}

export default function LoadingScreen({ steps }: LoadingScreenProps) {
  const currentStep = useMemo(() => {
    const loadingIndex = steps.findIndex((s) => s.status === 'loading')
    const completeCount = steps.filter((s) => s.status === 'complete').length
    return loadingIndex !== -1 ? loadingIndex : completeCount
  }, [steps])

  return (
    <div className="min-h-screen flex items-center justify-center bg-oa-bg-primary relative overflow-hidden">
      {/* Background gradient orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-oa-accent/20 to-blue-500/20 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-md w-full px-6 relative z-10"
      >
        {/* 10X Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-oa-accent to-blue-500 flex items-center justify-center shadow-lg shadow-oa-accent/30"
            animate={{
              boxShadow: [
                '0 10px 40px -10px rgba(139, 92, 246, 0.3)',
                '0 10px 60px -10px rgba(139, 92, 246, 0.5)',
                '0 10px 40px -10px rgba(139, 92, 246, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.span
              className="text-4xl font-black text-white tracking-tight"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              10X
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-oa-text-primary mb-1"
          >
            Accountability Coach
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-oa-text-secondary"
          >
            by Team 10X
          </motion.p>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-oa-accent"
                animate={{
                  y: [0, -12, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Loading Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.7 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-oa-bg-secondary/50"
            >
              {step.status === 'complete' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}
              {step.status === 'loading' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-oa-accent border-t-transparent rounded-full flex-shrink-0"
                />
              )}
              {step.status === 'pending' && (
                <div className="w-5 h-5 rounded-full border-2 border-oa-border flex-shrink-0" />
              )}
              {step.status === 'error' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.div>
              )}
              <span
                className={`text-sm ${
                  step.status === 'complete'
                    ? 'text-oa-text-secondary line-through'
                    : step.status === 'loading'
                    ? 'text-oa-text-primary font-medium'
                    : step.status === 'error'
                    ? 'text-red-500'
                    : 'text-oa-text-secondary'
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <div className="w-full bg-oa-bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-oa-accent to-blue-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-oa-text-secondary mt-2">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

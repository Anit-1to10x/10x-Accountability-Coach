'use client'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  HardDrive,
  Cloud,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Folder,
  Settings,
  ArrowRight,
  Info,
} from 'lucide-react'

// Lazy load SupabaseSetup
const SupabaseSetup = lazy(() => import('./SupabaseSetup').then(mod => ({ default: mod.SupabaseSetup })))

interface DataSourceStatus {
  source: 'local' | 'supabase'
  lastUpdated: string | null
  supabase: {
    configured: boolean
    url: string | null
  }
  local: {
    path: string
  }
}

export function DataSourceToggle() {
  const [status, setStatus] = useState<DataSourceStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/data-source')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to load data source status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const switchSource = async (source: 'local' | 'supabase') => {
    if (status?.source === source) return

    try {
      setIsSwitching(true)
      setError(null)

      const res = await fetch('/api/data-source', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to switch data source')
      }

      setStatus(prev => prev ? { ...prev, source: data.source } : null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSwitching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-6 h-6 text-oa-accent" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Architecture Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
      >
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm text-blue-400 font-medium">How Data Storage Works</p>
          <p className="text-xs text-blue-300/80">
            <strong>Local files are always the source of truth.</strong> MCP servers read from local directory.
            Supabase syncs activities for cross-device access. API writes go to both local and cloud when enabled.
          </p>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Mode Toggle */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-oa-text-primary">Activity Sync Mode</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Only Option */}
          <motion.button
            onClick={() => switchSource('local')}
            disabled={isSwitching}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              status?.source === 'local'
                ? 'border-oa-accent bg-oa-accent/5'
                : 'border-oa-border hover:border-oa-accent/50 bg-oa-bg-secondary'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection Indicator */}
            <AnimatePresence>
              {status?.source === 'local' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-3 right-3 w-6 h-6 bg-oa-accent rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-xl ${
                status?.source === 'local'
                  ? 'bg-oa-accent/10 text-oa-accent'
                  : 'bg-oa-bg-tertiary text-oa-text-secondary'
              }`}>
                <HardDrive className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-oa-text-primary mb-1">Local Only</h4>
                <p className="text-xs text-oa-text-secondary mb-3">
                  All data stays on your machine. No cloud sync.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Folder className="w-3 h-3 text-oa-text-secondary" />
                  <code className="px-2 py-0.5 bg-oa-bg-tertiary rounded text-oa-text-secondary">
                    {status?.local.path || './data'}
                  </code>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-oa-border space-y-2">
              <div className="flex items-center gap-2 text-xs text-green-400">
                <Check className="w-3 h-3" />
                <span>Complete privacy</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-400">
                <Check className="w-3 h-3" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-400">
                <Check className="w-3 h-3" />
                <span>No external dependencies</span>
              </div>
            </div>
          </motion.button>

          {/* Cloud Sync Option */}
          <motion.button
            onClick={() => status?.supabase.configured && switchSource('supabase')}
            disabled={isSwitching || !status?.supabase.configured}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              status?.source === 'supabase'
                ? 'border-oa-accent bg-oa-accent/5'
                : status?.supabase.configured
                ? 'border-oa-border hover:border-oa-accent/50 bg-oa-bg-secondary'
                : 'border-oa-border bg-oa-bg-secondary opacity-60 cursor-not-allowed'
            }`}
            whileHover={status?.supabase.configured ? { scale: 1.02 } : {}}
            whileTap={status?.supabase.configured ? { scale: 0.98 } : {}}
          >
            {/* Selection Indicator */}
            <AnimatePresence>
              {status?.source === 'supabase' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-3 right-3 w-6 h-6 bg-oa-accent rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-xl ${
                status?.source === 'supabase'
                  ? 'bg-oa-accent/10 text-oa-accent'
                  : 'bg-oa-bg-tertiary text-oa-text-secondary'
              }`}>
                <Cloud className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-oa-text-primary mb-1">Local + Cloud Sync</h4>
                <p className="text-xs text-oa-text-secondary mb-3">
                  {status?.supabase.configured
                    ? 'Activities sync to Supabase for cross-device access'
                    : 'Set up Supabase to enable cloud sync'}
                </p>
                {status?.supabase.configured && status.supabase.url && (
                  <div className="flex items-center gap-2 text-xs">
                    <Cloud className="w-3 h-3 text-oa-text-secondary" />
                    <code className="px-2 py-0.5 bg-oa-bg-tertiary rounded text-oa-text-secondary truncate max-w-[200px]">
                      {status.supabase.url}
                    </code>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-oa-border space-y-2">
              {status?.supabase.configured ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Check className="w-3 h-3" />
                    <span>Cross-device sync</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Check className="w-3 h-3" />
                    <span>Automatic backups</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-oa-text-secondary">
                    <HardDrive className="w-3 h-3" />
                    <span>Local files still primary</span>
                  </div>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSetup(true)
                  }}
                  className="flex items-center gap-2 text-xs text-oa-accent hover:text-oa-accent-hover"
                >
                  <Settings className="w-3 h-3" />
                  <span>Set up Supabase</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.button>
        </div>
      </div>

      {/* Switching Indicator */}
      <AnimatePresence>
        {isSwitching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-center gap-2 text-sm text-oa-accent"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            Switching sync mode...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supabase Setup Section */}
      <AnimatePresence>
        {(showSetup || !status?.supabase.configured) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-oa-border">
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-oa-accent animate-spin" />
                </div>
              }>
                <SupabaseSetup />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architecture Note */}
      <div className="p-3 bg-oa-bg-secondary/50 border border-oa-border rounded-lg">
        <p className="text-xs text-oa-text-secondary">
          <strong className="text-oa-text-primary">Architecture:</strong> Local files → MCP reads → API writes → Supabase syncs activities.
          MCP servers always use the local directory. Supabase is for activity sync only.
        </p>
      </div>
    </div>
  )
}

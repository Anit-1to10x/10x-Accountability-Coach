'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud,
  Check,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  Database,
  Key,
  Link,
  ChevronRight,
  ChevronDown,
  Shield,
  Zap,
} from 'lucide-react'

interface SetupStatus {
  configured: boolean
  source: 'config_file' | 'env' | 'none'
  url: string | null
  schemaVersion: number
  lastMigration: string | null
  hasSchema: boolean
}

type SetupStep = 'credentials' | 'schema' | 'complete'

export function SupabaseSetup() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<SetupStep>('credentials')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [serviceRoleKey, setServiceRoleKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Schema state
  const [schemaContent, setSchemaContent] = useState('')
  const [schemaCopied, setSchemaCopied] = useState(false)
  const [showSchema, setShowSchema] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/supabase/setup')
      const data = await res.json()
      setStatus(data)

      if (data.configured && data.schemaVersion > 0) {
        setCurrentStep('complete')
      } else if (data.configured) {
        setCurrentStep('schema')
      }
    } catch (err) {
      console.error('Failed to load Supabase status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCredentials = async () => {
    if (!url || !anonKey) {
      setError('Supabase URL and Anon Key are required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const res = await fetch('/api/supabase/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, anonKey, serviceRoleKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save credentials')
      }

      setSuccess('Credentials saved successfully!')
      setCurrentStep('schema')
      await loadStatus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const loadSchema = async () => {
    try {
      const res = await fetch('/api/supabase/schema')
      const data = await res.json()
      setSchemaContent(data.schema)
      setShowSchema(true)
    } catch (err) {
      console.error('Failed to load schema:', err)
    }
  }

  const copySchema = async () => {
    await navigator.clipboard.writeText(schemaContent)
    setSchemaCopied(true)
    setTimeout(() => setSchemaCopied(false), 2000)
  }

  const markSchemaComplete = async () => {
    try {
      setIsSaving(true)
      const res = await fetch('/api/supabase/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaVersion: 1 }),
      })

      if (res.ok) {
        setSuccess('Setup complete!')
        setCurrentStep('complete')
        await loadStatus()
      }
    } catch (err) {
      console.error('Failed to mark complete:', err)
    } finally {
      setIsSaving(false)
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
          <Cloud className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold text-oa-text-primary">Supabase Setup</h3>
          <p className="text-xs text-oa-text-secondary">
            Connect your Supabase project for cloud sync
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        status?.configured && status.schemaVersion > 0
          ? 'bg-green-500/10 border border-green-500/20'
          : status?.configured
          ? 'bg-yellow-500/10 border border-yellow-500/20'
          : 'bg-oa-bg-secondary border border-oa-border'
      }`}>
        {status?.configured && status.schemaVersion > 0 ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Supabase fully configured</span>
          </>
        ) : status?.configured ? (
          <>
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">Schema migration required</span>
          </>
        ) : (
          <>
            <Database className="w-4 h-4 text-oa-text-secondary" />
            <span className="text-sm text-oa-text-secondary">Not configured</span>
          </>
        )}
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <X className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {['credentials', 'schema', 'complete'].map((step, i) => (
          <React.Fragment key={step}>
            <motion.div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step
                  ? 'bg-oa-accent text-white'
                  : i < ['credentials', 'schema', 'complete'].indexOf(currentStep)
                  ? 'bg-green-500 text-white'
                  : 'bg-oa-bg-tertiary text-oa-text-secondary'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {i < ['credentials', 'schema', 'complete'].indexOf(currentStep) ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </motion.div>
            {i < 2 && (
              <div className={`flex-1 h-0.5 ${
                i < ['credentials', 'schema', 'complete'].indexOf(currentStep)
                  ? 'bg-green-500'
                  : 'bg-oa-border'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'credentials' && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h4 className="font-medium text-oa-text-primary flex items-center gap-2">
              <Key className="w-4 h-4 text-oa-accent" />
              Step 1: Enter Supabase Credentials
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Project URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-oa-text-secondary" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full pl-10 pr-4 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Anon Key (public)
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-4 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Service Role Key (optional, for migrations)
                </label>
                <input
                  type="password"
                  value={serviceRoleKey}
                  onChange={(e) => setServiceRoleKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-4 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                />
                <p className="text-xs text-oa-text-secondary mt-1">
                  Find these in Supabase Dashboard → Settings → API
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleSaveCredentials}
              disabled={isSaving || !url || !anonKey}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-oa-accent hover:text-oa-accent-hover"
            >
              <ExternalLink className="w-4 h-4" />
              Open Supabase Dashboard
            </a>
          </motion.div>
        )}

        {currentStep === 'schema' && (
          <motion.div
            key="schema"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h4 className="font-medium text-oa-text-primary flex items-center gap-2">
              <Database className="w-4 h-4 text-oa-accent" />
              Step 2: Run Database Schema
            </h4>

            <div className="p-4 bg-oa-bg-tertiary rounded-lg border border-oa-border">
              <ol className="space-y-3 text-sm text-oa-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-oa-accent/20 text-oa-accent rounded-full flex items-center justify-center text-xs">1</span>
                  <span>Go to Supabase Dashboard → SQL Editor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-oa-accent/20 text-oa-accent rounded-full flex items-center justify-center text-xs">2</span>
                  <span>Click "New Query"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-oa-accent/20 text-oa-accent rounded-full flex items-center justify-center text-xs">3</span>
                  <span>Paste the schema SQL (copy below)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-oa-accent/20 text-oa-accent rounded-full flex items-center justify-center text-xs">4</span>
                  <span>Click "Run" to execute</span>
                </li>
              </ol>
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={loadSchema}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-oa-bg-secondary border border-oa-border text-oa-text-primary rounded-lg hover:border-oa-accent"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {showSchema ? (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Hide Schema
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    View Schema
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={copySchema}
                disabled={!schemaContent}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {schemaCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy SQL
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {showSchema && schemaContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <pre className="p-4 bg-oa-bg-tertiary rounded-lg border border-oa-border text-xs text-oa-text-secondary overflow-x-auto max-h-64 overflow-y-auto">
                    {schemaContent}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-400">
                This schema includes Row Level Security (RLS) policies to keep user data isolated and secure.
              </p>
            </div>

            <motion.button
              onClick={markSchemaComplete}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  I've Run the Schema
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {currentStep === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <Zap className="w-8 h-8 text-green-400" />
            </motion.div>

            <div>
              <h4 className="font-semibold text-lg text-oa-text-primary">
                Supabase Setup Complete!
              </h4>
              <p className="text-sm text-oa-text-secondary mt-1">
                Your cloud sync is ready. Data will automatically sync when toggled on.
              </p>
            </div>

            {status?.url && (
              <div className="flex items-center justify-center gap-2 text-xs text-oa-text-secondary">
                <Cloud className="w-3 h-3" />
                <code className="px-2 py-0.5 bg-oa-bg-tertiary rounded">
                  {status.url}
                </code>
              </div>
            )}

            <div className="pt-4 border-t border-oa-border">
              <p className="text-xs text-oa-text-secondary">
                <strong>Note:</strong> Local files remain the source of truth. Supabase syncs activities for cross-device access.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

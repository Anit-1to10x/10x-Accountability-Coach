'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Save,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react'

interface APIKeyConfig {
  configured: boolean
  masked: string | null
  source: string
}

interface APIKeyDefinition {
  key: string
  label: string
  description: string
  required: boolean
  getKeyUrl: string
  placeholder: string
  prefix?: string
}

const API_KEYS: APIKeyDefinition[] = [
  {
    key: 'OPENANALYST_API_KEY',
    label: 'OpenAnalyst API Key',
    description: 'Required for the main AI brain. Get your key at 10x.in/dashboard',
    required: true,
    getKeyUrl: 'https://10x.in/dashboard',
    placeholder: 'sk-oa-v1-...',
    prefix: 'sk-oa-',
  },
  {
    key: 'GEMINI_API_KEY',
    label: 'Gemini API Key',
    description: 'For image generation features. Get your key at Google AI Studio.',
    required: false,
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AI...',
  },
  {
    key: 'BRAVE_API_KEY',
    label: 'Brave Search API Key',
    description: 'For web search capabilities. Get your key at Brave Search.',
    required: false,
    getKeyUrl: 'https://brave.com/search/api/',
    placeholder: 'BSA...',
  },
  {
    key: 'PERPLEXITY_API_KEY',
    label: 'Perplexity API Key',
    description: 'For research and analysis features.',
    required: false,
    getKeyUrl: 'https://www.perplexity.ai/settings/api',
    placeholder: 'pplx-...',
    prefix: 'pplx-',
  },
]

export function APIKeyManager() {
  const [config, setConfig] = useState<Record<string, APIKeyConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [keyValues, setKeyValues] = useState<Record<string, string>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/config/env')
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config || {})
      } else {
        setError('Failed to load API configuration')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKey = async (keyDef: APIKeyDefinition) => {
    const value = keyValues[keyDef.key]
    if (!value) return

    setSaving(keyDef.key)
    setError(null)

    try {
      const res = await fetch('/api/config/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [keyDef.key]: value }),
      })

      if (res.ok) {
        // Reload config
        await loadConfig()
        setEditingKey(null)
        setKeyValues(prev => ({ ...prev, [keyDef.key]: '' }))
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save API key')
      }
    } catch (err) {
      setError('Failed to save API key')
    } finally {
      setSaving(null)
    }
  }

  const handleTestKey = async (keyDef: APIKeyDefinition) => {
    const value = keyValues[keyDef.key] || ''
    if (!value && !config[keyDef.key]?.configured) return

    setTesting(keyDef.key)
    setTestResults(prev => ({ ...prev, [keyDef.key]: { success: false, message: 'Testing...' } }))

    try {
      const res = await fetch('/api/config/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: keyDef.key,
          value: value || 'use_existing',
        }),
      })

      const data = await res.json()
      setTestResults(prev => ({
        ...prev,
        [keyDef.key]: { success: data.success, message: data.message },
      }))
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [keyDef.key]: { success: false, message: 'Test failed' },
      }))
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-oa-accent animate-spin" />
        <span className="ml-2 text-sm text-oa-text-secondary">Loading API configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      <p className="text-sm text-oa-text-secondary mb-4">
        Configure your API keys to enable AI features. Keys are saved locally to <code className="bg-oa-bg-tertiary px-1 py-0.5 rounded">ui/.env.local</code>.
      </p>

      {API_KEYS.map((keyDef) => {
        const keyConfig = config[keyDef.key] || { configured: false, masked: null, source: 'none' }
        const isEditing = editingKey === keyDef.key
        const testResult = testResults[keyDef.key]

        return (
          <motion.div
            key={keyDef.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${
              keyConfig.configured
                ? 'bg-oa-bg-tertiary border-green-500/30'
                : keyDef.required
                ? 'bg-red-500/5 border-red-500/30'
                : 'bg-oa-bg-tertiary border-oa-border'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Key className={`w-4 h-4 ${keyConfig.configured ? 'text-green-400' : 'text-oa-text-secondary'}`} />
                  <h4 className="text-sm font-medium text-oa-text-primary">{keyDef.label}</h4>
                  {keyDef.required && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                      Required
                    </span>
                  )}
                  {keyConfig.configured && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                      Configured
                    </span>
                  )}
                </div>
                <p className="text-xs text-oa-text-secondary mb-2">{keyDef.description}</p>

                {keyConfig.configured && !isEditing && (
                  <div className="flex items-center gap-2 text-xs text-oa-text-secondary">
                    <span className="font-mono bg-oa-bg-primary px-2 py-1 rounded">
                      {keyConfig.masked}
                    </span>
                    <span className="text-oa-text-secondary">
                      (from {keyConfig.source})
                    </span>
                  </div>
                )}

                {(isEditing || !keyConfig.configured) && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <input
                        type={showKey[keyDef.key] ? 'text' : 'password'}
                        value={keyValues[keyDef.key] || ''}
                        onChange={(e) => setKeyValues(prev => ({ ...prev, [keyDef.key]: e.target.value }))}
                        placeholder={keyDef.placeholder}
                        className="w-full px-4 py-2 pr-10 bg-oa-bg-primary border border-oa-border rounded-lg text-sm text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent font-mono"
                      />
                      <button
                        onClick={() => setShowKey(prev => ({ ...prev, [keyDef.key]: !prev[keyDef.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-oa-text-secondary hover:text-oa-text-primary"
                      >
                        {showKey[keyDef.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveKey(keyDef)}
                        disabled={!keyValues[keyDef.key] || saving === keyDef.key}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-oa-accent text-white rounded-lg text-xs hover:bg-oa-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving === keyDef.key ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        Save
                      </button>

                      <button
                        onClick={() => handleTestKey(keyDef)}
                        disabled={!keyValues[keyDef.key] && !keyConfig.configured || testing === keyDef.key}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-oa-border text-oa-text-primary rounded-lg text-xs hover:bg-oa-bg-secondary disabled:opacity-50"
                      >
                        {testing === keyDef.key ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Test
                      </button>

                      {isEditing && keyConfig.configured && (
                        <button
                          onClick={() => {
                            setEditingKey(null)
                            setKeyValues(prev => ({ ...prev, [keyDef.key]: '' }))
                          }}
                          className="px-3 py-1.5 text-oa-text-secondary hover:text-oa-text-primary text-xs"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {testResult && (
                      <div className={`flex items-center gap-2 text-xs ${
                        testResult.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {testResult.success ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {keyConfig.configured && !isEditing && (
                  <button
                    onClick={() => setEditingKey(keyDef.key)}
                    className="p-2 text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary rounded-lg transition-colors"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                )}

                <a
                  href={keyDef.getKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-oa-text-secondary hover:text-oa-accent hover:bg-oa-bg-secondary rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )
      })}

      <div className="mt-4 p-4 bg-oa-bg-secondary rounded-lg border border-oa-border">
        <p className="text-xs text-oa-text-secondary">
          <strong>Note:</strong> After saving API keys, you may need to restart the development server for changes to take effect.
          Run <code className="bg-oa-bg-tertiary px-1 py-0.5 rounded">npm run dev</code> to restart.
        </p>
      </div>
    </div>
  )
}

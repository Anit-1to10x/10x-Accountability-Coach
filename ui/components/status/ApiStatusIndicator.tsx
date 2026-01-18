'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react'

interface ApiStatus {
  openanalyst: {
    configured: boolean
    url: string
    model: string
  }
  gemini: {
    configured: boolean
    model: string
    imageModel: string
  }
  environment: string
}

/**
 * API Status Indicator
 * Shows connection status based on API key configuration
 */
export function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/status')
        if (!response.ok) {
          throw new Error('Failed to check API status')
        }
        const data = await response.json()
        setStatus(data)
        setError(null)
      } catch (err) {
        setError('Unable to check status')
        console.error('API status check failed:', err)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusDisplay = () => {
    if (loading) {
      return {
        icon: <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />,
        text: 'Checking...',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30'
      }
    }

    if (error || !status) {
      return {
        icon: <AlertTriangle className="w-3 h-3 text-orange-500" />,
        text: 'Unknown',
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30'
      }
    }

    if (status.openanalyst.configured) {
      return {
        icon: <Wifi className="w-3 h-3 text-green-500" />,
        text: 'Connected',
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      }
    }

    return {
      icon: <WifiOff className="w-3 h-3 text-red-500" />,
      text: 'Disconnected',
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    }
  }

  const display = getStatusDisplay()
  const isConfigured = status?.openanalyst.configured ?? false
  const geminiConfigured = status?.gemini.configured ?? false

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex flex-col rounded-lg ${display.bgColor} border ${display.borderColor} shadow-lg transition-all duration-200`}
      >
        {/* Main status button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-3 py-1.5 hover:opacity-80 transition-opacity"
        >
          {display.icon}
          <span className={`text-xs font-medium ${display.color}`}>{display.text}</span>
        </button>

        {/* Expanded details */}
        {expanded && status && (
          <div className="px-3 pb-2 pt-1 border-t border-white/10 space-y-1">
            {/* OpenAnalyst API */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-400">OpenAnalyst AI</span>
            </div>

            {/* Gemini API */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${geminiConfigured ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-xs text-gray-400">
                Gemini {geminiConfigured ? '' : '(Optional)'}
              </span>
            </div>

            {/* Warning if disconnected */}
            {!isConfigured && (
              <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-300">
                <p className="font-medium">API key not configured</p>
                <p className="opacity-80">Chat features won't work.</p>
                <p className="opacity-80 mt-1">Go to Settings to configure.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

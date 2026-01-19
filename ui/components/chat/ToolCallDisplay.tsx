'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench,
  Play,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Code,
  Terminal,
  Loader2,
  Clock
} from 'lucide-react'

interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
  error?: string
  executionTime?: number
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[]
  isStreaming?: boolean
}

export function ToolCallDisplay({ toolCalls, isStreaming }: ToolCallDisplayProps) {
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedCalls(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (toolCalls.length === 0) return null

  return (
    <div className="space-y-2 my-3">
      {toolCalls.map((call, index) => (
        <motion.div
          key={call.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`border rounded-lg overflow-hidden ${
            call.status === 'error'
              ? 'border-red-500/30 bg-red-500/5'
              : call.status === 'completed'
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-oa-border bg-oa-bg-secondary'
          }`}
        >
          {/* Header */}
          <button
            onClick={() => toggleExpanded(call.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-oa-bg-tertiary/50 transition-colors"
          >
            {/* Status Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              call.status === 'error'
                ? 'bg-red-500/10'
                : call.status === 'completed'
                ? 'bg-green-500/10'
                : call.status === 'running'
                ? 'bg-yellow-500/10'
                : 'bg-oa-bg-tertiary'
            }`}>
              {call.status === 'running' ? (
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
              ) : call.status === 'completed' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : call.status === 'error' ? (
                <X className="w-4 h-4 text-red-400" />
              ) : (
                <Wrench className="w-4 h-4 text-oa-text-secondary" />
              )}
            </div>

            {/* Tool Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-oa-text-primary">
                  {formatToolName(call.name)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  call.status === 'error'
                    ? 'bg-red-500/10 text-red-400'
                    : call.status === 'completed'
                    ? 'bg-green-500/10 text-green-400'
                    : call.status === 'running'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-oa-bg-tertiary text-oa-text-secondary'
                }`}>
                  {call.status}
                </span>
              </div>
              {call.executionTime && (
                <div className="flex items-center gap-1 text-xs text-oa-text-secondary mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{call.executionTime}ms</span>
                </div>
              )}
            </div>

            {/* Expand Toggle */}
            {expandedCalls.has(call.id) ? (
              <ChevronUp className="w-4 h-4 text-oa-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-oa-text-secondary" />
            )}
          </button>

          {/* Expanded Details */}
          <AnimatePresence>
            {expandedCalls.has(call.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-oa-border overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Arguments */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-oa-text-secondary mb-2">
                      <Code className="w-3 h-3" />
                      Arguments
                    </div>
                    <pre className="text-xs bg-oa-bg-primary p-3 rounded-lg overflow-x-auto text-oa-text-primary">
                      {JSON.stringify(call.arguments, null, 2)}
                    </pre>
                  </div>

                  {/* Result */}
                  {call.result && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-green-400 mb-2">
                        <Terminal className="w-3 h-3" />
                        Result
                      </div>
                      <pre className="text-xs bg-oa-bg-primary p-3 rounded-lg overflow-x-auto text-oa-text-primary max-h-64 overflow-y-auto">
                        {typeof call.result === 'string'
                          ? call.result
                          : JSON.stringify(call.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {call.error && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2">
                        <X className="w-3 h-3" />
                        Error
                      </div>
                      <pre className="text-xs bg-red-500/10 p-3 rounded-lg overflow-x-auto text-red-400">
                        {call.error}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

function formatToolName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Compact tool indicator for streaming messages
 */
export function ToolIndicator({ toolName, status }: { toolName: string; status: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-oa-bg-secondary border border-oa-border rounded-full"
    >
      {status === 'running' ? (
        <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
      ) : status === 'completed' ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Wrench className="w-3 h-3 text-oa-text-secondary" />
      )}
      <span className="text-xs text-oa-text-primary">
        {status === 'running' ? 'Running' : 'Using'} {formatToolName(toolName)}
      </span>
    </motion.div>
  )
}

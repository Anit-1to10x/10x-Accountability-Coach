'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Code,
  Search,
  FileText,
  Wrench,
  CheckCircle,
  Loader2,
  Zap,
  MessageSquare,
  FileSearch,
  Database,
  Server,
} from 'lucide-react'

export type StreamingPhase =
  | 'idle'
  | 'thinking'
  | 'rag_retrieving'
  | 'mcp_connected'
  | 'matching_skill'
  | 'matching_prompt'
  | 'loading_tools'
  | 'executing_tool'
  | 'executing_code'
  | 'analyzing_files'
  | 'generating'
  | 'complete'

interface StreamingStatusProps {
  phase: StreamingPhase
  details?: string
  toolName?: string
  skillName?: string
  promptName?: string
  files?: Array<{ name: string; type: string; size: number }>
  documentsFound?: number
  sources?: string[]
  servers?: string[]
  toolCount?: number
  isVisible?: boolean
}

const phaseConfig: Record<StreamingPhase, {
  icon: React.ComponentType<any>
  label: string
  color: string
  animate: boolean
}> = {
  idle: {
    icon: MessageSquare,
    label: 'Ready',
    color: 'text-oa-text-secondary',
    animate: false,
  },
  thinking: {
    icon: Brain,
    label: 'Thinking',
    color: 'text-purple-400',
    animate: true,
  },
  rag_retrieving: {
    icon: Database,
    label: 'Searching knowledge base',
    color: 'text-emerald-400',
    animate: true,
  },
  mcp_connected: {
    icon: Server,
    label: 'MCP connected',
    color: 'text-cyan-400',
    animate: true,
  },
  matching_skill: {
    icon: Zap,
    label: 'Matching skill',
    color: 'text-yellow-400',
    animate: true,
  },
  matching_prompt: {
    icon: FileText,
    label: 'Selecting framework',
    color: 'text-blue-400',
    animate: true,
  },
  loading_tools: {
    icon: Wrench,
    label: 'Loading tools',
    color: 'text-orange-400',
    animate: true,
  },
  executing_tool: {
    icon: Wrench,
    label: 'Executing tool',
    color: 'text-cyan-400',
    animate: true,
  },
  executing_code: {
    icon: Code,
    label: 'Running code',
    color: 'text-green-400',
    animate: true,
  },
  analyzing_files: {
    icon: FileSearch,
    label: 'Analyzing files',
    color: 'text-emerald-400',
    animate: true,
  },
  generating: {
    icon: Sparkles,
    label: 'Generating response',
    color: 'text-oa-accent',
    animate: true,
  },
  complete: {
    icon: CheckCircle,
    label: 'Complete',
    color: 'text-green-400',
    animate: false,
  },
}

export function StreamingStatus({
  phase,
  details,
  toolName,
  skillName,
  promptName,
  files,
  documentsFound,
  sources,
  servers,
  toolCount,
  isVisible = true,
}: StreamingStatusProps) {
  const config = phaseConfig[phase]
  const Icon = config.icon

  // Build the display text
  let displayText = config.label
  if (phase === 'rag_retrieving' && documentsFound !== undefined) {
    displayText = documentsFound > 0
      ? `Found ${documentsFound} relevant document${documentsFound > 1 ? 's' : ''} in knowledge base`
      : 'Searching knowledge base'
  } else if (phase === 'mcp_connected' && servers) {
    displayText = `MCP connected (${toolCount || 0} tools available)`
  } else if (phase === 'executing_tool' && toolName) {
    displayText = `Using ${formatName(toolName)}`
  } else if (phase === 'matching_skill' && skillName) {
    displayText = `Matched: ${skillName}`
  } else if (phase === 'matching_prompt' && promptName) {
    displayText = `Framework: ${promptName}`
  } else if (phase === 'analyzing_files' && files && files.length > 0) {
    const fileNames = files.map(f => f.name).join(', ')
    displayText = files.length === 1
      ? `Analyzing ${fileNames}`
      : `Analyzing ${files.length} files`
  } else if (details) {
    displayText = details
  }

  if (!isVisible || phase === 'idle') return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase + displayText}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 py-2"
      >
        <div className={`${config.color}`}>
          {config.animate ? (
            <motion.div
              animate={{ rotate: phase === 'thinking' ? [0, 360] : 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Icon className="w-4 h-4" />
            </motion.div>
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        <span className={`text-sm ${config.color}`}>
          {displayText}
          {config.animate && <AnimatedDots />}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}

function AnimatedDots() {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return <span className="inline-block w-4">{dots}</span>
}

function formatName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Compact inline status for message bubbles
 */
export function InlineStatus({ phase, text }: { phase: StreamingPhase; text?: string }) {
  const config = phaseConfig[phase]
  const Icon = config.icon

  if (phase === 'idle' || phase === 'complete') return null

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${config.color}`}>
      {config.animate ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>{text || config.label}</span>
    </span>
  )
}

/**
 * Full-width status bar for chat interface header
 */
export function StatusBar({
  isStreaming,
  phase,
  agentName
}: {
  isStreaming: boolean
  phase: StreamingPhase
  agentName?: string
}) {
  if (!isStreaming) return null

  const config = phaseConfig[phase]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-oa-border bg-oa-bg-secondary/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 px-4 py-2">
        <div className={`${config.color}`}>
          {config.animate ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        <span className={`text-sm ${config.color}`}>
          {agentName ? `${agentName} is ${config.label.toLowerCase()}` : config.label}
          {config.animate && <AnimatedDots />}
        </span>
      </div>
    </motion.div>
  )
}

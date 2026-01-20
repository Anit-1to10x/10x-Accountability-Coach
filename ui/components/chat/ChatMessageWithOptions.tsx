'use client'

import React from 'react'
import { Lightbulb, ExternalLink } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'
import QuickOptions from './QuickOptions'

interface ApiSuggestion {
  taskType: string
  suggestedApi: string
  configured: boolean
  message: string
  configUrl: string
  envKey: string
}

interface ChatMessageWithOptionsProps {
  message: ChatMessage
  onOptionSelect: (stepId: string, value: string) => void
}

export function ChatMessageWithOptions({
  message,
  onOptionSelect,
}: ChatMessageWithOptionsProps) {
  const { metadata, role, content, attachments } = message
  const isStreaming = metadata?.isStreaming
  const apiSuggestion = metadata?.apiSuggestion as ApiSuggestion | undefined

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl break-words ${
          role === 'user'
            ? 'bg-oa-accent text-white rounded-br-sm'
            : 'bg-oa-bg-secondary border border-oa-border text-oa-text-primary rounded-bl-sm'
        }`}
      >
        {/* API Suggestion Banner */}
        {role === 'assistant' && apiSuggestion && !apiSuggestion.configured && (
          <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-amber-300 leading-relaxed">
                  {apiSuggestion.message}
                </p>
                <a
                  href={apiSuggestion.configUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Get {apiSuggestion.suggestedApi} API Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Show generating message if streaming and empty */}
        {isStreaming && !content && (
          <div className="flex items-center gap-2 text-xs text-oa-text-secondary">
            <div className="w-2 h-2 bg-oa-accent rounded-full animate-pulse" />
            <span>Generating response...</span>
          </div>
        )}

        {/* Message content */}
        {content && (
          <div className="text-sm whitespace-pre-wrap break-words overflow-hidden">
            {content}
            {/* Streaming cursor indicator */}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-oa-accent animate-pulse" />
            )}
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {attachments.map((att) => (
              <div key={att.id} className="text-xs opacity-80">
                📎 {att.name}
              </div>
            ))}
          </div>
        )}

        {/* Options - only show if not answered and role is assistant */}
        {role === 'assistant' &&
          metadata?.options &&
          metadata.options.length > 0 &&
          !metadata.answered && (
            <div className="mt-4">
              <QuickOptions
                options={metadata.options}
                onSelect={(value) => onOptionSelect(metadata.step || '', value)}
              />
            </div>
          )}

        {/* Optional descriptions for multi-select */}
        {role === 'assistant' &&
          metadata?.options &&
          metadata.options.some((opt) => opt.description) &&
          !metadata.answered && (
            <div className="mt-2 space-y-2">
              {metadata.options.map(
                (opt) =>
                  opt.description && (
                    <div
                      key={opt.value}
                      className="text-xs text-oa-text-secondary pl-4 border-l-2 border-oa-border"
                    >
                      <span className="font-medium">{opt.label}:</span>{' '}
                      {opt.description}
                    </div>
                  )
              )}
            </div>
          )}
      </div>
    </div>
  )
}

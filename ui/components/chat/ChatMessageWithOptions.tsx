'use client'

import React from 'react'
import type { ChatMessage } from '@/types/chat'
import QuickOptions from './QuickOptions'

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

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          role === 'user'
            ? 'bg-oa-accent text-white rounded-br-sm'
            : 'bg-oa-bg-secondary border border-oa-border text-oa-text-primary rounded-bl-sm'
        }`}
      >
        {/* Show generating message if streaming and empty */}
        {isStreaming && !content && (
          <div className="flex items-center gap-2 text-xs text-oa-text-secondary">
            <div className="w-2 h-2 bg-oa-accent rounded-full animate-pulse" />
            <span>Generating response...</span>
          </div>
        )}

        {/* Message content */}
        {content && (
          <div className="text-sm whitespace-pre-wrap">
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

'use client'

import React from 'react'
import { FileText, FileCode, FileJson, Copy, Check, Loader2 } from 'lucide-react'

interface FileViewerProps {
  content: string | null
  path: string | null
}

function getFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400" />
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-green-400" />
    case 'md':
      return <FileText className="w-4 h-4 text-blue-400" />
    default:
      return <FileText className="w-4 h-4 text-oa-text-secondary" />
  }
}

function getFileName(path: string) {
  return path.split('/').pop() || path
}

export function FileViewer({ content, path }: FileViewerProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!path) {
    return (
      <div className="h-full flex items-center justify-center text-oa-text-secondary">
        <p className="text-sm">Select a file to view</p>
      </div>
    )
  }

  if (content === null) {
    return (
      <div className="h-full flex items-center justify-center text-oa-text-secondary">
        <Loader2 className="w-5 h-5 animate-spin mb-2" />
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  const lineCount = content.split('\n').length

  return (
    <div className="h-full flex flex-col bg-oa-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-oa-border bg-oa-bg-secondary/50">
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(path)}
          <span className="text-sm font-medium text-oa-text-primary truncate">
            {getFileName(path)}
          </span>
          <span className="text-xs text-oa-text-secondary hidden sm:inline">
            ({lineCount} lines)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-oa-text-secondary bg-oa-bg-tertiary px-2 py-1 rounded hidden md:block">
            {path}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-oa-bg-secondary rounded transition-colors"
            title="Copy content"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-oa-text-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="flex-shrink-0 py-4 px-2 bg-oa-bg-secondary/30 border-r border-oa-border text-right select-none">
            {content.split('\n').map((_, i) => (
              <div key={i} className="text-[10px] text-oa-text-secondary/50 leading-5 font-mono">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code content */}
          <div className="flex-1 py-4 px-4 overflow-x-auto">
            <pre className="text-xs leading-5 font-mono text-oa-text-primary whitespace-pre">
              {content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

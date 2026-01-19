'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  FileText,
  FileCode,
  FileJson,
  Image as ImageIcon,
  Video,
  Music,
  FileSpreadsheet,
  Copy,
  Check,
  Loader2,
  Download,
  ExternalLink,
  Maximize2,
  X,
  Edit3,
  Save,
  XCircle,
} from 'lucide-react'

interface FileViewerProps {
  content: string | null
  path: string | null
  category?: string
  isBinary?: boolean
  url?: string
  size?: number
  onSave?: (path: string, content: string) => Promise<boolean>
  editable?: boolean
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
    case 'py':
      return <FileCode className="w-4 h-4 text-green-400" />
    case 'md':
      return <FileText className="w-4 h-4 text-blue-400" />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return <ImageIcon className="w-4 h-4 text-purple-400" />
    case 'mp4':
    case 'webm':
    case 'mov':
      return <Video className="w-4 h-4 text-red-400" />
    case 'mp3':
    case 'wav':
      return <Music className="w-4 h-4 text-pink-400" />
    case 'csv':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
    default:
      return <FileText className="w-4 h-4 text-oa-text-secondary" />
  }
}

function getFileName(path: string) {
  return path.split('/').pop() || path
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// JSON Syntax Highlighter
function JsonViewer({ content }: { content: string }) {
  try {
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)

    return (
      <pre className="text-xs leading-5 font-mono whitespace-pre overflow-x-auto">
        {formatted.split('\n').map((line, i) => (
          <div key={i} className="hover:bg-white/5">
            {line.split(/(".*?":|".*?"|[\[\]{}:,]|\d+\.?\d*|true|false|null)/g).map((part, j) => {
              if (/^".*?":$/.test(part)) {
                return <span key={j} className="text-cyan-400">{part}</span>
              }
              if (/^".*?"$/.test(part)) {
                return <span key={j} className="text-green-400">{part}</span>
              }
              if (/^\d+\.?\d*$/.test(part)) {
                return <span key={j} className="text-orange-400">{part}</span>
              }
              if (/^(true|false|null)$/.test(part)) {
                return <span key={j} className="text-purple-400">{part}</span>
              }
              if (/^[\[\]{}]$/.test(part)) {
                return <span key={j} className="text-yellow-400">{part}</span>
              }
              return <span key={j} className="text-oa-text-primary">{part}</span>
            })}
          </div>
        ))}
      </pre>
    )
  } catch {
    return <pre className="text-xs leading-5 font-mono text-red-400">{content}</pre>
  }
}

// Markdown Viewer with styling
function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none p-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-oa-text-primary mb-4 border-b border-oa-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-oa-text-primary mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-oa-text-primary mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-oa-text-secondary mb-4 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 text-oa-text-secondary space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 text-oa-text-secondary space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-oa-text-secondary">{children}</li>
          ),
          code: ({ className, children, ...props }) => {
            // Check if it's an inline code (no className) or code block (has language class)
            const isInline = !className
            return isInline ? (
              <code className="bg-oa-bg-tertiary text-oa-accent px-1.5 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            ) : (
              <code className={`block bg-oa-bg-tertiary p-3 rounded-lg text-xs overflow-x-auto ${className || ''}`} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-oa-bg-tertiary p-4 rounded-lg overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-oa-accent pl-4 italic text-oa-text-secondary my-4">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-oa-accent hover:underline"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-oa-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-oa-bg-secondary px-4 py-2 text-left text-oa-text-primary font-medium border-b border-oa-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-oa-text-secondary border-b border-oa-border">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Image Viewer with fullscreen
function ImageViewer({ url, name }: { url: string; name: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-center h-full p-4">
        <div className="relative group">
          <img
            src={url}
            alt={name}
            className="max-w-full max-h-[60vh] rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => setIsFullscreen(true)}
          />
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={url}
            alt={name}
            className="max-w-[90vw] max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </>
  )
}

// Video Viewer
function VideoViewer({ url, name }: { url: string; name: string }) {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <video
        src={url}
        controls
        className="max-w-full max-h-[60vh] rounded-lg shadow-lg"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

// Audio Viewer
function AudioViewer({ url, name }: { url: string; name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
      <div className="w-24 h-24 bg-oa-bg-secondary rounded-full flex items-center justify-center">
        <Music className="w-12 h-12 text-pink-400" />
      </div>
      <p className="text-oa-text-primary font-medium">{name}</p>
      <audio src={url} controls className="w-full max-w-md">
        Your browser does not support the audio tag.
      </audio>
    </div>
  )
}

// Code Viewer with line numbers
function CodeViewer({ content }: { content: string }) {
  return (
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
  )
}

export function FileViewer({ content, path, category, isBinary, url, size, onSave, editable = true }: FileViewerProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Check if file is editable (text-based)
  const ext = path?.split('.').pop()?.toLowerCase()
  const isEditableFile = editable && !isBinary && ['md', 'json', 'txt', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'xml', 'yaml', 'yml', 'csv', 'py'].includes(ext || '')

  const handleCopy = async () => {
    const textToCopy = isEditing ? editContent : content
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (url) {
      const link = document.createElement('a')
      link.href = url
      link.download = getFileName(path || '')
      link.click()
    }
  }

  const handleEdit = () => {
    setEditContent(content || '')
    setIsEditing(true)
    setSaveError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!path || !onSave) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const success = await onSave(path, editContent)
      if (success) {
        setIsEditing(false)
      } else {
        setSaveError('Failed to save file')
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save file')
    } finally {
      setIsSaving(false)
    }
  }

  if (!path) {
    return (
      <div className="h-full flex items-center justify-center text-oa-text-secondary">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a file to view</p>
        </div>
      </div>
    )
  }

  if (content === null && !isBinary) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-oa-text-secondary">
        <Loader2 className="w-6 h-6 animate-spin mb-3" />
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  const fileName = getFileName(path)
  const fileExt = path.split('.').pop()?.toLowerCase()
  const lineCount = isEditing ? editContent.split('\n').length : (content ? content.split('\n').length : 0)

  // Render based on file type
  const renderContent = () => {
    // Show editor in edit mode
    if (isEditing) {
      return (
        <div className="h-full flex flex-col">
          {saveError && (
            <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/50 text-red-400 text-sm">
              {saveError}
            </div>
          )}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 w-full p-4 bg-oa-bg-primary text-oa-text-primary font-mono text-sm resize-none focus:outline-none"
            placeholder="Enter file content..."
            spellCheck={false}
          />
        </div>
      )
    }

    if (isBinary && url) {
      switch (category) {
        case 'image':
          return <ImageViewer url={url} name={fileName} />
        case 'video':
          return <VideoViewer url={url} name={fileName} />
        case 'audio':
          return <AudioViewer url={url} name={fileName} />
        case 'pdf':
          return (
            <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
              <FileText className="w-16 h-16 text-red-400" />
              <p className="text-oa-text-primary font-medium">{fileName}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open PDF
              </a>
            </div>
          )
        default:
          return (
            <div className="flex items-center justify-center h-full text-oa-text-secondary">
              <p>Cannot preview this file type</p>
            </div>
          )
      }
    }

    if (content) {
      switch (fileExt) {
        case 'md':
          return <MarkdownViewer content={content} />
        case 'json':
          return (
            <div className="p-4">
              <JsonViewer content={content} />
            </div>
          )
        default:
          return <CodeViewer content={content} />
      }
    }

    return null
  }

  return (
    <div className="h-full flex flex-col bg-oa-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-oa-border bg-oa-bg-secondary/50">
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(path)}
          <span className="text-sm font-medium text-oa-text-primary truncate">
            {fileName}
          </span>
          {!isBinary && (
            <span className="text-xs text-oa-text-secondary hidden sm:inline">
              ({lineCount} lines)
            </span>
          )}
          {size && (
            <span className="text-xs text-oa-text-secondary hidden sm:inline">
              • {formatFileSize(size)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <span className="text-xs text-amber-400 bg-amber-400/20 px-2 py-1 rounded">
              Editing
            </span>
          )}
          <span className="text-[10px] text-oa-text-secondary bg-oa-bg-tertiary px-2 py-1 rounded hidden md:block truncate max-w-[200px]">
            {path}
          </span>
          {!isBinary && (
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
          )}
          {url && (
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-oa-bg-secondary rounded transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4 text-oa-text-secondary" />
            </button>
          )}
          {/* Edit/Save/Cancel buttons */}
          {isEditableFile && onSave && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 hover:bg-oa-bg-secondary rounded transition-colors"
                    title="Cancel editing"
                    disabled={isSaving}
                  >
                    <XCircle className="w-4 h-4 text-oa-text-secondary" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded transition-colors text-white text-xs"
                    title="Save file"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 bg-oa-accent hover:bg-oa-accent/80 rounded transition-colors text-white text-xs"
                  title="Edit file"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  )
}

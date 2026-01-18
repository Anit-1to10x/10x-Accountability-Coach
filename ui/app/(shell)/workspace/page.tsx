'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder, FolderOpen, FileText, Image, FileJson, File,
  ChevronRight, ChevronDown, RefreshCw, Home, Zap,
  MessageSquare, Target, Calendar, CheckSquare
} from 'lucide-react'

interface FileItem {
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: string
  children?: FileItem[]
  extension?: string
}

// Get icon based on folder name or file extension
const getIcon = (item: FileItem) => {
  if (item.type === 'folder') {
    const folderIcons: Record<string, any> = {
      'challenges': Target,
      'skills': Zap,
      'prompts': MessageSquare,
      'todos': CheckSquare,
      'schedule': Calendar,
      'assets': Image,
      'chats': MessageSquare,
    }
    return folderIcons[item.name] || Folder
  }

  // File icons by extension
  const extensionIcons: Record<string, any> = {
    'md': FileText,
    'json': FileJson,
    'png': Image,
    'jpg': Image,
    'jpeg': Image,
    'gif': Image,
    'svg': Image,
  }
  return extensionIcons[item.extension || ''] || File
}

// Get color based on folder name
const getFolderColor = (name: string) => {
  const colors: Record<string, string> = {
    'challenges': 'text-orange-500',
    'skills': 'text-yellow-500',
    'prompts': 'text-blue-500',
    'todos': 'text-green-500',
    'schedule': 'text-purple-500',
    'assets': 'text-pink-500',
    'chats': 'text-cyan-500',
    'profiles': 'text-indigo-500',
    'agents': 'text-red-500',
  }
  return colors[name] || 'text-oa-text-secondary'
}

// Format file size
const formatSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// File/Folder Tree Item Component
function TreeItem({
  item,
  level = 0,
  onSelect,
}: {
  item: FileItem
  level?: number
  onSelect: (item: FileItem) => void
}) {
  const [isExpanded, setIsExpanded] = useState(level < 1)
  const Icon = getIcon(item)
  const hasChildren = item.type === 'folder' && item.children && item.children.length > 0
  const folderColor = item.type === 'folder' ? getFolderColor(item.name) : ''

  return (
    <div>
      <motion.div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors hover:bg-oa-bg-secondary group`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (item.type === 'folder') {
            setIsExpanded(!isExpanded)
          }
          onSelect(item)
        }}
        whileHover={{ x: 2 }}
      >
        {/* Expand/Collapse Arrow */}
        {hasChildren ? (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={14} className="text-oa-text-secondary" />
          </motion.div>
        ) : (
          <div className="w-[14px]" />
        )}

        {/* Icon */}
        {item.type === 'folder' && isExpanded ? (
          <FolderOpen size={18} className={folderColor} />
        ) : (
          <Icon size={18} className={folderColor || 'text-oa-text-secondary'} />
        )}

        {/* Name */}
        <span className="text-sm text-oa-text-primary flex-1 truncate">
          {item.name}
        </span>

        {/* File size or child count */}
        <span className="text-xs text-oa-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          {item.type === 'file' ? formatSize(item.size) : item.children ? `${item.children.length} items` : ''}
        </span>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children?.map((child) => (
              <TreeItem
                key={child.path}
                item={child}
                level={level + 1}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function WorkspacePage() {
  const [contents, setContents] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)

  useEffect(() => {
    loadWorkspace()
  }, [])

  const loadWorkspace = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/workspace?depth=3')
      const data = await res.json()
      if (data.success) {
        setContents(data.contents)
      }
    } catch (error) {
      console.error('Failed to load workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (item: FileItem) => {
    setSelectedItem(item)
  }

  // Count totals
  const countItems = (items: FileItem[]): { folders: number; files: number } => {
    let folders = 0
    let files = 0
    for (const item of items) {
      if (item.type === 'folder') {
        folders++
        if (item.children) {
          const sub = countItems(item.children)
          folders += sub.folders
          files += sub.files
        }
      } else {
        files++
      }
    }
    return { folders, files }
  }

  const { folders, files } = countItems(contents)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading workspace...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-oa-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-oa-accent" />
            <h1 className="text-2xl font-semibold text-oa-text-primary">
              Workspace
            </h1>
          </div>
          <button
            onClick={loadWorkspace}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        <p className="text-sm text-oa-text-secondary">
          Browse your data folder structure - {folders} folders, {files} files
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* File Tree */}
        <div className="w-1/2 border-r border-oa-border overflow-y-auto p-4">
          <div className="text-xs font-semibold text-oa-text-secondary uppercase tracking-wider mb-3 px-2">
            Data Folder
          </div>
          <div className="space-y-0.5">
            {contents.map((item) => (
              <TreeItem
                key={item.path}
                item={item}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* Preview/Details Panel */}
        <div className="w-1/2 overflow-y-auto p-6">
          {selectedItem ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                {React.createElement(getIcon(selectedItem), {
                  size: 32,
                  className: selectedItem.type === 'folder'
                    ? getFolderColor(selectedItem.name)
                    : 'text-oa-text-secondary'
                })}
                <div>
                  <h2 className="text-xl font-semibold text-oa-text-primary">
                    {selectedItem.name}
                  </h2>
                  <p className="text-sm text-oa-text-secondary">
                    {selectedItem.path}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-oa-bg-secondary rounded-lg p-4">
                  <h3 className="text-sm font-medium text-oa-text-primary mb-3">
                    Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-oa-text-secondary">Type</span>
                      <span className="text-oa-text-primary capitalize">
                        {selectedItem.type}
                        {selectedItem.extension && ` (.${selectedItem.extension})`}
                      </span>
                    </div>
                    {selectedItem.size !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-oa-text-secondary">Size</span>
                        <span className="text-oa-text-primary">
                          {formatSize(selectedItem.size)}
                        </span>
                      </div>
                    )}
                    {selectedItem.modified && (
                      <div className="flex justify-between">
                        <span className="text-oa-text-secondary">Modified</span>
                        <span className="text-oa-text-primary">
                          {new Date(selectedItem.modified).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedItem.children && (
                      <div className="flex justify-between">
                        <span className="text-oa-text-secondary">Contents</span>
                        <span className="text-oa-text-primary">
                          {selectedItem.children.filter(c => c.type === 'folder').length} folders,{' '}
                          {selectedItem.children.filter(c => c.type === 'file').length} files
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Folder description */}
                {selectedItem.type === 'folder' && (
                  <div className="bg-oa-bg-secondary rounded-lg p-4">
                    <h3 className="text-sm font-medium text-oa-text-primary mb-2">
                      About this folder
                    </h3>
                    <p className="text-sm text-oa-text-secondary">
                      {getFolderDescription(selectedItem.name)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Folder className="w-16 h-16 text-oa-text-secondary mb-4 opacity-50" />
              <p className="text-oa-text-secondary">
                Select a file or folder to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getFolderDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'challenges': 'Your active and completed challenges. Each challenge has its own folder with daily tasks, progress tracking, and check-in history.',
    'skills': 'Custom Claude Skills you\'ve created or installed. Skills extend OpenAnalyst\'s capabilities.',
    'prompts': 'Saved prompt templates for quick access. Create reusable prompts for common tasks.',
    'todos': 'Your task lists and to-do items, organized by date and priority.',
    'schedule': 'Calendar events and scheduled sessions. Track your time commitments.',
    'assets': 'Images, documents, and other files used in your projects.',
    'chats': 'Chat history with your agents. Conversations are saved for reference.',
    'profiles': 'User profile data including preferences and settings.',
    'agents': 'Custom agent configurations and their associated data.',
    'checkins': 'Daily check-in records tracking your progress and reflections.',
    'visionboards': 'Visual goal boards and inspiration collections.',
    'contracts': 'Accountability contracts and commitment agreements.',
    'diagrams': 'System diagrams and visual documentation.',
    'motivation': 'Motivational content and affirmations.',
  }
  return descriptions[name] || 'A folder containing your data and configurations.'
}

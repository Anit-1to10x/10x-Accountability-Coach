'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder, FolderOpen, FileText, Image, FileJson, File,
  ChevronRight, ChevronDown, RefreshCw, Zap, Database,
  MessageSquare, Target, Calendar, CheckSquare, Loader2,
  User, LayoutGrid, Activity, Cog
} from 'lucide-react'
import { FileViewer } from '@/components/agent/FileViewer'

interface FileItem {
  name: string
  type: 'file' | 'folder'
  path: string
  size?: number
  modified?: string
  children?: FileItem[]
  extension?: string
}

interface FileViewerState {
  content: string | null
  path: string | null
  loading: boolean
  isBinary: boolean
  category?: string
  url?: string
  size?: number
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

// Determine file category based on extension
const getFileCategory = (extension?: string): string => {
  if (!extension) return 'text'
  const ext = extension.toLowerCase()

  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']
  const videoExts = ['mp4', 'webm', 'mov', 'avi']
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a']
  const pdfExts = ['pdf']

  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (pdfExts.includes(ext)) return 'pdf'
  return 'text'
}

// Check if file is binary
const isBinaryFile = (extension?: string): boolean => {
  if (!extension) return false
  const ext = extension.toLowerCase()
  const binaryExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico',
                       'mp4', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'm4a',
                       'pdf', 'zip', 'tar', 'gz', 'exe', 'dll', 'so']
  return binaryExts.includes(ext)
}

// File/Folder Tree Item Component
function TreeItem({
  item,
  level = 0,
  onSelect,
  onDoubleClick,
  selectedPath,
}: {
  item: FileItem
  level?: number
  onSelect: (item: FileItem) => void
  onDoubleClick?: (item: FileItem) => void
  selectedPath?: string
}) {
  const [isExpanded, setIsExpanded] = useState(level < 1)
  const Icon = getIcon(item)
  const hasChildren = item.type === 'folder' && item.children && item.children.length > 0
  const folderColor = item.type === 'folder' ? getFolderColor(item.name) : ''
  const isSelected = selectedPath === item.path

  return (
    <div>
      <motion.div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-oa-accent/20 border border-oa-accent/50'
            : 'hover:bg-oa-bg-secondary'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (item.type === 'folder') {
            setIsExpanded(!isExpanded)
          }
          onSelect(item)
        }}
        onDoubleClick={() => {
          if (item.type === 'file' && onDoubleClick) {
            onDoubleClick(item)
          }
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
        <span className={`text-sm flex-1 truncate ${isSelected ? 'text-oa-accent font-medium' : 'text-oa-text-primary'}`}>
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
                onDoubleClick={onDoubleClick}
                selectedPath={selectedPath}
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
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [activeTab, setActiveTab] = useState<'files' | 'stats'>('files')
  const [fileViewer, setFileViewer] = useState<FileViewerState>({
    content: null,
    path: null,
    loading: false,
    isBinary: false,
  })

  useEffect(() => {
    loadWorkspace()
  }, [])

  // Re-fetch when files change via CLI
  useEffect(() => {
    const handler = () => loadWorkspace()
    window.addEventListener('file-sync', handler)
    return () => window.removeEventListener('file-sync', handler)
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

  const loadFileContent = async (item: FileItem) => {
    if (item.type !== 'file') return

    const category = getFileCategory(item.extension)
    const binary = isBinaryFile(item.extension)

    setFileViewer({
      content: null,
      path: item.path,
      loading: true,
      isBinary: binary,
      category,
      size: item.size,
    })

    try {
      // For binary files, just set the URL
      if (binary) {
        setFileViewer(prev => ({
          ...prev,
          loading: false,
          url: `/api/workspace/file?path=${encodeURIComponent(item.path)}`,
        }))
        return
      }

      // For text files, fetch the content
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(item.path)}`)
      if (res.ok) {
        const text = await res.text()
        setFileViewer(prev => ({
          ...prev,
          content: text,
          loading: false,
        }))
      } else {
        setFileViewer(prev => ({
          ...prev,
          content: `Error: Could not load file (${res.status})`,
          loading: false,
        }))
      }
    } catch (error) {
      console.error('Failed to load file:', error)
      setFileViewer(prev => ({
        ...prev,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        loading: false,
      }))
    }
  }

  // Single click - show details only
  const handleSelect = (item: FileItem) => {
    setSelectedItem(item)
    setShowFileViewer(false)
    // Clear file viewer state
    setFileViewer({
      content: null,
      path: null,
      loading: false,
      isBinary: false,
    })
  }

  // Double click - open file in FileViewer
  const handleOpenFile = (item: FileItem) => {
    if (item.type !== 'file') return
    setSelectedItem(item)
    setShowFileViewer(true)
    loadFileContent(item)
  }

  // Save file content to local directory
  const handleSaveFile = async (filePath: string, content: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/workspace/file', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath, content }),
      })

      const data = await res.json()

      if (data.success) {
        // Update the file viewer content after successful save
        setFileViewer(prev => ({
          ...prev,
          content: content,
        }))
        // Optionally refresh the workspace to update file sizes
        loadWorkspace()
        return true
      } else {
        console.error('Failed to save file:', data.error)
        return false
      }
    } catch (error) {
      console.error('Error saving file:', error)
      return false
    }
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
            <Database className="w-6 h-6 text-oa-accent" />
            <h1 className="text-2xl font-semibold text-oa-text-primary">
              Workspace
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex bg-oa-bg-secondary rounded-lg p-1">
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'files'
                    ? 'bg-oa-accent text-white'
                    : 'text-oa-text-secondary hover:text-oa-text-primary'
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'stats'
                    ? 'bg-oa-accent text-white'
                    : 'text-oa-text-secondary hover:text-oa-text-primary'
                }`}
              >
                Stats
              </button>
            </div>
            <button
              onClick={loadWorkspace}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-oa-text-secondary">
          <span className="flex items-center gap-1">
            <Folder size={14} />
            Local Files
          </span>
          <span>
            {folders} folders • {files} files
          </span>
          {selectedItem?.type === 'file' && (
            <span className="text-oa-accent">
              • Viewing: {selectedItem.name}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'files' ? (
          <>
            {/* File Tree */}
            <div className="w-1/3 min-w-[250px] max-w-[400px] border-r border-oa-border overflow-y-auto p-4">
              <div className="text-xs font-semibold text-oa-text-secondary uppercase tracking-wider mb-3 px-2">
                Data Folder
              </div>
              <div className="space-y-0.5">
                {contents.map((item) => (
                  <TreeItem
                    key={item.path}
                    item={item}
                    onSelect={handleSelect}
                    onDoubleClick={handleOpenFile}
                    selectedPath={selectedItem?.path}
                  />
                ))}
              </div>
            </div>

        {/* Preview/Details Panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedItem?.type === 'file' && showFileViewer ? (
            // Show FileViewer for files (on double click)
            <div className="flex-1 overflow-hidden">
              {fileViewer.loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-oa-accent" />
                  <span className="ml-2 text-oa-text-secondary">Loading file...</span>
                </div>
              ) : (
                <FileViewer
                  content={fileViewer.content}
                  path={fileViewer.path}
                  category={fileViewer.category}
                  isBinary={fileViewer.isBinary}
                  url={fileViewer.url}
                  size={fileViewer.size}
                  onSave={handleSaveFile}
                  editable={true}
                />
              )}
            </div>
          ) : selectedItem?.type === 'file' ? (
            // Show file details (on single click)
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                {React.createElement(getIcon(selectedItem), {
                  size: 32,
                  className: 'text-oa-text-secondary'
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
                        {selectedItem.extension ? `.${selectedItem.extension} file` : 'File'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-oa-text-secondary">Size</span>
                      <span className="text-oa-text-primary">{formatSize(selectedItem.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-oa-text-secondary">Category</span>
                      <span className="text-oa-text-primary capitalize">{getFileCategory(selectedItem.extension)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-oa-bg-secondary rounded-lg p-4">
                  <h3 className="text-sm font-medium text-oa-text-primary mb-2">
                    How to open
                  </h3>
                  <p className="text-sm text-oa-text-secondary">
                    Double-click on the file in the tree to open it in the file viewer.
                  </p>
                </div>
              </div>
            </div>
          ) : selectedItem?.type === 'folder' ? (
            // Show folder details
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                {React.createElement(getIcon(selectedItem), {
                  size: 32,
                  className: getFolderColor(selectedItem.name)
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
                      <span className="text-oa-text-primary capitalize">Folder</span>
                    </div>
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

                <div className="bg-oa-bg-secondary rounded-lg p-4">
                  <h3 className="text-sm font-medium text-oa-text-primary mb-2">
                    About this folder
                  </h3>
                  <p className="text-sm text-oa-text-secondary">
                    {getFolderDescription(selectedItem.name)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // No selection
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Folder className="w-16 h-16 text-oa-text-secondary mb-4 opacity-50" />
              <p className="text-oa-text-secondary">
                Select a file or folder to view details
              </p>
              <p className="text-xs text-oa-text-secondary mt-2">
                Single-click to view details, double-click to open file viewer
              </p>
            </div>
          )}
        </div>
          </>
        ) : (
          /* Stats View */
          <div className="flex-1 overflow-y-auto p-6">
            {/* Folder Statistics Grid */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-oa-accent" />
                <h3 className="font-medium text-oa-text-primary">Folder Statistics</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {contents.filter(item => item.type === 'folder').map((folder) => {
                  const Icon = getIcon(folder)
                  const color = getFolderColor(folder.name)
                  const childCount = folder.children?.length || 0
                  return (
                    <div
                      key={folder.path}
                      className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border hover:border-oa-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedItem(folder)
                        setActiveTab('files')
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className={color} />
                        <span className="text-sm font-medium text-oa-text-primary truncate">
                          {folder.name}
                        </span>
                      </div>
                      <p className="text-2xl font-semibold text-oa-text-primary">
                        {childCount}
                      </p>
                      <p className="text-xs text-oa-text-secondary">items</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-oa-bg-secondary rounded-lg p-6 border border-oa-border">
              <h3 className="font-medium text-oa-text-primary mb-4">Workspace Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-oa-text-secondary">Total Folders</p>
                  <p className="text-xl font-semibold text-oa-text-primary">{folders}</p>
                </div>
                <div>
                  <p className="text-sm text-oa-text-secondary">Total Files</p>
                  <p className="text-xl font-semibold text-oa-text-primary">{files}</p>
                </div>
                <div>
                  <p className="text-sm text-oa-text-secondary">Data Source</p>
                  <p className="text-xl font-semibold text-oa-text-primary">Local</p>
                </div>
                <div>
                  <p className="text-sm text-oa-text-secondary">Storage Location</p>
                  <p className="text-sm font-medium text-oa-accent">/data/</p>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="mt-8">
              <h3 className="font-medium text-oa-text-primary mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'challenges', label: 'Challenges', icon: Target, color: 'text-orange-500' },
                  { name: 'todos', label: 'Todos', icon: CheckSquare, color: 'text-green-500' },
                  { name: 'skills', label: 'Skills', icon: Zap, color: 'text-yellow-500' },
                  { name: 'prompts', label: 'Prompts', icon: MessageSquare, color: 'text-blue-500' },
                ].map((item) => {
                  const folder = contents.find(c => c.name === item.name)
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (folder) {
                          setSelectedItem(folder)
                          setActiveTab('files')
                        }
                      }}
                      className="flex items-center gap-3 p-3 bg-oa-bg-secondary rounded-lg border border-oa-border hover:border-oa-accent/50 transition-colors"
                    >
                      <item.icon size={20} className={item.color} />
                      <span className="text-sm text-oa-text-primary">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getFolderDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'challenges': 'Your active and completed challenges. Each challenge has its own folder with daily tasks, progress tracking, and check-in history.',
    'skills': 'Custom Claude Skills you\'ve created or installed. Skills extend 10X\'s capabilities.',
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

'use client'

import React, { useState, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, FileCode, FileJson, Image, RefreshCw, Search } from 'lucide-react'
import type { FileNode } from '@/types'

interface FileTreeProps {
  nodes: FileNode[]
  onSelect: (path: string) => void
  selectedPath: string | null
  onRefresh?: () => void
  isLoading?: boolean
}

export function FileTree({ nodes, onSelect, selectedPath, onRefresh, isLoading }: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes
    return filterNodes(nodes, searchQuery.toLowerCase())
  }, [nodes, searchQuery])

  // Toggle folder expansion
  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  // Expand all folders containing search results
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const pathsToExpand = new Set<string>()
      collectExpandPaths(filteredNodes, pathsToExpand)
      setExpandedPaths(pathsToExpand)
    }
  }, [searchQuery, filteredNodes])

  if (nodes.length === 0 && !isLoading) {
    return (
      <div className="p-4 text-center">
        <Folder className="w-8 h-8 text-oa-text-secondary/50 mx-auto mb-2" />
        <p className="text-xs text-oa-text-secondary">No files yet</p>
        <p className="text-xs text-oa-text-secondary/70 mt-1">Files will appear here as you work</p>
      </div>
    )
  }

  return (
    <div className="text-sm">
      {/* Search and refresh header */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-oa-border">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-oa-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-7 pr-2 py-1 text-xs bg-oa-bg-secondary rounded border border-oa-border focus:border-oa-accent outline-none"
          />
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 hover:bg-oa-bg-secondary rounded transition-colors"
            title="Refresh files"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-oa-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* File tree */}
      <div className="py-1 max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-oa-text-secondary animate-spin" />
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="p-4 text-center text-xs text-oa-text-secondary">
            No files matching "{searchQuery}"
          </div>
        ) : (
          filteredNodes.map((node) => (
            <MemoizedTreeNode
              key={node.path}
              node={node}
              onSelect={onSelect}
              selectedPath={selectedPath}
              level={0}
              expandedPaths={expandedPaths}
              onToggleExpand={toggleExpand}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Filter nodes recursively
function filterNodes(nodes: FileNode[], query: string): FileNode[] {
  return nodes.reduce((acc: FileNode[], node) => {
    const nameMatches = node.name.toLowerCase().includes(query)

    if (node.type === 'directory' && node.children) {
      const filteredChildren = filterNodes(node.children, query)
      if (filteredChildren.length > 0 || nameMatches) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        })
      }
    } else if (nameMatches) {
      acc.push(node)
    }

    return acc
  }, [])
}

// Collect paths to expand for search results
function collectExpandPaths(nodes: FileNode[], paths: Set<string>, parentPath: string = ''): boolean {
  let hasMatch = false
  for (const node of nodes) {
    if (node.type === 'directory' && node.children) {
      const childHasMatch = collectExpandPaths(node.children, paths, node.path)
      if (childHasMatch) {
        paths.add(node.path)
        hasMatch = true
      }
    } else {
      hasMatch = true
    }
  }
  return hasMatch
}

interface TreeNodeProps {
  node: FileNode
  onSelect: (path: string) => void
  selectedPath: string | null
  level: number
  expandedPaths: Set<string>
  onToggleExpand: (path: string) => void
}

// Get appropriate icon based on file extension
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400" />
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-blue-400" />
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'css':
    case 'html':
    case 'sql':
      return <FileCode className="w-4 h-4 text-green-400" />
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <FileText className="w-4 h-4 text-emerald-400" />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className="w-4 h-4 text-purple-400" />
    default:
      return <FileText className="w-4 h-4 text-oa-text-secondary" />
  }
}

function TreeNode({ node, onSelect, selectedPath, level, expandedPaths, onToggleExpand }: TreeNodeProps) {
  const isExpanded = expandedPaths.has(node.path) || level === 0
  const isSelected = selectedPath === node.path
  const isDirectory = node.type === 'directory'

  const handleClick = useCallback(() => {
    if (isDirectory) {
      onToggleExpand(node.path)
    } else {
      onSelect(node.path)
    }
  }, [isDirectory, node.path, onSelect, onToggleExpand])

  return (
    <div>
      <motion.button
        onClick={handleClick}
        title={node.path}
        initial={false}
        animate={{ backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}
        whileHover={{ backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)' }}
        className={`w-full text-left py-1.5 transition-colors flex items-center gap-1.5 group ${
          isSelected
            ? 'text-oa-accent border-l-2 border-oa-accent'
            : 'border-l-2 border-transparent hover:border-oa-border'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px`, paddingRight: '8px' }}
      >
        {/* Expand/collapse chevron for directories */}
        {isDirectory ? (
          <motion.span
            className="w-4 h-4 flex items-center justify-center flex-shrink-0"
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-oa-text-secondary" />
          </motion.span>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}

        {/* Icon */}
        <span className="flex-shrink-0">
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400" />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </span>

        {/* Name */}
        <span className={`truncate text-xs ${isSelected ? 'font-medium' : ''}`}>
          {node.name}
        </span>

        {/* File size indicator for files */}
        {!isDirectory && node.size !== undefined && (
          <span className="ml-auto text-[10px] text-oa-text-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatFileSize(node.size)}
          </span>
        )}
      </motion.button>

      {/* Children with animation */}
      <AnimatePresence initial={false}>
        {isDirectory && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.map((child) => (
              <MemoizedTreeNode
                key={child.path}
                node={child}
                onSelect={onSelect}
                selectedPath={selectedPath}
                level={level + 1}
                expandedPaths={expandedPaths}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Memoized version for performance
const MemoizedTreeNode = memo(TreeNode, (prev, next) => {
  return (
    prev.node === next.node &&
    prev.selectedPath === next.selectedPath &&
    prev.level === next.level &&
    prev.expandedPaths === next.expandedPaths
  )
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

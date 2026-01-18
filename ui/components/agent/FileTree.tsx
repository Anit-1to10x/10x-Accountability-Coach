'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, FileCode, FileJson, Image } from 'lucide-react'
import type { FileNode } from '@/types'

interface FileTreeProps {
  nodes: FileNode[]
  onSelect: (path: string) => void
  selectedPath: string | null
}

export function FileTree({ nodes, onSelect, selectedPath }: FileTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="p-4 text-center">
        <Folder className="w-8 h-8 text-oa-text-secondary/50 mx-auto mb-2" />
        <p className="text-xs text-oa-text-secondary">No files yet</p>
        <p className="text-xs text-oa-text-secondary/70 mt-1">Files will appear here as you work</p>
      </div>
    )
  }

  return (
    <div className="text-sm py-2">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          onSelect={onSelect}
          selectedPath={selectedPath}
          level={0}
        />
      ))}
    </div>
  )
}

interface TreeNodeProps {
  node: FileNode
  onSelect: (path: string) => void
  selectedPath: string | null
  level: number
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
      return <FileCode className="w-4 h-4 text-green-400" />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <Image className="w-4 h-4 text-purple-400" />
    default:
      return <FileText className="w-4 h-4 text-oa-text-secondary" />
  }
}

function TreeNode({ node, onSelect, selectedPath, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const isSelected = selectedPath === node.path
  const isDirectory = node.type === 'directory'

  return (
    <div>
      <button
        onClick={() => {
          if (isDirectory) {
            setIsExpanded(!isExpanded)
          } else {
            onSelect(node.path)
          }
        }}
        title={node.path}
        className={`w-full text-left py-1.5 hover:bg-oa-bg-secondary/80 transition-colors flex items-center gap-1.5 group ${
          isSelected
            ? 'bg-oa-accent/10 text-oa-accent border-l-2 border-oa-accent'
            : 'border-l-2 border-transparent hover:border-oa-border'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px`, paddingRight: '8px' }}
      >
        {/* Expand/collapse chevron for directories */}
        {isDirectory ? (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-oa-text-secondary" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-oa-text-secondary" />
            )}
          </span>
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
      </button>

      {/* Children */}
      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              onSelect={onSelect}
              selectedPath={selectedPath}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

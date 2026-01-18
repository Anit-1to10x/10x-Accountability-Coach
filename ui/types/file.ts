// File system type definitions

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  size?: number
  modified?: string
}

export interface FileContent {
  path: string
  content: string
  type: 'markdown' | 'json' | 'text'
}

export interface FileOperation {
  action: 'read' | 'write' | 'delete' | 'rename'
  path: string
  content?: string
  newPath?: string
}

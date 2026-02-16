/**
 * File Processing System
 *
 * Handles file uploads with intelligent chunking for AI context.
 * Files are processed and stored with metadata for efficient retrieval.
 */

import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from './paths'

// Chunk size limits
const MAX_CHUNK_SIZE = 4000 // Characters per chunk (fits in context window)
const MAX_CONTEXT_CHUNKS = 3 // Max chunks to include in initial context
const MAX_TOTAL_CONTEXT = 10000 // Max total characters for file context

// File type configurations
interface FileTypeConfig {
  category: 'code' | 'data' | 'document' | 'binary'
  chunkable: boolean
  extractStructure: boolean
  summarizable: boolean
}

const FILE_TYPE_CONFIG: Record<string, FileTypeConfig> = {
  // Code files
  '.js': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },
  '.ts': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },
  '.jsx': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },
  '.tsx': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },
  '.py': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },
  '.java': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },
  '.css': { category: 'code', chunkable: true, extractStructure: false, summarizable: false },
  '.html': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },
  '.sql': { category: 'code', chunkable: true, extractStructure: true, summarizable: true },

  // Data files
  '.json': { category: 'data', chunkable: true, extractStructure: true, summarizable: true },
  '.csv': { category: 'data', chunkable: true, extractStructure: true, summarizable: true },
  '.yaml': { category: 'data', chunkable: true, extractStructure: true, summarizable: true },
  '.yml': { category: 'data', chunkable: true, extractStructure: true, summarizable: true },
  '.xml': { category: 'data', chunkable: true, extractStructure: true, summarizable: true },

  // Document files
  '.md': { category: 'document', chunkable: true, extractStructure: true, summarizable: true },
  '.txt': { category: 'document', chunkable: true, extractStructure: false, summarizable: true },

  // Binary files (not chunkable)
  '.png': { category: 'binary', chunkable: false, extractStructure: false, summarizable: false },
  '.jpg': { category: 'binary', chunkable: false, extractStructure: false, summarizable: false },
  '.jpeg': { category: 'binary', chunkable: false, extractStructure: false, summarizable: false },
  '.gif': { category: 'binary', chunkable: false, extractStructure: false, summarizable: false },
  '.pdf': { category: 'binary', chunkable: false, extractStructure: false, summarizable: false },
  '.mp4': { category: 'binary', chunkable: false, extractStructure: false, summarizable: false },
  '.mp3': { category: 'binary', chunkable: false, extractStructure: false, summarizable: false },
}

// Processed file structure
export interface ProcessedFile {
  id: string
  name: string
  path: string
  extension: string
  category: 'code' | 'data' | 'document' | 'binary'
  size: number
  totalChunks: number
  structure?: FileStructure
  summary?: string
  chunks: FileChunk[]
  metadata: FileMetadata
  processedAt: string
}

export interface FileChunk {
  index: number
  content: string
  startLine: number
  endLine: number
  size: number
}

export interface FileStructure {
  type: string
  headers?: string[] // For CSV
  columns?: number
  rows?: number
  keys?: string[] // For JSON
  functions?: string[] // For code
  classes?: string[] // For code
  sections?: string[] // For markdown
}

export interface FileMetadata {
  mimeType: string
  encoding: string
  lineCount: number
  wordCount: number
  language?: string
}

/**
 * Process a file for AI context
 */
export async function processFile(
  filePath: string,
  content: string | Buffer
): Promise<ProcessedFile> {
  const ext = path.extname(filePath).toLowerCase()
  const name = path.basename(filePath)
  const config = FILE_TYPE_CONFIG[ext] || { category: 'document', chunkable: true, extractStructure: false, summarizable: false }

  // Convert buffer to string for text files and normalize line endings
  const textContent = (Buffer.isBuffer(content) ? content.toString('utf-8') : content).replace(/\r\n/g, '\n')

  // Generate file ID
  const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Extract metadata
  const metadata = extractMetadata(textContent, ext)

  // Extract structure if applicable
  let structure: FileStructure | undefined
  if (config.extractStructure) {
    structure = extractStructure(textContent, ext)
  }

  // Create chunks
  const chunks = config.chunkable ? createChunks(textContent, ext) : []

  // Generate summary for first chunk
  const summary = chunks.length > 0 ? generateFileSummary(textContent, ext, structure) : undefined

  return {
    id,
    name,
    path: filePath,
    extension: ext,
    category: config.category,
    size: textContent.length,
    totalChunks: chunks.length,
    structure,
    summary,
    chunks,
    metadata,
    processedAt: new Date().toISOString(),
  }
}

/**
 * Extract file metadata
 */
function extractMetadata(content: string, ext: string): FileMetadata {
  const lines = content.split('\n')
  const words = content.split(/\s+/).filter(w => w.length > 0)

  const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.py': 'text/x-python',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
  }

  return {
    mimeType: mimeTypes[ext] || 'text/plain',
    encoding: 'utf-8',
    lineCount: lines.length,
    wordCount: words.length,
    language: getLanguage(ext),
  }
}

/**
 * Get programming language from extension
 */
function getLanguage(ext: string): string | undefined {
  const languages: Record<string, string> = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.py': 'Python',
    '.java': 'Java',
    '.css': 'CSS',
    '.html': 'HTML',
    '.sql': 'SQL',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.md': 'Markdown',
  }
  return languages[ext]
}

/**
 * Extract structure from file content
 */
function extractStructure(content: string, ext: string): FileStructure {
  switch (ext) {
    case '.csv':
      return extractCSVStructure(content)
    case '.json':
      return extractJSONStructure(content)
    case '.py':
      return extractPythonStructure(content)
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
      return extractJSStructure(content)
    case '.md':
      return extractMarkdownStructure(content)
    default:
      return { type: 'unknown' }
  }
}

/**
 * Extract CSV structure
 */
function extractCSVStructure(content: string): FileStructure {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length === 0) return { type: 'csv', rows: 0, columns: 0 }

  // Parse header
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine)

  return {
    type: 'csv',
    headers,
    columns: headers.length,
    rows: lines.length - 1, // Exclude header
  }
}

/**
 * Parse a CSV line handling quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Extract JSON structure
 */
function extractJSONStructure(content: string): FileStructure {
  try {
    const parsed = JSON.parse(content)

    if (Array.isArray(parsed)) {
      const firstItem = parsed[0]
      return {
        type: 'json-array',
        rows: parsed.length,
        keys: firstItem && typeof firstItem === 'object' ? Object.keys(firstItem) : undefined,
      }
    } else if (typeof parsed === 'object') {
      return {
        type: 'json-object',
        keys: Object.keys(parsed),
      }
    }
  } catch {
    // Invalid JSON
  }

  return { type: 'json' }
}

/**
 * Extract Python structure
 */
function extractPythonStructure(content: string): FileStructure {
  const functions: string[] = []
  const classes: string[] = []

  const lines = content.split('\n')
  for (const line of lines) {
    const funcMatch = line.match(/^def\s+(\w+)\s*\(/)
    if (funcMatch) {
      functions.push(funcMatch[1])
    }

    const classMatch = line.match(/^class\s+(\w+)/)
    if (classMatch) {
      classes.push(classMatch[1])
    }
  }

  return {
    type: 'python',
    functions,
    classes,
  }
}

/**
 * Extract JavaScript/TypeScript structure
 */
function extractJSStructure(content: string): FileStructure {
  const functions: string[] = []
  const classes: string[] = []

  // Match function declarations
  const funcMatches = content.matchAll(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\()/g)
  for (const match of funcMatches) {
    const name = match[1] || match[2] || match[3]
    if (name && !functions.includes(name)) {
      functions.push(name)
    }
  }

  // Match class declarations
  const classMatches = content.matchAll(/class\s+(\w+)/g)
  for (const match of classMatches) {
    if (!classes.includes(match[1])) {
      classes.push(match[1])
    }
  }

  return {
    type: 'javascript',
    functions: functions.slice(0, 20), // Limit
    classes,
  }
}

/**
 * Extract Markdown structure
 */
function extractMarkdownStructure(content: string): FileStructure {
  const sections: string[] = []

  const lines = content.split('\n')
  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const title = headerMatch[2].trim()
      sections.push(`${'  '.repeat(level - 1)}${title}`)
    }
  }

  return {
    type: 'markdown',
    sections,
  }
}

/**
 * Create chunks from content
 */
function createChunks(content: string, ext: string): FileChunk[] {
  const lines = content.split('\n')
  const chunks: FileChunk[] = []
  let currentChunk = ''
  let startLine = 0
  let currentLine = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const newContent = currentChunk + (currentChunk ? '\n' : '') + line

    if (newContent.length > MAX_CHUNK_SIZE && currentChunk) {
      // Save current chunk
      chunks.push({
        index: chunks.length,
        content: currentChunk,
        startLine,
        endLine: currentLine - 1,
        size: currentChunk.length,
      })

      // Start new chunk
      currentChunk = line
      startLine = i
    } else {
      currentChunk = newContent
    }
    currentLine = i
  }

  // Save last chunk
  if (currentChunk) {
    chunks.push({
      index: chunks.length,
      content: currentChunk,
      startLine,
      endLine: lines.length - 1,
      size: currentChunk.length,
    })
  }

  return chunks
}

/**
 * Generate a brief summary of the file
 */
function generateFileSummary(content: string, ext: string, structure?: FileStructure): string {
  const lines = content.split('\n').length
  const chars = content.length

  let summary = `File: ${lines} lines, ${chars} characters`

  if (structure) {
    switch (structure.type) {
      case 'csv':
        summary = `CSV file with ${structure.columns} columns and ${structure.rows} rows`
        if (structure.headers?.length) {
          summary += `. Columns: ${structure.headers.slice(0, 5).join(', ')}${structure.headers.length > 5 ? '...' : ''}`
        }
        break

      case 'json-array':
        summary = `JSON array with ${structure.rows} items`
        if (structure.keys?.length) {
          summary += `. Keys: ${structure.keys.slice(0, 5).join(', ')}${structure.keys.length > 5 ? '...' : ''}`
        }
        break

      case 'json-object':
        summary = `JSON object`
        if (structure.keys?.length) {
          summary += ` with keys: ${structure.keys.slice(0, 5).join(', ')}${structure.keys.length > 5 ? '...' : ''}`
        }
        break

      case 'python':
        const pyParts = []
        if (structure.classes?.length) pyParts.push(`${structure.classes.length} classes`)
        if (structure.functions?.length) pyParts.push(`${structure.functions.length} functions`)
        summary = `Python file with ${pyParts.join(', ') || 'no major definitions'}`
        break

      case 'javascript':
        const jsParts = []
        if (structure.classes?.length) jsParts.push(`${structure.classes.length} classes`)
        if (structure.functions?.length) jsParts.push(`${structure.functions.length} functions`)
        summary = `JavaScript/TypeScript file with ${jsParts.join(', ') || 'no major definitions'}`
        break

      case 'markdown':
        summary = `Markdown document`
        if (structure.sections?.length) {
          summary += ` with ${structure.sections.length} sections`
        }
        break
    }
  }

  return summary
}

/**
 * Get relevant chunks for a query
 * Returns chunks most likely to contain relevant information
 */
export function getRelevantChunks(
  file: ProcessedFile,
  query?: string,
  maxChunks: number = MAX_CONTEXT_CHUNKS
): FileChunk[] {
  if (!file.chunks.length) return []

  // For now, return first chunks (can be enhanced with semantic search)
  // In future: Use embeddings to find most relevant chunks

  let remainingSize = MAX_TOTAL_CONTEXT
  const relevantChunks: FileChunk[] = []

  for (const chunk of file.chunks) {
    if (relevantChunks.length >= maxChunks) break
    if (chunk.size > remainingSize) continue

    relevantChunks.push(chunk)
    remainingSize -= chunk.size
  }

  return relevantChunks
}

/**
 * Format file context for AI prompt
 */
export function formatFileContext(file: ProcessedFile, chunks?: FileChunk[]): string {
  const selectedChunks = chunks || getRelevantChunks(file)

  let context = `## Attached File: ${file.name}\n`
  context += `**Type:** ${file.metadata.language || file.extension}\n`
  context += `**Summary:** ${file.summary || 'No summary available'}\n`

  if (file.structure) {
    if (file.structure.headers) {
      context += `**Columns:** ${file.structure.headers.join(', ')}\n`
    }
    if (file.structure.keys) {
      context += `**Keys:** ${file.structure.keys.join(', ')}\n`
    }
    if (file.structure.functions?.length) {
      context += `**Functions:** ${file.structure.functions.join(', ')}\n`
    }
    if (file.structure.classes?.length) {
      context += `**Classes:** ${file.structure.classes.join(', ')}\n`
    }
  }

  context += `\n### Content (${selectedChunks.length} of ${file.totalChunks} chunks):\n`

  for (const chunk of selectedChunks) {
    context += `\n\`\`\`${file.metadata.language?.toLowerCase() || ''}\n`
    context += `// Lines ${chunk.startLine + 1}-${chunk.endLine + 1}\n`
    context += chunk.content
    context += `\n\`\`\`\n`
  }

  if (selectedChunks.length < file.totalChunks) {
    context += `\n*Note: Showing ${selectedChunks.length} of ${file.totalChunks} chunks. Ask for more if needed.*\n`
  }

  return context
}

/**
 * Store processed file reference
 */
export async function storeFileReference(
  file: ProcessedFile,
  agentId: string
): Promise<void> {
  const refDir = path.join(DATA_DIR, 'agents', agentId, '.file-refs')
  await fs.mkdir(refDir, { recursive: true })

  // Store without full content to save space
  const reference = {
    ...file,
    chunks: file.chunks.map(c => ({
      index: c.index,
      startLine: c.startLine,
      endLine: c.endLine,
      size: c.size,
      // Don't store content in reference - read from file when needed
    })),
  }

  await fs.writeFile(
    path.join(refDir, `${file.id}.json`),
    JSON.stringify(reference, null, 2)
  )
}

/**
 * Load file reference
 */
export async function loadFileReference(
  fileId: string,
  agentId: string
): Promise<ProcessedFile | null> {
  try {
    const refPath = path.join(DATA_DIR, 'agents', agentId, '.file-refs', `${fileId}.json`)
    const content = await fs.readFile(refPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Get specific chunk content from original file
 */
export async function getChunkContent(
  file: ProcessedFile,
  chunkIndex: number
): Promise<string | null> {
  try {
    const content = await fs.readFile(file.path, 'utf-8')
    const chunks = createChunks(content, file.extension)
    return chunks[chunkIndex]?.content || null
  } catch {
    return null
  }
}

import chokidar from 'chokidar'
import path from 'path'
import { DATA_DIR } from './paths'

const DATA_WATCH_DIR = DATA_DIR

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink'
  path: string
  category: 'profile' | 'challenge' | 'checkin' | 'contract' | 'schedule' | 'agent' | 'todo' | 'chat' | 'visionboard' | 'punishment' | 'plan' | 'skill' | 'prompt' | 'other'
}

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null
  private listeners: ((event: FileChangeEvent) => void)[] = []

  start() {
    if (this.watcher) {
      console.warn('File watcher already started')
      return
    }

    console.log(`Starting file watcher for: ${DATA_WATCH_DIR}`)

    this.watcher = chokidar.watch(DATA_WATCH_DIR, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    })

    this.watcher
      .on('add', (filePath) => this.handleChange('add', filePath))
      .on('change', (filePath) => this.handleChange('change', filePath))
      .on('unlink', (filePath) => this.handleChange('unlink', filePath))
      .on('error', (error) => console.error('File watcher error:', error))

    console.log('File watcher started successfully')
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
      console.log('File watcher stopped')
    }
  }

  /** Emit a synthetic event to all listeners (used by /api/sync) */
  emit(event: FileChangeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in file change listener:', error)
      }
    })
  }

  onChange(listener: (event: FileChangeEvent) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private handleChange(type: 'add' | 'change' | 'unlink', filePath: string) {
    const event: FileChangeEvent = {
      type,
      path: filePath,
      category: this.categorizeFile(filePath),
    }

    console.log(`File ${type}:`, filePath)

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in file change listener:', error)
      }
    })
  }

  private categorizeFile(filePath: string): FileChangeEvent['category'] {
    // Normalize to forward slashes for cross-platform matching (Windows uses backslashes)
    const normalized = filePath.replace(/\\/g, '/')
    if (normalized.includes('/profiles/') || normalized.includes('/profile/')) return 'profile'
    if (normalized.includes('/challenges/')) return 'challenge'
    if (normalized.includes('/checkins/')) return 'checkin'
    if (normalized.includes('/contracts/')) return 'contract'
    if (normalized.includes('/schedule/')) return 'schedule'
    if (normalized.includes('/agents') || normalized.includes('agents.json') || normalized.includes('agent-capabilities.json')) return 'agent'
    if (normalized.includes('/todos/')) return 'todo'
    if (normalized.includes('/chats/')) return 'chat'
    if (normalized.includes('/visionboards/')) return 'visionboard'
    if (normalized.includes('/punishments/')) return 'punishment'
    if (normalized.includes('/plans/') || normalized.endsWith('/plan.md')) return 'plan'
    if (normalized.includes('/skills/') || normalized.includes('SKILL.md')) return 'skill'
    if (normalized.includes('/prompts/')) return 'prompt'
    return 'other'
  }
}

// Singleton instance
let instance: FileWatcher | null = null

export function getFileWatcher(): FileWatcher {
  if (!instance) {
    instance = new FileWatcher()
  }
  return instance
}

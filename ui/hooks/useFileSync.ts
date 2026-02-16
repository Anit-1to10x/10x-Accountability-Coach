'use client'

import { useEffect, useRef } from 'react'
import { useProfileStore, useAgentStore, useTodoStore, useChallengeStore } from '@/lib/store'

type FileCategory = 'profile' | 'challenge' | 'checkin' | 'contract' | 'schedule' | 'agent' | 'todo' | 'chat' | 'visionboard' | 'punishment' | 'plan' | 'skill' | 'prompt' | 'other'

interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'sync'
  path: string
  category: FileCategory
}

const DEBOUNCE_MS = 400
const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30000

/**
 * Subscribes to /api/events SSE endpoint and triggers Zustand store
 * refreshes when files change on disk (e.g. via CLI commands).
 */
export function useFileSync() {
  const esRef = useRef<EventSource | null>(null)
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const reconnectAttempt = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    function debouncedRefresh(category: string, fn: () => void) {
      if (debounceTimers.current[category]) {
        clearTimeout(debounceTimers.current[category])
      }
      debounceTimers.current[category] = setTimeout(fn, DEBOUNCE_MS)
    }

    function handleEvent(event: FileChangeEvent) {
      // Always dispatch file-sync event so components with local state can re-fetch
      debouncedRefresh(event.category, () => {
        // Refresh Zustand stores
        switch (event.category) {
          case 'challenge':
            useChallengeStore.getState().loadChallenges()
            break
          case 'todo':
            useTodoStore.getState().loadTodos()
            break
          case 'agent':
            useAgentStore.getState().loadAgents()
            break
          case 'profile':
            useProfileStore.getState().loadProfiles()
            break
        }
        // Notify all components listening for file changes
        window.dispatchEvent(new CustomEvent('file-sync', { detail: event }))
      })
    }

    function connect() {
      if (!mountedRef.current) return
      if (esRef.current) {
        esRef.current.close()
      }

      const es = new EventSource('/api/events')
      esRef.current = es

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          if (data.type === 'connected') {
            reconnectAttempt.current = 0
            return
          }
          handleEvent(data as FileChangeEvent)
        } catch {
          // ignore parse errors
        }
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        if (!mountedRef.current) return
        // Exponential backoff reconnect
        const delay = Math.min(
          RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt.current),
          RECONNECT_MAX_MS
        )
        reconnectAttempt.current++
        setTimeout(connect, delay)
      }
    }

    // Only connect when tab is visible
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
          connect()
        }
      } else {
        if (esRef.current) {
          esRef.current.close()
          esRef.current = null
        }
      }
    }

    connect()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      mountedRef.current = false
      document.removeEventListener('visibilitychange', handleVisibility)
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
      Object.values(debounceTimers.current).forEach(clearTimeout)
    }
  }, [])
}

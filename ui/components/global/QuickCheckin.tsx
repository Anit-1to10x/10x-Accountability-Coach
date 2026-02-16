'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { CheckinModal } from '@/components/checkin/CheckinModal'
import { useChallengeStore } from '@/lib/store'
import { addProfileId, useProfileId } from '@/lib/useProfileId'
import { getTodayString } from '@/lib/datetime'

export function QuickCheckin() {
  const pathname = usePathname()
  const profileId = useProfileId()
  const [showModal, setShowModal] = useState(false)
  const [hasTodayTasks, setHasTodayTasks] = useState(false)
  const [todayTask, setTodayTask] = useState<any>(null)
  const { challenges, loadChallenges } = useChallengeStore()

  useEffect(() => {
    loadChallenges()
  }, [])

  // Re-fetch when files change via CLI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.category === 'challenge' || detail?.category === 'todo') {
        loadChallenges()
        checkTodayTasks()
      }
    }
    window.addEventListener('file-sync', handler)
    return () => window.removeEventListener('file-sync', handler)
  }, [profileId])

  const checkTodayTasks = async () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      let url = addProfileId('/api/todos/from-challenges', profileId)
      url += (url.includes('?') ? '&' : '?') + `timezone=${encodeURIComponent(tz)}`
      const res = await fetch(url)
      const data = await res.json()
      const tasks = data.tasks || []

      const today = getTodayString(tz)
      const todayTasks = tasks.filter((t: any) => t.dueDate === today && !t.completed)

      setHasTodayTasks(todayTasks.length > 0)
      if (todayTasks.length > 0) {
        setTodayTask(todayTasks[0])
      }
    } catch (error) {
      console.error('Failed to check today tasks:', error)
    }
  }

  // Check if there are tasks for today
  useEffect(() => {
    checkTodayTasks()
  }, [profileId])

  const activeChallenge = Array.isArray(challenges) ? challenges.find((c) => c.status === 'active') : undefined
  const isChatPage = pathname === '/app' || pathname === '/'
  const showPulse = !isChatPage && hasTodayTasks

  // Don't render the button at all if no tasks today
  if (!hasTodayTasks) return null

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 group"
        title="Daily Check-in"
      >
        {/* Pulse rings — only on non-chat pages when tasks exist */}
        {showPulse && (
          <>
            <span className="absolute inset-0 rounded-full bg-oa-accent/30 animate-[checkin-ping_2s_ease-out_infinite]" />
            <span className="absolute inset-0 rounded-full bg-oa-accent/20 animate-[checkin-ping_2s_ease-out_infinite_0.6s]" />
          </>
        )}
        <span className="relative flex items-center justify-center w-14 h-14 bg-oa-accent text-white rounded-full text-2xl shadow-lg group-hover:scale-110 transition-transform">
          ✓
        </span>
      </button>
      <CheckinModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        challenge={activeChallenge}
        todayTask={todayTask}
      />
    </>
  )
}

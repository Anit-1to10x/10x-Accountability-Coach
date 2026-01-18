'use client'

import React, { useState, useEffect } from 'react'
import { CheckinModal } from '@/components/checkin/CheckinModal'
import { useChallengeStore } from '@/lib/store'

export function QuickCheckin() {
  const [showModal, setShowModal] = useState(false)
  const [todayTask, setTodayTask] = useState<any>(null)
  const { challenges, loadChallenges } = useChallengeStore()

  useEffect(() => {
    loadChallenges()
  }, [])

  useEffect(() => {
    // Get today's task from schedule
    const fetchTodayTask = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/schedule/today?date=${today}`)
        const data = await response.json()
        if (data.task) {
          setTodayTask(data.task)
        }
      } catch (error) {
        console.error('Failed to fetch today task:', error)
      }
    }
    fetchTodayTask()
  }, [])

  const activeChallenge = Array.isArray(challenges) ? challenges.find((c) => c.status === 'active') : undefined

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-oa-text-primary text-oa-bg-primary rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform shadow-lg z-40"
        title="Daily Check-in"
      >
        ✓
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

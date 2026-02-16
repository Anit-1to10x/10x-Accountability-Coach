'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { FirstTimeWelcomeDialog } from './FirstTimeWelcomeDialog'
import { DailySummaryDialog } from './DailySummaryDialog'
import { MandatoryOnboarding } from './MandatoryOnboarding'
import { useProfileId } from '@/lib/useProfileId'

/**
 * Welcome Dialog Manager
 *
 * Determines which dialog to show based on user status:
 * - NO PROFILE: MandatoryOnboarding (cannot be skipped, must complete)
 * - NEW users with profile: FirstTimeWelcomeDialog (shows only once, ever)
 * - RETURNING users: DailySummaryDialog (shows on each session)
 *
 * Uses localStorage to track:
 * - activeProfileId: Whether user has completed onboarding
 * - welcomeCompleted_{profileId}: Whether first-time welcome was shown
 * - lastSessionDate_{profileId}: Last date the daily summary was shown
 */
export function WelcomeDialogManager() {
  const profileId = useProfileId()
  const [showMandatoryOnboarding, setShowMandatoryOnboarding] = useState(false)
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState(false)
  const [showDailySummary, setShowDailySummary] = useState(false)
  const [userName, setUserName] = useState('there')
  const [isChecking, setIsChecking] = useState(true)

  const checkDialogStatus = useCallback(async () => {
    setIsChecking(true)

    try {
      // Check if first-time welcome was completed
      const welcomeKey = `welcomeCompleted_${profileId}`
      const welcomeCompleted = localStorage.getItem(welcomeKey) === 'true'

      // Get user name
      try {
        const response = await fetch(`/api/user/profile?profileId=${profileId}`)
        if (response.ok) {
          const profile = await response.json()
          setUserName(profile.name || 'there')
        }
      } catch {
        // Use default name
      }

      if (!welcomeCompleted) {
        // First-time user - show welcome dialog
        setShowFirstTimeWelcome(true)
        setShowDailySummary(false)
      } else {
        // Returning user - check if daily summary should be shown
        const sessionKey = `lastSessionDate_${profileId}`
        const lastSession = localStorage.getItem(sessionKey)
        const today = new Date().toDateString()

        if (lastSession !== today) {
          // New session/day - show daily summary
          setShowDailySummary(true)
          setShowFirstTimeWelcome(false)

          // Mark this session
          localStorage.setItem(sessionKey, today)
        }
      }
    } catch (error) {
      console.error('Failed to check dialog status:', error)
    } finally {
      setIsChecking(false)
    }
  }, [profileId])

  useEffect(() => {
    // No profile means user needs mandatory onboarding
    if (!profileId) {
      setShowMandatoryOnboarding(true)
      setIsChecking(false)
      return
    }

    // Has profile, check dialog status
    setShowMandatoryOnboarding(false)
    checkDialogStatus()
  }, [profileId, checkDialogStatus])

  const handleMandatoryOnboardingComplete = (data: { name: string; email: string }) => {
    setShowMandatoryOnboarding(false)
    setUserName(data.name)
    // After mandatory onboarding, show the first-time welcome
    setShowFirstTimeWelcome(true)
  }

  const handleFirstTimeComplete = () => {
    if (profileId) {
      const welcomeKey = `welcomeCompleted_${profileId}`
      localStorage.setItem(welcomeKey, 'true')

      // Also mark today's session
      const sessionKey = `lastSessionDate_${profileId}`
      localStorage.setItem(sessionKey, new Date().toDateString())
    }
    setShowFirstTimeWelcome(false)
  }

  const handleDailySummaryClose = () => {
    setShowDailySummary(false)
  }

  if (isChecking) return null

  return (
    <>
      {/* Mandatory onboarding - cannot be skipped */}
      {showMandatoryOnboarding && (
        <MandatoryOnboarding onComplete={handleMandatoryOnboardingComplete} />
      )}

      {/* First-time welcome - shown after profile is created */}
      <FirstTimeWelcomeDialog
        isOpen={showFirstTimeWelcome && !showMandatoryOnboarding}
        onClose={() => setShowFirstTimeWelcome(false)}
        userName={userName}
        onComplete={handleFirstTimeComplete}
      />

      {/* Daily summary - shown on each new session */}
      <DailySummaryDialog
        isOpen={showDailySummary && !showMandatoryOnboarding}
        onClose={handleDailySummaryClose}
      />
    </>
  )
}

export default WelcomeDialogManager

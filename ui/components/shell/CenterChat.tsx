'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnifiedChat } from '@/components/chat'
import { DailyCheckIn } from '@/components/checkin/DailyCheckIn'
import { SkillCreator } from '@/components/skills/SkillCreator'
import { isOnboardingRequired } from '@/lib/adaptiveOnboarding'

export function CenterChat() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showSkillCreator, setShowSkillCreator] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      const needsOnboarding = await isOnboardingRequired()

      if (needsOnboarding) {
        // Redirect to onboarding mode
        router.push('/app?onboarding=true')
      }

      setIsChecking(false)
    }

    checkOnboarding()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-oa-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <UnifiedChat
        onCheckinClick={() => setShowCheckIn(true)}
        onCreateSkillClick={() => setShowSkillCreator(true)}
      />
      <DailyCheckIn
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
      />
      <SkillCreator
        isOpen={showSkillCreator}
        onClose={() => setShowSkillCreator(false)}
        agentId="unified"
      />
    </>
  )
}

'use client'

import React, { useState } from 'react'
import { UnifiedChat } from '@/components/chat'
import { DailyCheckIn } from '@/components/checkin/DailyCheckIn'
import { SkillCreator } from '@/components/skills/SkillCreator'

export function CenterChat() {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showSkillCreator, setShowSkillCreator] = useState(false)

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

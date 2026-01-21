'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChatStore, useOnboardingStore, useAgentStore } from '@/lib/store'
import { ChatGreeting } from './ChatGreeting'
import { ChatInputEnhanced } from './ChatInputEnhanced'
import { QuickActionsPanel } from './QuickActionsPanel'
import { ChatMessageWithOptions } from './ChatMessageWithOptions'
import { StreamingStatus } from './StreamingStatus'
import { isOnboardingRequired, loadUserContext, generateContextualOpening } from '@/lib/adaptiveOnboarding'
import { getNextStep, getFirstStep } from '@/lib/onboardingStateMachine'
import type { Agent } from '@/types'
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'

interface UnifiedChatProps {
  agent?: Agent
  onCheckinClick?: () => void
  onCreateSkillClick?: () => void
}

export function UnifiedChat({ agent, onCheckinClick, onCreateSkillClick }: UnifiedChatProps) {
  const { messages, isTyping, streamingPhase, streamingDetails, addMessage, sendMessage, markMessageAnswered } = useChatStore()
  const { answerStep, responses, isActive: onboardingActive } = useOnboardingStore()
  const { getSelectedAgents } = useAgentStore()
  const selectedAgents = getSelectedAgents()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const initializationRef = useRef(false) // Prevent duplicate initialization
  const [showGreeting, setShowGreeting] = useState(true)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const prevMessageCountRef = useRef(0)
  const [onboardingInitialized, setOnboardingInitialized] = useState(false)
  const searchParams = useSearchParams()
  const profileId = useProfileId()

  const agentId = agent?.id || 'unified'
  const currentMessages = messages[agentId] || []
  const isOnboardingMode = searchParams?.get('onboarding') === 'true'

  useEffect(() => {
    // Hide greeting if there are messages
    if (currentMessages.length > 0) {
      setShowGreeting(false)
    }
  }, [currentMessages.length])

  // Initialize onboarding if required
  useEffect(() => {
    if (isOnboardingMode && !initializationRef.current && currentMessages.length === 0) {
      initializationRef.current = true
      initializeOnboarding()
    }
  }, [isOnboardingMode, currentMessages.length])

  const initializeOnboarding = async () => {
    setOnboardingInitialized(true)

    // Check if this is first time or subsequent challenge creation
    const isRequired = await isOnboardingRequired()
    const context = await loadUserContext()

    const isFirstTime = isRequired
    const flowType = isFirstTime ? 'user' : 'challenge'
    const firstStep = getFirstStep(flowType as 'user' | 'challenge')

    let openingMessage: string

    if (isFirstTime) {
      // First-time onboarding
      openingMessage = `Welcome to 10X! I'm your ${agent?.name || 'Accountability Coach'}.

Before we begin, I need to set up your first challenge. This is **mandatory** - you can't skip it!

Don't worry, it'll only take a few minutes, and I'll help you create a solid plan.

${firstStep.getMessage({})}`
    } else {
      // Subsequent challenge creation
      openingMessage = generateContextualOpening(context, false)
      openingMessage += '\n\n' + firstStep.getMessage({})
    }

    // Add the opening message with options
    addMessage(agentId, {
      id: `onboarding-start-${Date.now()}`,
      role: 'assistant',
      content: openingMessage,
      timestamp: new Date().toISOString(),
      agentId,
      metadata: {
        isOnboarding: true,
        step: firstStep.id,
        options: firstStep.options,
        optionType: firstStep.inputType === 'multi-select' ? 'multi-select' : 'select',
        inputType: firstStep.inputType,
        isFirstTime,
      },
    })

    setShowGreeting(false)
  }

  // Check if user is near bottom of messages container
  const checkIfNearBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return true
    const threshold = 100 // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }

  // Handle scroll events to track user position
  const handleScroll = () => {
    setIsNearBottom(checkIfNearBottom())
  }

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User is near bottom, OR
    // 2. A new user message was added (they just sent a message)
    const isNewUserMessage = currentMessages.length > prevMessageCountRef.current &&
      currentMessages[currentMessages.length - 1]?.role === 'user'

    if (isNearBottom || isNewUserMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    prevMessageCountRef.current = currentMessages.length
  }, [currentMessages, isTyping, isNearBottom])

  const handleOptionSelect = async (stepId: string, value: string) => {
    // 1. Mark current message as answered
    const lastMessageIndex = currentMessages.length - 1
    markMessageAnswered(agentId, lastMessageIndex)

    // 2. Save the response
    answerStep(stepId, value)

    // 3. Add user's response as a message
    const selectedOption = currentMessages[lastMessageIndex]?.metadata?.options?.find(
      (opt) => opt.value === value
    )
    addMessage(agentId, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: selectedOption?.label || value,
      timestamp: new Date().toISOString(),
      agentId,
    })

    // 4. Determine onboarding type from first message
    const isFirstTime = currentMessages[0]?.metadata?.isFirstTime ?? false
    const flowType = isFirstTime ? 'user' : 'challenge'

    // 5. Get next question from state machine
    const allResponses = { ...responses, [stepId]: value }
    const nextStepConfig = getNextStep(stepId, value, allResponses, flowType as 'user' | 'challenge')

    // 6. Add next question with options (or complete onboarding)
    if (nextStepConfig) {
      const nextMessage = nextStepConfig.getMessage(allResponses)

      addMessage(agentId, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: nextMessage,
        timestamp: new Date().toISOString(),
        agentId,
        metadata: {
          isOnboarding: true,
          step: nextStepConfig.id,
          options: nextStepConfig.options,
          optionType: nextStepConfig.inputType === 'multi-select' ? 'multi-select' : 'select',
          inputType: nextStepConfig.inputType,
          isFirstTime,
        },
      })
    } else {
      // Onboarding complete
      addMessage(agentId, {
        id: `assistant-complete-${Date.now()}`,
        role: 'assistant',
        content: `Perfect! I've got everything I need. Let me create your challenge now... 🚀`,
        timestamp: new Date().toISOString(),
        agentId,
      })

      // Save onboarding data and create challenge
      try {
        const isFirstTime = currentMessages[0]?.metadata?.isFirstTime ?? false

        if (isFirstTime) {
          // First-time onboarding - save user profile
          const onboardingRes = await fetch('/api/user/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...allResponses,
              completed: true,
              completedAt: new Date().toISOString(),
            }),
          })
          const onboardingData = await onboardingRes.json()

          // Save activeProfileId to localStorage
          if (onboardingData.userId) {
            localStorage.setItem('activeProfileId', onboardingData.userId)
          }
        }

        // Create the challenge from responses
        const url = addProfileId('/api/challenges', profileId)
        await fetch(url, {
          method: 'POST',
          headers: getProfileHeaders(profileId),
          body: JSON.stringify({
            name: allResponses.challenge_name || allResponses.goal,
            type: allResponses.challenge_type || 'custom',
            goal: allResponses.goal || allResponses.challenge_name,
            agent: agentId,
            startDate: new Date().toISOString(),
            targetDate: allResponses.deadline,
            dailyHours: parseFloat(allResponses.daily_hours) || 1,
            availableSlots: Array.isArray(allResponses.available_slots)
              ? allResponses.available_slots
              : [allResponses.available_slots],
            status: 'active',
            punishments: allResponses.punishment_type ? [{
              id: `punishment-${Date.now()}`,
              type: 'streak_break',
              trigger: {
                type: 'streak_days',
                value: parseInt(allResponses.grace_period) || 3,
              },
              consequence: {
                type: allResponses.punishment_type === 'severe' ? 'custom' : 'message',
                description: allResponses.custom_punishment ||
                  (allResponses.punishment_type === 'moderate'
                    ? 'Progress reset and accountability message'
                    : 'Encouraging reminder'),
                severity: allResponses.punishment_type || 'mild',
              },
              status: 'active',
            }] : [],
            gracePeriod: parseInt(allResponses.grace_period) || 24,
          }),
        })

        // Complete onboarding in store
        await useOnboardingStore.getState().completeOnboarding()

        // Redirect to main app
        setTimeout(() => {
          window.location.href = '/app'
        }, 1500)
      } catch (error) {
        console.error('Failed to complete onboarding:', error)
        addMessage(agentId, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, there was an error creating your challenge. Please try again.',
          timestamp: new Date().toISOString(),
          agentId,
        })
      }
    }
  }

  const handleSend = (message: string, files?: File[]) => {
    sendMessage(agentId, message, files)
  }

  const handleQuickAction = (actionId: string) => {
    // Handle different quick actions with pre-seeded prompts
    if (actionId === 'new-challenge') {
      // Pre-seed the message for creating a new challenge
      const prompt = "I want to create a new challenge"
      sendMessage(agentId, prompt)
    } else if (actionId === 'quick-checkin') {
      // Pre-seed the message for quick check-in
      const prompt = "I want to do a quick check-in for today"
      sendMessage(agentId, prompt)
    } else if (actionId === 'vision-board') {
      // Pre-seed the message for vision board creation
      const prompt = "I want to create a vision board"
      sendMessage(agentId, prompt)
    }
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Centered content container */}
      <div className="w-full max-w-3xl px-6 py-8 flex flex-col h-full">
        {/* Greeting - shown when no messages */}
        {showGreeting && currentMessages.length === 0 && (
          <div className="mb-12">
            <ChatGreeting agentName={agent?.name} selectedAgents={selectedAgents} />
          </div>
        )}

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto mb-6 space-y-4"
        >
          {currentMessages.map((msg) => (
            <ChatMessageWithOptions
              key={msg.id}
              message={msg}
              onOptionSelect={handleOptionSelect}
            />
          ))}

          {/* Streaming Status - shows model thinking animation */}
          {isTyping && (
            <div className="flex justify-start px-2">
              <StreamingStatus
                phase={streamingPhase}
                toolName={streamingDetails.toolName}
                skillName={streamingDetails.skillName}
                promptName={streamingDetails.promptName}
                files={streamingDetails.files}
                isVisible={true}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="mb-4">
          <ChatInputEnhanced
            onSend={handleSend}
            disabled={isTyping}
            placeholder="How can I help you today?"
            agent={agent}
            onQuickAction={handleQuickAction}
          />
        </div>

        {/* Quick Actions Panel - Show only when no messages */}
        {showGreeting && currentMessages.length === 0 && (
          <QuickActionsPanel onActionClick={(prompt) => sendMessage(agentId, prompt)} />
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAgentStore, useFileStore, useChatStore } from '@/lib/store'
import { FileTree } from '@/components/agent/FileTree'
import { FileViewer } from '@/components/agent/FileViewer'
import { FileEditor } from '@/components/agent/FileEditor'
import { Capabilities } from '@/components/agent/Capabilities'
import { VisionBoard } from '@/components/agent/VisionBoard'
import { ChatWithSidebar } from '@/components/chat'
import { DailyCheckIn } from '@/components/checkin/DailyCheckIn'
import { SkillCreator } from '@/components/skills/SkillCreator'
import { ArrowLeft, Menu, X } from 'lucide-react'

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { agents, setActiveAgent, loadAgents } = useAgentStore()
  const { trees, selectedFile, fileContent, loadTree, selectFile, loadFile } = useFileStore()
  const { addMessage, sendMessage } = useChatStore()
  const messageSentRef = React.useRef(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showSkillCreator, setShowSkillCreator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const agent = Array.isArray(agents) ? agents.find((a) => a.id === params.id) : undefined
  const fileTree = trees[params.id] || []

  // Load agents on mount
  useEffect(() => {
    const init = async () => {
      await loadAgents()
      setIsLoading(false)
    }
    init()
  }, [loadAgents])

  useEffect(() => {
    if (agent) {
      setActiveAgent(params.id)
      loadTree(params.id)
    }
  }, [params.id, agent, setActiveAgent, loadTree])

  // Handle query parameters for conversational onboarding
  useEffect(() => {
    if (!agent) return

    const action = searchParams.get('action')
    if (!action) return

    const agentId = params.id
    let onboardingMessage = ''

    if (action === 'create-challenge') {
      onboardingMessage = `I'd love to help you create a new challenge! Let's design a personalized plan together.

First, what skill or goal would you like to achieve with this challenge?`

      // Add assistant message to start conversation
      addMessage(agentId, {
        id: `onboarding-${Date.now()}`,
        role: 'assistant',
        content: onboardingMessage,
        timestamp: new Date().toISOString(),
        agentId,
      })
    } else if (action === 'create-vision-board') {
      onboardingMessage = `Let's create an inspiring vision board together!

What are your main goals and aspirations you'd like to visualize? Think about areas like:
- Career & Professional Growth
- Health & Fitness
- Personal Development
- Relationships
- Creative Projects

Share your thoughts, and I'll help you design a beautiful vision board.`

      addMessage(agentId, {
        id: `onboarding-${Date.now()}`,
        role: 'assistant',
        content: onboardingMessage,
        timestamp: new Date().toISOString(),
        agentId,
      })
    } else if (action === 'set-goal') {
      onboardingMessage = `I'm here to help you set and achieve your goals!

What specific goal would you like to work towards? The more details you share, the better I can help you create an actionable plan.`

      addMessage(agentId, {
        id: `onboarding-${Date.now()}`,
        role: 'assistant',
        content: onboardingMessage,
        timestamp: new Date().toISOString(),
        agentId,
      })
    }

    // Clear the action parameter from URL after processing
    if (onboardingMessage) {
      router.replace(`/agent/${params.id}`, { scroll: false })
    }
  }, [searchParams, agent, params.id, addMessage, router])

  // Handle message parameter from /chat redirect
  useEffect(() => {
    if (!agent) return

    const message = searchParams.get('message')
    if (!message || messageSentRef.current) return

    messageSentRef.current = true
    const decodedMessage = decodeURIComponent(message)

    // Small delay to ensure chat is ready
    const timer = setTimeout(() => {
      sendMessage(params.id, decodedMessage)
      // Clear the message parameter from URL
      router.replace(`/agent/${params.id}`, { scroll: false })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchParams, agent, params.id, sendMessage, router])

  useEffect(() => {
    if (selectedFile) {
      loadFile(selectedFile)
    }
  }, [selectedFile, loadFile])

  const handleSaveFile = async (content: string) => {
    if (!selectedFile) return

    try {
      await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content }),
      })
      await loadFile(selectedFile)
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oa-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-oa-text-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-oa-text-secondary">Loading agent...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oa-bg-primary">
        <div className="text-center">
          <p className="text-oa-text-secondary mb-4">Agent not found</p>
          <button
            onClick={() => router.push('/app')}
            className="px-4 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors"
          >
            Go back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-oa-bg-primary flex flex-col">
      {/* Header with Back Button and Toggle Controls */}
      <div className="sticky top-0 z-10 bg-oa-bg-primary border-b border-oa-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/app')}
            className="flex items-center gap-2 text-oa-text-secondary hover:text-oa-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="flex items-center gap-2 text-sm text-oa-text-secondary hover:text-oa-text-primary transition-colors"
            >
              {showLeftPanel ? <X size={16} /> : <Menu size={16} />}
              <span>Files</span>
            </button>
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="flex items-center gap-2 text-sm text-oa-text-secondary hover:text-oa-text-primary transition-colors"
            >
              {showRightPanel ? <X size={16} /> : <Menu size={16} />}
              <span>Skills</span>
            </button>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Tree */}
        {showLeftPanel && (
          <div className="w-64 border-r border-oa-border flex flex-col bg-oa-bg-primary">
            <div className="p-3 border-b border-oa-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{agent.icon || '🤖'}</span>
                <h2 className="text-sm font-semibold text-oa-text-primary">{agent.name}</h2>
              </div>
              <p className="text-xs text-oa-text-secondary line-clamp-2">{agent.description}</p>
            </div>
            <div className="px-3 py-2 border-b border-oa-border bg-oa-bg-secondary/50">
              <span className="text-[10px] font-medium text-oa-text-secondary uppercase tracking-wider">Workspace</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FileTree nodes={fileTree} onSelect={selectFile} selectedPath={selectedFile} />
            </div>
            {selectedFile && (
              <div className="p-3 border-t border-oa-border">
                <p className="text-[10px] text-oa-text-secondary mb-2 truncate" title={selectedFile}>
                  {selectedFile}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                      isEditing
                        ? 'bg-oa-accent text-white'
                        : 'border border-oa-border hover:bg-oa-bg-secondary'
                    }`}
                  >
                    {isEditing ? 'Editing' : 'Edit'}
                  </button>
                  <button
                    onClick={() => selectFile(null)}
                    className="px-3 py-1.5 text-xs border border-oa-border hover:bg-oa-bg-secondary transition-colors rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Center Panel - Main Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedFile && fileContent !== null ? (
            isEditing ? (
              <FileEditor content={fileContent} path={selectedFile} onSave={handleSaveFile} />
            ) : (
              <FileViewer content={fileContent} path={selectedFile} />
            )
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-6 max-w-4xl mx-auto">
                <VisionBoard agent={agent} />
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatWithSidebar
                  agent={agent}
                  onCheckinClick={() => setShowCheckIn(true)}
                  onCreateSkillClick={() => setShowSkillCreator(true)}
                  showSidebar={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Capabilities */}
        {showRightPanel && (
          <div className="w-80 border-l border-oa-border overflow-y-auto bg-oa-bg-primary">
            <Capabilities agent={agent} />
          </div>
        )}
      </div>

      {/* Daily Check-In Modal */}
      <DailyCheckIn
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        agentId={agent.id}
      />

      {/* Skill Creator Modal */}
      <SkillCreator
        isOpen={showSkillCreator}
        onClose={() => setShowSkillCreator(false)}
        agentId={agent.id}
        onSkillCreated={(skillId) => {
          console.log('Skill created:', skillId)
          // Optionally refresh agent skills
        }}
      />
    </div>
  )
}

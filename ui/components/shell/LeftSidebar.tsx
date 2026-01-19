'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAgentStore, useTodoStore, useNavigationStore } from '@/lib/store'
import { AgentCard } from '@/components/sidebar/AgentCard'
import { AddAgentButton } from '@/components/sidebar/AddAgentButton'
import { NavSection } from '@/components/sidebar/NavSection'
import { Home } from 'lucide-react'

export function LeftSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { agents, activeAgentId, setActiveAgent, loadAgents } = useAgentStore()
  const { todos, loadTodos } = useTodoStore()
  const { setActive } = useNavigationStore()
  const hasLoaded = useRef(false)

  useEffect(() => {
    // Only load once on initial mount, not on every navigation
    if (!hasLoaded.current) {
      hasLoaded.current = true
      loadAgents()
      loadTodos()
    }
  }, [])

  const pendingTodos = Array.isArray(todos) ? todos.filter(t => t.status !== 'completed').length : 0
  const isHome = pathname === '/app' || pathname === '/'

  const handleHomeClick = () => {
    setActive('home', 'unified')
    router.push('/app')
  }

  return (
    <div className="flex flex-col h-full bg-oa-bg-primary">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-oa-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-oa-accent flex items-center justify-center shadow-lg shadow-oa-accent/20">
            <span className="text-white text-sm font-bold">10X</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-oa-text-primary tracking-tight">10X Coach</h1>
            <p className="text-[10px] text-oa-text-secondary uppercase tracking-wide">by Team 10X</p>
          </div>
        </div>
      </div>

      {/* Home Button */}
      <div className="px-3 py-3 border-b border-oa-border">
        <button
          onClick={handleHomeClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            isHome
              ? 'bg-oa-accent text-white shadow-md'
              : 'text-oa-text-primary hover:bg-oa-bg-secondary'
          }`}
        >
          <Home size={18} />
          <span>Home</span>
        </button>
      </div>

      {/* Agents Section */}
      <div className="border-b border-oa-border py-2">
        <div className="px-6 py-2">
          <h2 className="text-[10px] font-bold text-oa-text-secondary uppercase tracking-wider">Your Agents</h2>
        </div>
        <div>
          {Array.isArray(agents) && agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isActive={activeAgentId === agent.id}
              onClick={() => setActiveAgent(agent.id)}
            />
          ))}
          <AddAgentButton />
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-6 py-2">
          <h2 className="text-[10px] font-bold text-oa-text-secondary uppercase tracking-wider">Navigate</h2>
        </div>
        <div>
          <NavSection title="Workspace" href="/workspace" icon="folder" />
          <NavSection title="Calendar" href="/schedule" icon="calendar" />
          <NavSection title="Challenges" href="/challenges" icon="target" />
          <NavSection title="Active Streaks" href="/streak" icon="flame" />
          <NavSection title="Todos" href="/todos" icon="check-square" count={pendingTodos} />
          <NavSection title="Plan" href="/plan" icon="file-text" />
          <NavSection title="Vision Boards" href="/visionboards" icon="sparkles" />
          <NavSection title="Skills" href="/skills" icon="zap" />
          <NavSection title="Prompts" href="/prompts" icon="message-circle" />
          <NavSection title="Chat History" href="/history" icon="message-square" />
          <NavSection title="Assets" href="/assets" icon="image" />
          <NavSection title="Settings" href="/settings" icon="settings" />
        </div>
      </div>

      {/* Footer Branding */}
      <div className="px-4 py-3 border-t border-oa-border">
        <div className="text-center">
          <p className="text-[10px] text-oa-text-secondary">
            Developed by <span className="font-semibold text-oa-text-primary">Team 10X</span>
          </p>
          <p className="text-[9px] text-oa-text-secondary/70 mt-0.5">
            Powered by OpenAnalyst
          </p>
        </div>
      </div>
    </div>
  )
}

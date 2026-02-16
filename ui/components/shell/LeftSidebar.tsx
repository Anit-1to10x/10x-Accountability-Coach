'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAgentStore, useTodoStore, useNavigationStore, useSidebarStore, useChallengeStore } from '@/lib/store'
import { AddAgentButton } from '@/components/sidebar/AddAgentButton'
import { DataSourceIndicator } from '@/components/status/DataSourceIndicator'
import { addProfileId, useProfileId } from '@/lib/useProfileId'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import {
  Home, Users, ChevronLeft, ChevronRight,
  Folder, Calendar, Target, Flame, FileText, Sparkles, Zap,
  MessageCircle, MessageSquare, Image, Settings, CheckSquare
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { getTodayString } from '@/lib/datetime'

// Color configurations for agent cards
const agentColorStyles: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/50', text: 'text-purple-300', activeBg: 'bg-purple-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-300', activeBg: 'bg-blue-500' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-300', activeBg: 'bg-green-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-300', activeBg: 'bg-orange-500' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/50', text: 'text-pink-300', activeBg: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', text: 'text-cyan-300', activeBg: 'bg-cyan-500' },
  default: { bg: 'bg-oa-accent/10', border: 'border-oa-accent/50', text: 'text-oa-accent', activeBg: 'bg-oa-accent' }
}

export function LeftSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const profileId = useProfileId()
  const { agents, loadAgents, selectedAgentIds, toggleAgentSelection } = useAgentStore()
  const { todos, loadTodos } = useTodoStore()
  const { challenges, loadChallenges } = useChallengeStore()
  const { setActive } = useNavigationStore()
  const { isCollapsed, toggleSidebar } = useSidebarStore()
  const hasLoaded = useRef(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [todayTaskCount, setTodayTaskCount] = useState(0)
  const [skillCount, setSkillCount] = useState(0)
  const [promptCount, setPromptCount] = useState(0)
  const [planCount, setPlanCount] = useState(0)
  const [visionCount, setVisionCount] = useState(0)
  const [historyCount, setHistoryCount] = useState(0)
  const [assetCount, setAssetCount] = useState(0)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      Promise.all([loadAgents(), loadTodos(), loadChallenges(), loadCounts()])
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [loadAgents, loadTodos, loadChallenges])

  // Re-fetch counts when files change via CLI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.category === 'challenge') {
        loadChallenges()
        loadCounts()
      } else if (detail?.category === 'todo') {
        loadTodos()
        loadCounts()
      } else if (detail?.category === 'agent') {
        loadAgents()
      } else if (detail?.category === 'skill' || detail?.category === 'prompt') {
        loadCounts()
      }
    }
    window.addEventListener('file-sync', handler)
    return () => window.removeEventListener('file-sync', handler)
  }, [])

  const loadCounts = async () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const today = getTodayString(tz)

      // Fetch challenge tasks to count today's todos
      let url = addProfileId('/api/todos/from-challenges', profileId)
      url += (url.includes('?') ? '&' : '?') + `timezone=${encodeURIComponent(tz)}`
      const tasksRes = await fetch(url)
      const tasksData = await tasksRes.json()
      const tasks = tasksData.tasks || []
      setTodayTaskCount(tasks.filter((t: any) => t.dueDate === today && !t.completed).length)

      // Fetch all section counts in parallel
      const [skillsRes, promptsRes, plansRes, visionRes, historyRes, workspaceRes] = await Promise.all([
        fetch('/api/skills').catch(() => null),
        fetch('/api/prompts').catch(() => null),
        fetch(addProfileId('/api/plans', profileId)).catch(() => null),
        fetch('/api/visionboards').catch(() => null),
        fetch('/api/chat/sessions').catch(() => null),
        fetch('/api/workspace').catch(() => null),
      ])
      if (skillsRes?.ok) {
        const d = await skillsRes.json()
        setSkillCount(d.count || (Array.isArray(d.skills) ? d.skills.length : (Array.isArray(d) ? d.length : 0)))
      }
      if (promptsRes?.ok) {
        const d = await promptsRes.json()
        const userPrompts = Array.isArray(d.prompts) ? d.prompts.length : 0
        const dynamicPrompts = Array.isArray(d.dynamicPrompts) ? d.dynamicPrompts.length : 0
        setPromptCount(userPrompts + dynamicPrompts || (Array.isArray(d) ? d.length : 0))
      }
      if (plansRes?.ok) {
        const d = await plansRes.json()
        setPlanCount(Array.isArray(d) ? d.length : (Array.isArray(d.plans) ? d.plans.length : 0))
      }
      if (visionRes?.ok) {
        const d = await visionRes.json()
        setVisionCount(Array.isArray(d) ? d.length : (d.visionboards?.length || d.boards?.length || 0))
      }
      if (historyRes?.ok) {
        const d = await historyRes.json()
        setHistoryCount(Array.isArray(d) ? d.length : (d.sessions?.length || 0))
      }
      if (workspaceRes?.ok) {
        const d = await workspaceRes.json()
        setAssetCount(Array.isArray(d) ? d.length : (d.files?.length || d.assets?.length || 0))
      }
    } catch {}
  }

  const activeChallenges = Array.isArray(challenges) ? challenges.filter(c => c.status === 'active').length : 0
  const activeStreaks = Array.isArray(challenges) ? challenges.filter(c => c.status === 'active' && c.streak?.current > 0).length : 0
  const isHome = pathname === '/app' || pathname === '/'
  const totalAgents = Array.isArray(agents) ? agents.length : 0
  const selectedCount = selectedAgentIds.length

  const handleHomeClick = () => {
    setActive('home', 'unified')
    router.push('/app')
  }

  // Navigation items with counts
  const navItems = [
    { title: 'Workspace', href: '/workspace', icon: Folder, count: assetCount },
    { title: 'Calendar', href: '/schedule', icon: Calendar },
    { title: 'Challenges', href: '/challenges', icon: Target, count: activeChallenges },
    { title: 'Streaks', href: '/streak', icon: Flame, count: activeStreaks },
    { title: 'Todos', href: '/todos', icon: CheckSquare, count: todayTaskCount },
    { title: 'Plan', href: '/plan', icon: FileText, count: planCount },
    { title: 'Vision', href: '/visionboards', icon: Sparkles, count: visionCount },
    { title: 'Skills', href: '/skills', icon: Zap, count: skillCount },
    { title: 'Prompts', href: '/prompts', icon: MessageCircle, count: promptCount },
    { title: 'History', href: '/history', icon: MessageSquare, count: historyCount },
    { title: 'Assets', href: '/assets', icon: Image, count: assetCount },
    { title: 'Settings', href: '/settings', icon: Settings },
  ]

  const isNavActive = (href: string) => pathname?.startsWith(href)

  // Collapsed sidebar view
  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-oa-bg-primary w-16 min-w-16 transition-all duration-300 overflow-hidden">
        <div className="px-2 py-3 border-b border-oa-border flex justify-center shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 rounded-lg bg-oa-bg-secondary hover:bg-oa-accent/20 flex items-center justify-center transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={20} className="text-oa-text-secondary" />
          </button>
        </div>

        <div className="px-2 py-3 border-b border-oa-border flex justify-center shrink-0">
          <div className="w-10 h-10 rounded-lg bg-oa-accent flex items-center justify-center shadow-lg shadow-oa-accent/20">
            <span className="text-white text-xs font-bold">10X</span>
          </div>
        </div>

        <div className="px-2 py-2 border-b border-oa-border shrink-0">
          <button
            onClick={handleHomeClick}
            className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${
              isHome ? 'bg-oa-accent text-white shadow-md' : 'text-oa-text-primary hover:bg-oa-bg-secondary'
            }`}
            title="Home"
          >
            <Home size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="py-2 px-2 space-y-1 border-b border-oa-border">
            {isLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full p-2 flex items-center justify-center">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                ))}
              </>
            ) : Array.isArray(agents) && agents.map((agent) => {
              const isSelected = selectedAgentIds.includes(agent.id)
              const colorStyle = agentColorStyles[agent.color || 'default']
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleAgentSelection(agent.id)}
                  className={`w-full p-2 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? `${colorStyle.bg} border ${colorStyle.border}`
                      : 'bg-oa-bg-secondary/30 border border-transparent opacity-40 grayscale'
                  }`}
                  title={`${agent.name} ${isSelected ? '(Connected)' : '(Disconnected)'}`}
                >
                  <span className="text-lg">{agent.icon || '🤖'}</span>
                </button>
              )
            })}
          </div>

          <div className="py-2 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isNavActive(item.href)
              const hasCount = typeof item.count === 'number' && item.count > 0
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full p-2 rounded-lg flex items-center justify-center transition-all relative ${
                    active ? 'bg-oa-accent/20 text-oa-accent' : 'text-oa-text-secondary hover:bg-oa-bg-secondary hover:text-oa-text-primary'
                  }`}
                  title={`${item.title}${hasCount ? ` (${item.count})` : ''}`}
                >
                  <Icon size={18} />
                  {hasCount && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-oa-accent text-white text-[10px] rounded-full flex items-center justify-center px-0.5">
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Expanded sidebar view
  return (
    <div className="flex flex-col h-full bg-oa-bg-primary w-72 min-w-72 transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-oa-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-oa-accent flex items-center justify-center shadow-lg shadow-oa-accent/20 shrink-0">
              <span className="text-white text-sm font-bold">10X</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-oa-text-primary tracking-tight truncate">10X Accountability</h1>
              <p className="text-[10px] text-oa-text-secondary uppercase tracking-wide">Coach Webapp</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg hover:bg-oa-bg-secondary flex items-center justify-center transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft size={18} className="text-oa-text-secondary" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Main Chat Button */}
        <div className="px-3 py-3 border-b border-oa-border">
          <button
            onClick={handleHomeClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isHome ? 'bg-oa-accent text-white shadow-md' : 'text-oa-text-primary hover:bg-oa-bg-secondary'
            }`}
          >
            <Home size={18} className="shrink-0" />
            <span className="truncate">Home</span>
          </button>
        </div>

        {/* Connected Agents Section */}
        <div className="border-b border-oa-border py-3">
          <div className="px-4 pb-2 flex items-center gap-2">
            <Users size={14} className="text-oa-text-secondary shrink-0" />
            <h2 className="text-xs font-bold text-oa-text-secondary uppercase tracking-wider">
              Connected Agents
            </h2>
            <span className="ml-auto text-xs text-oa-accent font-medium">
              {selectedCount}/{totalAgents}
            </span>
          </div>

          <div className="px-3 space-y-2">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-2 w-14" />
                  </div>
                </div>
              ))
            ) : Array.isArray(agents) && agents.length > 0 ? (
              agents.map((agent) => {
                const isSelected = selectedAgentIds.includes(agent.id)
                const colorStyle = agentColorStyles[agent.color || 'default']

                return (
                  <motion.button
                    key={agent.id}
                    onClick={() => toggleAgentSelection(agent.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${
                      isSelected
                        ? `${colorStyle.bg} ${colorStyle.border} ${colorStyle.text}`
                        : 'bg-oa-bg-secondary/20 border-oa-border/30 text-oa-text-secondary/50 grayscale'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                        isSelected ? colorStyle.activeBg : 'bg-oa-bg-secondary'
                      }`}>
                        <span>{agent.icon || '🤖'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{agent.name}</span>
                        <span className="text-[10px] opacity-70">
                          {isSelected ? 'Connected' : 'Click to connect'}
                        </span>
                      </div>
                      {isSelected && (
                        <div className={`w-5 h-5 rounded-full ${colorStyle.activeBg} flex items-center justify-center shrink-0`}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                )
              })
            ) : (
              <p className="text-xs text-oa-text-secondary/60 px-3 py-2">No agents yet</p>
            )}

            <div className="pt-1">
              <AddAgentButton />
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="py-2">
          <div className="px-4 py-2">
            <h2 className="text-[10px] font-bold text-oa-text-secondary uppercase tracking-wider">Navigate</h2>
          </div>
          <div className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isNavActive(item.href)
              const hasCount = typeof item.count === 'number' && item.count > 0
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    active ? 'bg-oa-accent/20 text-oa-accent font-medium' : 'text-oa-text-secondary hover:bg-oa-bg-secondary hover:text-oa-text-primary'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </span>
                  {hasCount ? (
                    <span className="text-[11px] bg-oa-accent/15 text-oa-accent px-2 py-0.5 rounded-md font-medium tabular-nums shrink-0 ml-2">
                      {item.count}
                    </span>
                  ) : typeof item.count === 'number' ? (
                    <span className="text-[11px] text-oa-text-secondary/40 px-2 py-0.5 shrink-0 ml-2">
                      0
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-oa-border space-y-2 mt-4">
          <div className="flex justify-center">
            <DataSourceIndicator />
          </div>
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
    </div>
  )
}

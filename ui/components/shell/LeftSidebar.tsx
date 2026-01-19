'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAgentStore, useTodoStore, useNavigationStore, useSidebarStore } from '@/lib/store'
import { AddAgentButton } from '@/components/sidebar/AddAgentButton'
import { DataSourceIndicator } from '@/components/status/DataSourceIndicator'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import {
  Home, Users, ChevronLeft, ChevronRight,
  Folder, Calendar, Target, Flame, FileText, Sparkles, Zap,
  MessageCircle, MessageSquare, Image, Settings, CheckSquare
} from 'lucide-react'

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
  const { agents, loadAgents, selectedAgentIds, toggleAgentSelection } = useAgentStore()
  const { todos, loadTodos } = useTodoStore()
  const { setActive } = useNavigationStore()
  const { isCollapsed, toggleSidebar } = useSidebarStore()
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true
      loadAgents()
      loadTodos()
    }
  }, [loadAgents, loadTodos])

  const pendingTodos = Array.isArray(todos) ? todos.filter(t => t.status !== 'completed').length : 0
  const isHome = pathname === '/app' || pathname === '/'
  const totalAgents = Array.isArray(agents) ? agents.length : 0
  const selectedCount = selectedAgentIds.length

  const handleHomeClick = () => {
    setActive('home', 'unified')
    router.push('/app')
  }

  // Navigation items
  const navItems = [
    { title: 'Workspace', href: '/workspace', icon: Folder },
    { title: 'Calendar', href: '/schedule', icon: Calendar },
    { title: 'Challenges', href: '/challenges', icon: Target },
    { title: 'Streaks', href: '/streak', icon: Flame },
    { title: 'Todos', href: '/todos', icon: CheckSquare, count: pendingTodos },
    { title: 'Plan', href: '/plan', icon: FileText },
    { title: 'Vision', href: '/visionboards', icon: Sparkles },
    { title: 'Skills', href: '/skills', icon: Zap },
    { title: 'Prompts', href: '/prompts', icon: MessageCircle },
    { title: 'History', href: '/history', icon: MessageSquare },
    { title: 'Assets', href: '/assets', icon: Image },
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
            {Array.isArray(agents) && agents.map((agent) => {
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
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full p-2 rounded-lg flex items-center justify-center transition-all relative ${
                    active ? 'bg-oa-accent/20 text-oa-accent' : 'text-oa-text-secondary hover:bg-oa-bg-secondary hover:text-oa-text-primary'
                  }`}
                  title={item.title}
                >
                  <Icon size={18} />
                  {item.count && item.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-oa-accent text-white text-[10px] rounded-full flex items-center justify-center">
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
            {Array.isArray(agents) && agents.length > 0 ? (
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
              <p className="text-xs text-oa-text-secondary/60 px-3 py-2">Loading agents...</p>
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
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    active ? 'bg-oa-accent/20 text-oa-accent font-medium' : 'text-oa-text-secondary hover:bg-oa-bg-secondary hover:text-oa-text-primary'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.count && item.count > 0 && (
                    <span className="ml-auto text-xs bg-oa-accent/20 text-oa-accent px-1.5 py-0.5 rounded shrink-0">
                      {item.count}
                    </span>
                  )}
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

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Agent } from '@/types'
import type { Skill } from '@/types/skill'
import { Button } from '@/components/ui'
import { Plus, X, CheckCircle, Circle, Clock, Target, Activity } from 'lucide-react'
import { addProfileId, useProfileId } from '@/lib/useProfileId'

interface CapabilitiesProps {
  agent: Agent
  onActionClick?: (action: any) => void
}

export function Capabilities({ agent, onActionClick }: CapabilitiesProps) {
  const router = useRouter()
  const [activeSkills, setActiveSkills] = useState<Skill[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [todos, setTodos] = useState<any[]>([])
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [recentCompletions, setRecentCompletions] = useState<any[]>([])
  const [previousActivities, setPreviousActivities] = useState<any[]>([])
  const [lastCheckin, setLastCheckin] = useState<any>(null)
  const profileId = useProfileId()

  useEffect(() => {
    loadActiveSkills()
    loadTodos()
    loadCurrentTask()
    loadRecentCompletions()
    loadPreviousActivities()
    loadLastCheckin()
  }, [agent.id, agent.skills, profileId])

  const loadActiveSkills = async () => {
    try {
      setIsLoadingSkills(true)
      const skillsRes = await fetch('/api/skills')
      const skillsData = await skillsRes.json()
      const agentActiveSkills = skillsData.skills?.filter((skill: Skill) =>
        agent.skills.includes(skill.id)
      ) || []
      setActiveSkills(agentActiveSkills)
    } catch (error) {
      console.error('Failed to load active skills:', error)
    } finally {
      setIsLoadingSkills(false)
    }
  }

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const newSkills = agent.skills.filter((id) => id !== skillId)
      await fetch(`/api/agents/${agent.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: newSkills }),
      })
      await loadActiveSkills()
    } catch (error) {
      console.error('Failed to remove skill:', error)
    }
  }

  const loadTodos = async () => {
    try {
      const url = addProfileId('/api/todos', profileId)
      const res = await fetch(url)
      const data = await res.json()
      // API returns array directly, not { todos: [...] }
      const todosArray = Array.isArray(data) ? data : (data.todos || [])
      const today = new Date().toISOString().split('T')[0]
      const relevantTodos = todosArray.filter((todo: any) => {
        const todoDate = todo.dueDate || todo.date
        return todoDate >= today && !todo.completed
      }).slice(0, 5)
      setTodos(relevantTodos)
    } catch (error) {
      console.error('Failed to load todos:', error)
    }
  }

  const loadCurrentTask = async () => {
    try {
      const url = addProfileId('/api/todos', profileId)
      const res = await fetch(url)
      const data = await res.json()
      // API returns array directly, not { todos: [...] }
      const todosArray = Array.isArray(data) ? data : (data.todos || [])
      const today = new Date().toISOString().split('T')[0]
      const todayTask = todosArray.find((todo: any) => {
        const todoDate = todo.dueDate || todo.date
        return todoDate === today && !todo.completed
      })
      setCurrentTask(todayTask || null)
    } catch (error) {
      console.error('Failed to load current task:', error)
    }
  }

  const loadRecentCompletions = async () => {
    try {
      const url = addProfileId('/api/todos', profileId)
      const res = await fetch(url)
      const data = await res.json()
      // API returns array directly, not { todos: [...] }
      const todosArray = Array.isArray(data) ? data : (data.todos || [])
      const completed = todosArray.filter((todo: any) => todo.completed)
        .sort((a: any, b: any) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime())
        .slice(0, 3)
      setRecentCompletions(completed)
    } catch (error) {
      console.error('Failed to load recent completions:', error)
    }
  }

  const loadPreviousActivities = async () => {
    try {
      const res = await fetch('/api/activity-log')
      if (res.ok) {
        const data = await res.json()
        const activities = data.activities?.slice(0, 5) || []
        setPreviousActivities(activities)
      }
    } catch (error) {
      console.error('Failed to load previous activities:', error)
    }
  }

  const loadLastCheckin = async () => {
    try {
      const url = addProfileId('/api/challenges', profileId)
      const res = await fetch(url)
      const data = await res.json()
      if (data.challenges && data.challenges.length > 0) {
        const latestCheckIns = data.challenges
          .filter((c: any) => c.streak?.lastCheckin)
          .sort((a: any, b: any) =>
            new Date(b.streak.lastCheckin).getTime() - new Date(a.streak.lastCheckin).getTime()
          )
        if (latestCheckIns.length > 0) {
          setLastCheckin({
            date: latestCheckIns[0].streak.lastCheckin,
            challengeName: latestCheckIns[0].name
          })
        }
      }
    } catch (error) {
      console.error('Failed to load last check-in:', error)
    }
  }

  const handleManageSkills = () => {
    router.push('/skills')
  }

  const handleQuickAction = async (action: any) => {
    if (onActionClick) {
      onActionClick(action)
      return
    }

    if (action.label.toLowerCase().includes('check')) {
      router.push('/streak')
    } else if (action.label.toLowerCase().includes('vision') || action.label.toLowerCase().includes('board')) {
      router.push(`/agent/${agent.id}?action=create-vision-board`)
    } else if (action.label.toLowerCase().includes('challenge') || action.label.toLowerCase().includes('skill')) {
      router.push(`/agent/${agent.id}?action=create-challenge`)
    } else if (action.label.toLowerCase().includes('goal')) {
      router.push(`/agent/${agent.id}?action=set-goal`)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide">
          Skills ({activeSkills.length})
        </h3>
        <button
          onClick={handleManageSkills}
          className="text-xs text-oa-accent hover:text-oa-accent-hover flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Manage
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {isLoadingSkills ? (
          <div className="text-xs text-oa-text-secondary">Loading skills...</div>
        ) : activeSkills.length > 0 ? (
          activeSkills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between gap-2 p-2 bg-oa-bg-tertiary border border-oa-border rounded group hover:border-oa-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-oa-text-primary truncate">
                  {skill.name}
                </div>
                <div className="text-xs text-oa-text-secondary truncate">
                  {skill.description}
                </div>
              </div>
              <button
                onClick={() => handleRemoveSkill(skill.id)}
                className="p-1 text-oa-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove skill"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-xs text-oa-text-secondary">
            No skills attached.{' '}
            <button
              onClick={handleManageSkills}
              className="text-oa-accent hover:underline"
            >
              Add skills
            </button>
          </div>
        )}
      </div>

      <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2 mb-6">
        {(agent.quickActions || []).map((action) => (
          <Button
            key={action.id}
            variant="secondary"
            className="w-full text-sm justify-start hover:bg-oa-accent hover:text-white transition-colors"
            onClick={() => handleQuickAction(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Current Task - Always visible */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-3">
          Current Task
        </h3>
        {currentTask ? (
          <div className="p-4 bg-oa-accent/5 border border-oa-accent/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-oa-accent" />
              <span className="text-sm font-medium text-oa-text-primary">
                {currentTask.title}
              </span>
            </div>
            {currentTask.date && (
              <div className="text-xs text-oa-text-secondary mb-3">
                Due: {new Date(currentTask.date).toLocaleDateString()}
              </div>
            )}
            <button
              onClick={() => router.push('/todos')}
              className="w-full py-1.5 bg-oa-accent text-white rounded text-sm hover:bg-oa-accent-hover transition-colors"
            >
              Mark Complete
            </button>
          </div>
        ) : (
          <div className="p-4 bg-oa-bg-secondary border border-oa-border rounded-lg text-center">
            <p className="text-sm text-oa-text-secondary">No task for today</p>
            <p className="text-xs text-oa-text-secondary/60 mt-1">0 tasks scheduled</p>
          </div>
        )}
      </div>

      {/* Recent Completions - Always visible */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-3">
          Recent Completions
        </h3>
        {recentCompletions.length > 0 ? (
          <div className="space-y-2">
            {recentCompletions.map((task, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-oa-text-secondary line-through flex-1 truncate">
                  {task.title}
                </span>
                <span className="text-xs text-oa-text-secondary">
                  {(() => {
                    const completedDate = new Date(task.completedAt || task.date)
                    const now = new Date()
                    const diffMs = now.getTime() - completedDate.getTime()
                    const diffMins = Math.floor(diffMs / 60000)
                    const diffHours = Math.floor(diffMins / 60)
                    const diffDays = Math.floor(diffHours / 24)

                    if (diffMins < 60) return `${diffMins}m ago`
                    if (diffHours < 24) return `${diffHours}h ago`
                    return `${diffDays}d ago`
                  })()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-oa-bg-secondary border border-oa-border rounded-lg text-center">
            <p className="text-sm text-oa-text-secondary">No completions yet</p>
            <p className="text-xs text-oa-text-secondary/60 mt-1">0 tasks completed</p>
          </div>
        )}
      </div>

      {/* Last Check-in */}
      {lastCheckin && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-3">
            Last Check-in
          </h3>
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-oa-text-primary">
                {lastCheckin.challengeName}
              </span>
            </div>
            <div className="text-xs text-oa-text-secondary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lastCheckin.date).toLocaleDateString()} at{' '}
              {new Date(lastCheckin.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {/* Previous Activity - Always visible */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide mb-3">
          Previous Activity
        </h3>
        {previousActivities.length > 0 ? (
          <div className="space-y-2">
            {previousActivities.map((activity, idx) => (
              <div key={idx} className="text-sm text-oa-text-secondary flex items-start gap-2">
                <Activity className="w-3 h-3 text-oa-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div>{activity.description || activity.action}</div>
                  <div className="text-xs text-oa-text-secondary/60 mt-0.5">
                    {(() => {
                      const activityDate = new Date(activity.timestamp || activity.date)
                      const now = new Date()
                      const diffMs = now.getTime() - activityDate.getTime()
                      const diffMins = Math.floor(diffMs / 60000)
                      const diffHours = Math.floor(diffMins / 60)
                      const diffDays = Math.floor(diffHours / 24)

                      if (diffMins < 60) return `${diffMins}m ago`
                      if (diffHours < 24) return `${diffHours}h ago`
                      return `${diffDays}d ago`
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-oa-bg-secondary border border-oa-border rounded-lg text-center">
            <p className="text-sm text-oa-text-secondary">No recent activity</p>
            <p className="text-xs text-oa-text-secondary/60 mt-1">0 activities logged</p>
          </div>
        )}
      </div>

      {/* Upcoming Tasks */}
      {todos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide">
              Upcoming Tasks
            </h3>
            <button
              onClick={() => router.push('/todos')}
              className="text-xs text-oa-accent hover:text-oa-accent-hover"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {todos.map((todo, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 bg-oa-bg-tertiary border border-oa-border rounded text-sm hover:border-oa-accent/50 transition-colors cursor-pointer"
                onClick={() => router.push('/todos')}
              >
                {todo.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-oa-text-secondary flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs ${todo.completed ? 'text-oa-text-secondary line-through' : 'text-oa-text-primary'}`}>
                    {todo.title}
                  </div>
                  <div className="text-xs text-oa-text-secondary mt-0.5">
                    {new Date(todo.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

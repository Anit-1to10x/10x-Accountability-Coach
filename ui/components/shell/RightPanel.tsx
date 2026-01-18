'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChallengeStore, useTodoStore } from '@/lib/store'
import { ChevronDown, ChevronRight, Calendar, Clock, Target, Flame, CheckCircle2, Circle } from 'lucide-react'
import type { Challenge, Todo } from '@/types'

export function RightPanel() {
  const router = useRouter()
  const { challenges, loadChallenges } = useChallengeStore()
  const { todos, loadTodos } = useTodoStore()
  const [expandedNextDay, setExpandedNextDay] = useState(false)
  const [challengeTasks, setChallengeTasks] = useState<any[]>([])

  useEffect(() => {
    loadChallenges()
    loadTodos()
    loadChallengeTasks()
  }, [])

  // Load challenge tasks from plan.md files
  const loadChallengeTasks = async () => {
    try {
      const tasksRes = await fetch('/api/todos/from-challenges')
      const tasksData = await tasksRes.json()

      const challengesRes = await fetch('/api/challenges')
      const challengesData = await challengesRes.json()
      const challengesList = challengesData.challenges || []

      // Calculate dates for each task based on challenge start date
      const tasksWithDates = (tasksData.tasks || []).map((task: any) => {
        const challenge = challengesList.find((c: any) => c.id === task.challengeId)
        const startDateStr = challenge?.startDate || challenge?.start_date
        const isPaused = challenge?.status === 'paused'

        // Parse date string directly without timezone issues
        // Format: "2026-01-01" -> add (day-1) days
        let dueDateStr = startDateStr
        if (startDateStr && task.day) {
          const [year, month, day] = startDateStr.split('-').map(Number)
          const taskDate = new Date(year, month - 1, day + (task.day - 1))
          dueDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`
        }

        return {
          ...task,
          dueDate: dueDateStr || new Date().toISOString().split('T')[0],
          isPaused,
          challengeStatus: challenge?.status || 'active'
        }
      })

      setChallengeTasks(tasksWithDates)
    } catch (error) {
      console.error('Failed to load challenge tasks:', error)
    }
  }

  const activeChallenges = Array.isArray(challenges) ? challenges.filter(c => c.status === 'active') : []

  // Get today's date (formatted without timezone issues)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Combine regular todos with challenge tasks for today
  const todayRegularTodos = Array.isArray(todos) ? todos.filter(t => {
    return t.dueDate === today && t.status !== 'completed'
  }) : []
  const todayChallengeTasks = challengeTasks.filter(t => t.dueDate === today && !t.completed)
  const todayTodos = [...todayRegularTodos, ...todayChallengeTasks]

  // Get tomorrow's date (formatted without timezone issues)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  // Combine regular todos with challenge tasks for tomorrow
  const tomorrowRegularTodos = Array.isArray(todos) ? todos.filter(t => t.dueDate === tomorrowStr) : []
  const tomorrowChallengeTasks = challengeTasks.filter(t => t.dueDate === tomorrowStr)
  const tomorrowTodos = [...tomorrowRegularTodos, ...tomorrowChallengeTasks]

  return (
    <div className="flex flex-col h-full bg-oa-bg-primary overflow-y-auto">
      {/* Active Streak Section */}
      <div className="p-4 border-b border-oa-border">
        <h3 className="text-[10px] font-bold text-oa-text-secondary uppercase tracking-wider mb-3">
          Active Streaks
        </h3>

        {activeChallenges.length > 0 ? (
          <div className="space-y-3">
            {activeChallenges.map((challenge) => (
              <div
                key={challenge.id}
                onClick={() => router.push(`/streak/${challenge.id}`)}
                className="p-3 rounded-lg border border-oa-border hover:border-oa-accent bg-oa-bg-secondary hover:bg-oa-bg-tertiary transition-all duration-200 cursor-pointer group hover:scale-[1.02] hover:shadow-lg hover:shadow-oa-accent/10"
              >
                {/* Streak Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-oa-text-primary group-hover:text-oa-accent transition-colors">
                      {challenge.streak.current} days
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-oa-accent bg-oa-accent/10 px-2 py-0.5 rounded-full">
                      {challenge.progress}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-oa-text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Challenge Name */}
                <p className="text-xs text-oa-text-secondary mb-2 line-clamp-1 group-hover:text-oa-text-primary transition-colors">
                  {challenge.name}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-oa-bg-primary rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-oa-accent to-blue-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${challenge.progress}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mt-2 text-[10px] text-oa-text-secondary">
                  <span>Best: {challenge.streak.best} days</span>
                  <span>
                    {(() => {
                      const daysSinceStart = Math.ceil((new Date().getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24));
                      const totalDays = challenge.totalDays || 30;
                      const currentDay = Math.min(Math.max(1, daysSinceStart), totalDays);
                      const isCompleted = daysSinceStart > totalDays;
                      return isCompleted ? 'Completed' : `Day ${currentDay}/${totalDays}`;
                    })()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-oa-text-secondary">No active challenges</p>
          </div>
        )}
      </div>

      {/* Upcoming Todos Section */}
      <div className="p-4 border-b border-oa-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold text-oa-text-secondary uppercase tracking-wider">
            Today's Todos
          </h3>
          <span className="text-xs text-oa-accent bg-oa-accent/10 px-2 py-0.5 rounded-full">
            {todayTodos.length}
          </span>
        </div>

        {todayTodos.length > 0 ? (
          <div className="space-y-2">
            {todayTodos.slice(0, 4).map((todo) => (
              <div
                key={todo.id}
                className={`flex items-start gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer group ${
                  todo.isPaused
                    ? 'opacity-50 bg-yellow-500/5'
                    : 'hover:bg-oa-bg-secondary hover:scale-[1.01] hover:shadow-sm'
                }`}
                onClick={() => router.push(todo.challengeId ? '/schedule' : '/todos')}
              >
                <Circle className="w-4 h-4 text-oa-text-secondary mt-0.5 flex-shrink-0 group-hover:text-oa-accent transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-oa-text-primary line-clamp-1 group-hover:text-oa-accent transition-colors">
                    {todo.isPaused && <span className="text-yellow-500">[PAUSED] </span>}
                    {todo.text || todo.title}
                  </p>
                  {(todo.time || todo.challengeName) && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {todo.time && (
                        <>
                          <Clock className="w-3 h-3 text-oa-text-secondary" />
                          <span className="text-[10px] text-oa-text-secondary">{todo.time}</span>
                        </>
                      )}
                      {todo.challengeName && (
                        <span className={`text-[10px] ${todo.isPaused ? 'text-yellow-500' : 'text-oa-accent'}`}>
                          {todo.challengeName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {todo.priority === 'high' && !todo.isPaused && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">!</span>
                )}
                {todo.isPaused && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded">Paused</span>
                )}
                <ChevronRight className="w-3 h-3 text-oa-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
              </div>
            ))}
            {todayTodos.length > 4 && (
              <p className="text-[10px] text-oa-text-secondary text-center pt-1">
                +{todayTodos.length - 4} more
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-oa-text-secondary">All caught up!</p>
          </div>
        )}
      </div>

      {/* Next Day Plan Section (Expandable) */}
      <div className="p-4 border-b border-oa-border">
        <button
          onClick={() => setExpandedNextDay(!expandedNextDay)}
          className="flex items-center justify-between w-full mb-2"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-bold text-oa-text-secondary uppercase tracking-wider">
              Tomorrow's Plan
            </h3>
            <span className="text-xs text-oa-text-secondary bg-oa-bg-secondary px-2 py-0.5 rounded-full">
              {tomorrowTodos.length} items
            </span>
          </div>
          {expandedNextDay ? (
            <ChevronDown className="w-4 h-4 text-oa-text-secondary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
          )}
        </button>

        {expandedNextDay && (
          <div className="space-y-2 mt-3">
            {tomorrowTodos.length > 0 ? (
              tomorrowTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-start gap-2 p-2 rounded-lg ${
                    todo.isPaused ? 'opacity-50 bg-yellow-500/5' : 'bg-oa-bg-secondary'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-oa-text-secondary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-oa-text-primary line-clamp-1">
                      {todo.isPaused && <span className="text-yellow-500">[PAUSED] </span>}
                      {todo.text || todo.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {todo.time && (
                        <span className="text-[10px] text-oa-text-secondary">{todo.time}</span>
                      )}
                      {todo.challengeName && (
                        <span className={`text-[10px] ${todo.isPaused ? 'text-yellow-500' : 'text-oa-accent'}`}>
                          {todo.challengeName}
                        </span>
                      )}
                      {todo.dayTitle && (
                        <span className="text-[10px] text-oa-text-secondary">Day {todo.day}</span>
                      )}
                    </div>
                  </div>
                  {todo.isPaused && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded flex-shrink-0">Paused</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-oa-text-secondary text-center py-2">
                No tasks scheduled for tomorrow
              </p>
            )}

            <button
              onClick={() => router.push('/schedule')}
              className="w-full text-xs text-oa-accent hover:text-oa-accent-hover py-2 transition-colors"
            >
              View Full Schedule →
            </button>
          </div>
        )}
      </div>

      {/* Challenge Plan Section */}
      {activeChallenges.length > 0 && (
        <div className="p-4">
          <h3 className="text-[10px] font-bold text-oa-text-secondary uppercase tracking-wider mb-3">
            Challenge Plan
          </h3>

          {activeChallenges.slice(0, 1).map((challenge) => (
            <div key={challenge.id} className="space-y-2">
              {/* Current objective */}
              <div className="p-3 rounded-lg bg-oa-bg-secondary border border-oa-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-oa-accent" />
                  <span className="text-xs font-medium text-oa-text-primary">Current Goal</span>
                </div>
                <p className="text-xs text-oa-text-secondary line-clamp-2">
                  {challenge.goal || 'Complete your daily tasks to maintain streak'}
                </p>
              </div>

              {/* Upcoming milestones */}
              {challenge.milestones && challenge.milestones.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-oa-text-secondary font-medium">Upcoming Milestones:</p>
                  {challenge.milestones
                    .filter(m => !m.completed)
                    .slice(0, 2)
                    .map((milestone, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-oa-text-secondary">
                        <div className="w-1.5 h-1.5 rounded-full bg-oa-accent/50" />
                        <span className="line-clamp-1">{milestone.name}</span>
                        {milestone.day && (
                          <span className="text-[10px] ml-auto">Day {milestone.day}</span>
                        )}
                      </div>
                    ))}
                </div>
              )}

              <button
                onClick={() => router.push('/plan')}
                className="w-full text-xs text-oa-accent hover:text-oa-accent-hover py-2 transition-colors"
              >
                View Full Plan →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

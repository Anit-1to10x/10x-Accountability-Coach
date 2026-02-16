'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import type { Agent } from '@/types'

interface VisionBoardProps {
  agent: Agent
}

interface JourneySummary {
  summary: string
  totalCheckins: number
  activeDays: number
  keyMilestones: string[]
  currentStreak: number
  overallProgress: number
}

export function VisionBoard({ agent }: VisionBoardProps) {
  const [summary, setSummary] = useState<JourneySummary | null>(null)
  const [quote, setQuote] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)

  useEffect(() => {
    loadSummary()
  }, [agent.id])

  const loadSummary = async () => {
    setLoadingSummary(true)
    try {
      const response = await fetch(`/api/agents/${agent.id}/summary`)
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error('Failed to load summary:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const generateQuote = async () => {
    setLoadingQuote(true)
    try {
      const response = await fetch(`/api/agents/${agent.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const data = await response.json()
      setQuote(data.quote)
    } catch (error) {
      console.error('Failed to generate quote:', error)
    } finally {
      setLoadingQuote(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Journey Summary Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-oa-accent/10 to-transparent rounded-full blur-3xl" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Journey with {agent.name}</h2>
            <button
              onClick={loadSummary}
              disabled={loadingSummary}
              className="px-3 py-1 text-xs border border-oa-border hover:bg-oa-bg-secondary transition-colors disabled:opacity-50"
            >
              {loadingSummary ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loadingSummary && !summary ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-sm text-oa-text-secondary">
                Analyzing your journey...
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-oa-bg-secondary/50 border border-oa-border/50">
                  <div className="text-2xl font-bold text-oa-accent">{summary.totalCheckins}</div>
                  <div className="text-xs text-oa-text-secondary mt-1">Check-ins</div>
                </div>
                <div className="text-center p-3 bg-oa-bg-secondary/50 border border-oa-border/50">
                  <div className="text-2xl font-bold text-oa-accent">{summary.activeDays}</div>
                  <div className="text-xs text-oa-text-secondary mt-1">Active Days</div>
                </div>
                <div className="text-center p-3 bg-oa-bg-secondary/50 border border-oa-border/50">
                  <div className="text-2xl font-bold text-oa-accent">{summary.currentStreak}</div>
                  <div className="text-xs text-oa-text-secondary mt-1">Current Streak</div>
                </div>
                <div className="text-center p-3 bg-oa-bg-secondary/50 border border-oa-border/50">
                  <div className="text-2xl font-bold text-oa-accent">{summary.overallProgress}%</div>
                  <div className="text-xs text-oa-text-secondary mt-1">Progress</div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed text-oa-text-primary whitespace-pre-line">
                  {summary.summary}
                </p>
              </div>

              {/* Key Milestones */}
              {summary.keyMilestones && summary.keyMilestones.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-oa-text-secondary uppercase tracking-wide mb-2">
                    Key Milestones
                  </h3>
                  <ul className="space-y-2">
                    {summary.keyMilestones.map((milestone, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-oa-accent mt-0.5">✓</span>
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generate Quote Button */}
              <div className="pt-2 border-t border-oa-border/50">
                <button
                  onClick={generateQuote}
                  disabled={loadingQuote}
                  className="w-full px-4 py-2 text-sm font-medium bg-oa-accent text-oa-bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loadingQuote ? 'Generating Quote...' : 'Generate Motivational Quote'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-oa-text-secondary">
              No journey data yet. Start checking in to see your progress!
            </div>
          )}
        </div>
      </Card>

      {/* Quote Display Section */}
      {quote && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-oa-accent/5 to-oa-bg-primary">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 left-4 text-[120px] font-serif leading-none">"</div>
          </div>

          <div className="relative p-8 text-center">
            <p className="text-lg font-medium leading-relaxed text-oa-text-primary italic">
              {quote}
            </p>
            <div className="mt-4 pt-4 border-t border-oa-border/30">
              <p className="text-xs text-oa-text-secondary">
                Personalized for your journey with {agent.name}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

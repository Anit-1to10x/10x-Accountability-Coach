'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Edit2, Loader, Plus } from 'lucide-react'
import { Button } from '@/components/ui'

interface Plan {
  challengeId: string
  challengeName: string
  content: string
  updatedAt: string
}

interface PlanViewerProps {
  challengeId?: string
  onEditClick?: (challengeId: string) => void
  onCreateClick?: () => void
}

export function PlanViewer({ challengeId, onEditClick, onCreateClick }: PlanViewerProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (challengeId && plans.length > 0) {
      const plan = plans.find((p) => p.challengeId === challengeId)
      if (plan) {
        setSelectedPlan(plan)
      }
    }
  }, [challengeId, plans])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/plans')
      const data = await response.json()
      setPlans(data)

      // If no specific challengeId, select first plan
      if (!challengeId && data.length > 0) {
        setSelectedPlan(data[0])
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-6 h-6 text-oa-accent animate-spin" />
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="text-center p-12">
        <FileText className="w-12 h-12 text-oa-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-oa-text-primary mb-2">No Plans Yet</h3>
        <p className="text-sm text-oa-text-secondary mb-6">
          Create a plan to get started with your goals.
        </p>
        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus size={16} className="mr-2" />
            Create New Plan
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Plan List Sidebar */}
      {!challengeId && (
        <div className="w-64 border-r border-oa-border overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-oa-text-secondary uppercase tracking-wide">
                Your Plans
              </h3>
              {onCreateClick && (
                <button
                  onClick={onCreateClick}
                  className="p-1.5 hover:bg-oa-bg-secondary rounded-lg transition-colors"
                  title="Create New Plan"
                >
                  <Plus size={16} className="text-oa-accent" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {plans.map((plan) => (
                <button
                  key={plan.challengeId}
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedPlan?.challengeId === plan.challengeId
                      ? 'bg-oa-accent text-white'
                      : 'bg-oa-bg-secondary hover:bg-oa-bg-tertiary text-oa-text-primary'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{plan.challengeName}</div>
                  <div className="text-xs opacity-70">
                    Updated {new Date(plan.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedPlan ? (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-oa-text-primary mb-1">
                  {selectedPlan.challengeName}
                </h2>
                <p className="text-sm text-oa-text-secondary">
                  Last updated {new Date(selectedPlan.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => onEditClick?.(selectedPlan.challengeId)}
              >
                <Edit2 size={16} className="mr-2" />
                Edit Plan
              </Button>
            </div>

            <div className="prose prose-sm max-w-none">
              <div
                className="bg-oa-bg-secondary border border-oa-border rounded-lg p-6"
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.7',
                  color: 'var(--text-primary)',
                }}
              >
                {selectedPlan.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-oa-text-secondary">
            Select a plan to view
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { Card, Button, Input } from '@/components/ui'

interface ContractFormData {
  challengeName: string
  stakes: number
  refereeName: string
  refereeEmail: string
  antiCharity?: string
  escalating: boolean
}

export default function ContractsPage() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ContractFormData>({
    challengeName: '',
    stakes: 10,
    refereeName: '',
    refereeEmail: '',
    antiCharity: '',
    escalating: false,
  })

  const handleCreateContract = async () => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          challengeName: '',
          stakes: 10,
          refereeName: '',
          refereeEmail: '',
          antiCharity: '',
          escalating: false,
        })
      }
    } catch (error) {
      console.error('Failed to create contract:', error)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-title font-semibold">Commitment Contracts</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Contract'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <h2 className="text-heading font-semibold mb-4">New Commitment Contract</h2>
            <p className="text-sm text-oa-text-secondary mb-6">
              Inspired by StickK and Beeminder - put real stakes on the line to stay accountable.
            </p>

            <div className="space-y-4">
              <Input
                label="Challenge Name"
                value={formData.challengeName}
                onChange={(e) => setFormData({ ...formData, challengeName: e.target.value })}
                placeholder="e.g., Complete JavaScript Course"
              />

              <div>
                <label className="block text-sm text-oa-text-secondary mb-2">
                  Stakes per Miss ($)
                </label>
                <input
                  type="number"
                  value={formData.stakes}
                  onChange={(e) => setFormData({ ...formData, stakes: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-oa-border bg-oa-bg-primary text-oa-text-primary focus:outline-none focus:border-oa-text-primary"
                  min="1"
                />
              </div>

              <Input
                label="Referee Name"
                value={formData.refereeName}
                onChange={(e) => setFormData({ ...formData, refereeName: e.target.value })}
                placeholder="Someone who will hold you accountable"
              />

              <Input
                label="Referee Email"
                type="email"
                value={formData.refereeEmail}
                onChange={(e) => setFormData({ ...formData, refereeEmail: e.target.value })}
                placeholder="referee@email.com"
              />

              <Input
                label="Anti-Charity (Optional)"
                value={formData.antiCharity || ''}
                onChange={(e) => setFormData({ ...formData, antiCharity: e.target.value })}
                placeholder="An organization you don't want to support"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.escalating}
                  onChange={(e) => setFormData({ ...formData, escalating: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">Escalating stakes (doubles each miss)</label>
              </div>

              <div className="pt-4 border-t border-oa-border">
                <Button onClick={handleCreateContract} className="w-full">
                  Sign Contract
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div>
          <h2 className="text-sm font-medium mb-4 text-oa-text-secondary uppercase tracking-wide">
            Active Contracts
          </h2>
          <Card>
            <p className="text-sm text-oa-text-secondary">
              No active contracts. Create one to add real stakes to your challenges.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

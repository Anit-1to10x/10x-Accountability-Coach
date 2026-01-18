'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle, Check, Clock, Skull, History, Filter } from 'lucide-react'
import type { Punishment } from '@/types/streak'

interface PunishmentHistoryProps {
  isOpen: boolean
  onClose: () => void
  challengeId?: string
}

interface PunishmentWithChallenge extends Punishment {
  challengeName?: string
}

export function PunishmentHistory({ isOpen, onClose, challengeId }: PunishmentHistoryProps) {
  const [punishments, setPunishments] = useState<PunishmentWithChallenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'triggered' | 'executed' | 'forgiven'>('all')

  useEffect(() => {
    if (isOpen) {
      loadPunishments()
    }
  }, [isOpen, challengeId])

  const loadPunishments = async () => {
    try {
      setIsLoading(true)
      const url = challengeId
        ? `/api/punishments?challengeId=${challengeId}`
        : '/api/punishments'

      const response = await fetch(url)
      const data = await response.json()

      if (data.punishments) {
        setPunishments(data.punishments)
      }
    } catch (error) {
      console.error('Failed to load punishment history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPunishments = punishments.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'triggered':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'executed':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'forgiven':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />
      case 'triggered':
        return <AlertTriangle className="w-4 h-4" />
      case 'executed':
        return <Skull className="w-4 h-4" />
      case 'forgiven':
        return <Check className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const handleForgive = async (punishmentId: string) => {
    try {
      await fetch(`/api/punishments/${punishmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'forgiven' }),
      })
      loadPunishments()
    } catch (error) {
      console.error('Failed to forgive punishment:', error)
    }
  }

  const handleExecute = async (punishmentId: string) => {
    try {
      await fetch(`/api/punishments/${punishmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'executed', executedAt: new Date().toISOString() }),
      })
      loadPunishments()
    } catch (error) {
      console.error('Failed to mark as executed:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-oa-bg-primary border border-oa-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-oa-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-oa-bg-secondary rounded-lg">
              <History className="w-5 h-5 text-oa-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-oa-text-primary">
                Punishment History
              </h2>
              <p className="text-sm text-oa-text-secondary">
                {punishments.length} total punishments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-oa-text-secondary" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-oa-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-oa-text-secondary" />
            <div className="flex gap-2">
              {(['all', 'triggered', 'executed', 'forgiven'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-oa-accent text-white'
                      : 'bg-oa-bg-secondary text-oa-text-secondary hover:text-oa-text-primary'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-oa-accent border-t-transparent"></div>
            </div>
          ) : filteredPunishments.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-oa-bg-secondary rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-oa-text-primary mb-2">
                No Punishments Found
              </h3>
              <p className="text-sm text-oa-text-secondary">
                {filter === 'all'
                  ? "You're doing great! No punishments yet."
                  : `No ${filter} punishments found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPunishments.map((punishment) => (
                <motion.div
                  key={punishment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-oa-bg-secondary rounded-lg border border-oa-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(punishment.status)}`}>
                        {getStatusIcon(punishment.status)}
                        {punishment.status.charAt(0).toUpperCase() + punishment.status.slice(1)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        punishment.consequence.severity === 'mild' ? 'bg-yellow-500/20 text-yellow-400' :
                        punishment.consequence.severity === 'moderate' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {punishment.consequence.severity}
                      </span>
                    </div>
                    {punishment.challengeName && (
                      <span className="text-xs text-oa-text-muted">
                        {punishment.challengeName}
                      </span>
                    )}
                  </div>

                  <h4 className="font-medium text-oa-text-primary mb-1">
                    {punishment.consequence.type === 'message' && 'Shame Message'}
                    {punishment.consequence.type === 'restriction' && 'Feature Restriction'}
                    {punishment.consequence.type === 'donation' && 'Donation Pledge'}
                    {punishment.consequence.type === 'public_shame' && 'Public Accountability'}
                    {punishment.consequence.type === 'custom' && 'Custom Punishment'}
                  </h4>

                  <p className="text-sm text-oa-text-secondary mb-3">
                    {punishment.consequence.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-oa-text-muted">
                    <span>
                      Trigger: {punishment.trigger.type === 'streak_days'
                        ? `Miss ${punishment.trigger.value} days`
                        : `${punishment.trigger.value} ${punishment.trigger.type}`}
                    </span>
                    {punishment.triggeredAt && (
                      <span>
                        Triggered: {new Date(punishment.triggeredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {punishment.status === 'triggered' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-oa-border">
                      <button
                        onClick={() => handleForgive(punishment.id)}
                        className="flex-1 py-2 text-sm border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                      >
                        Forgive
                      </button>
                      <button
                        onClick={() => handleExecute(punishment.id)}
                        className="flex-1 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Mark Executed
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

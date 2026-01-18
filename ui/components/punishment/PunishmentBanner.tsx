'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, X, Clock, Skull } from 'lucide-react'
import type { Punishment } from '@/types/streak'

interface PunishmentBannerProps {
  challengeId?: string
  onDismiss?: () => void
}

export function PunishmentBanner({ challengeId, onDismiss }: PunishmentBannerProps) {
  const [activePunishments, setActivePunishments] = useState<Punishment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadActivePunishments()
  }, [challengeId])

  const loadActivePunishments = async () => {
    try {
      setIsLoading(true)
      const url = challengeId
        ? `/api/punishments?challengeId=${challengeId}&status=triggered`
        : '/api/punishments?status=triggered'

      const response = await fetch(url)
      const data = await response.json()

      if (data.punishments) {
        setActivePunishments(data.punishments.filter((p: Punishment) =>
          p.status === 'triggered' || p.status === 'active'
        ))
      }
    } catch (error) {
      console.error('Failed to load punishments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      case 'moderate':
        return 'bg-orange-500/20 border-orange-500 text-orange-400'
      case 'severe':
        return 'bg-red-500/20 border-red-500 text-red-400'
      default:
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe':
        return <Skull className="w-5 h-5" />
      default:
        return <AlertTriangle className="w-5 h-5" />
    }
  }

  if (isLoading || activePunishments.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 mb-4">
      {activePunishments.map((punishment) => (
        <div
          key={punishment.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${getSeverityColor(punishment.consequence.severity)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getSeverityIcon(punishment.consequence.severity)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm uppercase tracking-wider">
                {punishment.consequence.severity} Punishment Active
              </span>
              {punishment.triggeredAt && (
                <span className="flex items-center gap-1 text-xs opacity-75">
                  <Clock className="w-3 h-3" />
                  Triggered {new Date(punishment.triggeredAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <p className="text-sm opacity-90">
              {punishment.consequence.description}
            </p>

            <div className="mt-2 text-xs opacity-75">
              Trigger: {punishment.trigger.type === 'streak_days'
                ? `Missed ${punishment.trigger.value} days`
                : `${punishment.trigger.value} ${punishment.trigger.type}`}
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

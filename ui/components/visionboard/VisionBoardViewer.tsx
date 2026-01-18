'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Heart, CheckCircle2, Circle, Edit2, Trash2, Download } from 'lucide-react'
import type { VisionBoard } from '@/types/visionboard'

interface VisionBoardViewerProps {
  visionboard: VisionBoard
  onEdit?: () => void
  onDelete?: () => void
  onToggleGoal?: (goalId: string) => void
}

export function VisionBoardViewer({ visionboard, onEdit, onDelete, onToggleGoal }: VisionBoardViewerProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  const getThemeClasses = () => {
    switch (visionboard.theme) {
      case 'light':
        return 'bg-white text-gray-900'
      case 'gradient':
        return 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white'
      default:
        return 'bg-oa-bg-primary text-oa-text-primary'
    }
  }

  const getLayoutClasses = () => {
    switch (visionboard.layout) {
      case 'masonry':
        return 'columns-2 md:columns-3 gap-4'
      case 'collage':
        return 'flex flex-wrap gap-4'
      default:
        return 'grid grid-cols-2 md:grid-cols-3 gap-4'
    }
  }

  const achievedGoals = visionboard.goals.filter(g => g.achieved).length
  const totalGoals = visionboard.goals.length
  const progress = totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0

  return (
    <div className={`rounded-xl overflow-hidden border border-oa-border ${getThemeClasses()}`}>
      {/* Header */}
      <div className="p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{visionboard.title}</h1>
            {visionboard.description && (
              <p className="text-sm opacity-80">{visionboard.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        {totalGoals > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Goals Progress</span>
              <span className="font-medium">{achievedGoals} / {totalGoals}</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-green-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {visionboard.images.length > 0 && (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Vision
          </h2>
          <div className={getLayoutClasses()}>
            {visionboard.images.map((image) => (
              <motion.div
                key={image.id}
                whileHover={{ scale: 1.05 }}
                className="relative rounded-lg overflow-hidden"
              >
                <img
                  src={image.url}
                  alt={image.caption || ''}
                  className="w-full h-full object-cover"
                />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                    <p className="text-xs text-white">{image.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {visionboard.goals.length > 0 && (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visionboard.goals.map((goal) => (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onToggleGoal?.(goal.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  goal.achieved
                    ? 'bg-green-500/20 border border-green-500/50'
                    : 'bg-white/10 border border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  {goal.achieved ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 opacity-50 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${goal.achieved ? 'line-through opacity-75' : ''}`}>
                      {goal.text}
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                      {goal.category}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Affirmations */}
      {visionboard.affirmations.length > 0 && (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Affirmations
          </h2>
          <div className="space-y-3">
            {visionboard.affirmations.map((affirmation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/10 rounded-lg border border-white/20"
              >
                <p className="text-lg italic text-center">
                  &quot;{affirmation}&quot;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-black/10 text-center text-xs opacity-60">
        Created {new Date(visionboard.createdAt).toLocaleDateString()}
        {visionboard.updatedAt !== visionboard.createdAt && (
          <> · Updated {new Date(visionboard.updatedAt).toLocaleDateString()}</>
        )}
      </div>
    </div>
  )
}

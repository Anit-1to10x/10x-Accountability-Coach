'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles, Eye, Trash2 } from 'lucide-react'
import { VisionBoardWizard, VisionBoardViewer } from '@/components/visionboard'
import { useAgentStore } from '@/lib/store'
import type { VisionBoard } from '@/types/visionboard'
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'

export default function VisionBoardsPage() {
  const [visionboards, setVisionboards] = useState<VisionBoard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState<VisionBoard | null>(null)
  const { activeAgentId, agents } = useAgentStore()
  const selectedAgent = agents.find(a => a.id === activeAgentId)
  const profileId = useProfileId()

  useEffect(() => {
    loadVisionBoards()
  }, [profileId])

  const loadVisionBoards = async () => {
    try {
      setIsLoading(true)
      const url = addProfileId('/api/visionboards', profileId)
      const response = await fetch(url)
      const data = await response.json()
      setVisionboards(data.visionboards || [])
    } catch (error) {
      console.error('Failed to load vision boards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateVisionBoard = async (visionboard: VisionBoard) => {
    try {
      const url = addProfileId('/api/visionboards', profileId)
      const response = await fetch(url, {
        method: 'POST',
        headers: getProfileHeaders(profileId),
        body: JSON.stringify(visionboard),
      })

      if (response.ok) {
        await loadVisionBoards()
      }
    } catch (error) {
      console.error('Failed to create vision board:', error)
      throw error
    }
  }

  const handleDeleteVisionBoard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vision board?')) return

    try {
      await fetch(`/api/visionboards/${id}`, { method: 'DELETE' })
      await loadVisionBoards()
      if (selectedBoard?.id === id) {
        setSelectedBoard(null)
      }
    } catch (error) {
      console.error('Failed to delete vision board:', error)
    }
  }

  const handleToggleGoal = async (boardId: string, goalId: string) => {
    const board = visionboards.find(b => b.id === boardId)
    if (!board) return

    const updatedGoals = board.goals.map(g =>
      g.id === goalId ? { ...g, achieved: !g.achieved, achievedAt: !g.achieved ? new Date().toISOString() : undefined } : g
    )

    try {
      await fetch(`/api/visionboards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: updatedGoals }),
      })
      await loadVisionBoards()
    } catch (error) {
      console.error('Failed to update goal:', error)
    }
  }

  if (selectedBoard) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-oa-border">
          <button
            onClick={() => setSelectedBoard(null)}
            className="text-sm text-oa-accent hover:underline"
          >
            ← Back to all vision boards
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <VisionBoardViewer
            visionboard={selectedBoard}
            onDelete={() => handleDeleteVisionBoard(selectedBoard.id)}
            onToggleGoal={(goalId) => handleToggleGoal(selectedBoard.id, goalId)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-oa-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-oa-text-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-oa-accent" />
              Vision Boards
            </h1>
            <p className="text-sm text-oa-text-secondary mt-1">
              Visualize your dreams and manifest your goals
            </p>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Vision Board
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-oa-accent border-t-transparent"></div>
          </div>
        ) : visionboards.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold text-oa-text-primary mb-2">
              Create Your First Vision Board
            </h2>
            <p className="text-oa-text-secondary mb-6 max-w-md mx-auto">
              Transform your dreams into reality. Create a vision board to visualize your goals,
              track progress, and stay motivated on your journey.
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Vision Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visionboards.map((board) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-oa-bg-secondary rounded-lg border border-oa-border overflow-hidden hover:border-oa-accent transition-all"
              >
                {/* Preview */}
                <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative overflow-hidden">
                  {board.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full p-2">
                      {board.images.slice(0, 4).map((img, i) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Sparkles className="w-12 h-12 text-purple-400/50" />
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setSelectedBoard(board)}
                      className="p-3 bg-oa-accent rounded-full hover:bg-oa-accent-hover transition-colors"
                    >
                      <Eye className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteVisionBoard(board.id)}
                      className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-oa-text-primary mb-1 truncate">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="text-sm text-oa-text-secondary line-clamp-2 mb-3">
                      {board.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-oa-text-muted">
                    <div className="flex gap-4">
                      <span>{board.goals.length} goals</span>
                      <span>{board.images.length} images</span>
                    </div>
                    <span>
                      {new Date(board.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Progress */}
                  {board.goals.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-oa-text-secondary">Progress</span>
                        <span className="text-oa-text-primary font-medium">
                          {board.goals.filter(g => g.achieved).length} / {board.goals.length}
                        </span>
                      </div>
                      <div className="h-1.5 bg-oa-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-400 transition-all"
                          style={{
                            width: `${(board.goals.filter(g => g.achieved).length / board.goals.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Wizard */}
      <VisionBoardWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleCreateVisionBoard}
        agentId={selectedAgent?.id || 'accountability-coach'}
      />
    </div>
  )
}

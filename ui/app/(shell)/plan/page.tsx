'use client'

import React, { useState } from 'react'
import { PlanViewer } from '@/components/planning/PlanViewer'
import { PlanEditor } from '@/components/planning/PlanEditor'
import { CreatePlanModal } from '@/components/planning/CreatePlanModal'

export default function PlanPage() {
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="h-full overflow-hidden">
      {editingChallengeId ? (
        <PlanEditor
          challengeId={editingChallengeId}
          onSave={() => {
            // Refresh plan viewer
            setEditingChallengeId(null)
          }}
          onCancel={() => setEditingChallengeId(null)}
        />
      ) : (
        <PlanViewer
          onEditClick={(challengeId) => setEditingChallengeId(challengeId)}
          onCreateClick={() => setShowCreateModal(true)}
        />
      )}

      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(planId) => {
          setShowCreateModal(false)
          setEditingChallengeId(planId)
        }}
      />
    </div>
  )
}

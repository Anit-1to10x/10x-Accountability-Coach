'use client'

import React from 'react'
import { Card } from '@/components/ui'

export default function AssetsPage() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl">
        <h1 className="text-title font-semibold mb-6">Assets</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium mb-3 text-oa-text-secondary uppercase tracking-wide">
              Images
            </h2>
            <Card>
              <p className="text-sm text-oa-text-secondary">
                Vision boards and generated images will appear here.
              </p>
              <p className="text-sm text-oa-text-secondary mt-2">
                Stored in <code className="bg-oa-bg-secondary px-1">data/assets/images/</code>
              </p>
            </Card>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-3 text-oa-text-secondary uppercase tracking-wide">
              Videos
            </h2>
            <Card>
              <p className="text-sm text-oa-text-secondary">
                Progress summary videos will appear here.
              </p>
              <p className="text-sm text-oa-text-secondary mt-2">
                Stored in <code className="bg-oa-bg-secondary px-1">data/assets/videos/</code>
              </p>
            </Card>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-3 text-oa-text-secondary uppercase tracking-wide">
              Uploads
            </h2>
            <Card>
              <p className="text-sm text-oa-text-secondary">
                Files uploaded via chat will appear here.
              </p>
              <p className="text-sm text-oa-text-secondary mt-2">
                Stored in <code className="bg-oa-bg-secondary px-1">data/assets/uploads/</code>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

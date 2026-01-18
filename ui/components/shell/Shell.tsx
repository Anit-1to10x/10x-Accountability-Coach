'use client'

import React from 'react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Settings, User } from 'lucide-react'

interface ShellProps {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode | null
}

export function Shell({ left, center, right }: ShellProps) {
  return (
    <div className="h-screen w-screen bg-oa-bg-primary text-oa-text-primary flex flex-col">
      {/* Top Header Bar */}
      <div className="h-12 border-b border-oa-border flex items-center justify-end px-4 gap-2 flex-shrink-0 bg-oa-bg-secondary">
        <NotificationBell />
        <button className="p-2 rounded-lg hover:bg-oa-bg-tertiary transition-colors">
          <User className="w-5 h-5 text-oa-text-secondary" />
        </button>
        <a href="/settings" className="p-2 rounded-lg hover:bg-oa-bg-tertiary transition-colors">
          <Settings className="w-5 h-5 text-oa-text-secondary" />
        </a>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Fixed width */}
        <div className="w-60 border-r border-oa-border overflow-y-auto flex-shrink-0">
          {left}
        </div>

        {/* Center Chat - Flexible */}
        <div className="flex-1 flex flex-col min-w-0">
          {center}
        </div>

        {/* Right Highlights - Fixed width (conditionally rendered) */}
        {right && (
          <div className="w-72 border-l border-oa-border overflow-y-auto flex-shrink-0">
            {right}
          </div>
        )}
      </div>
    </div>
  )
}

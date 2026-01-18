'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { LeftSidebar } from '@/components/shell/LeftSidebar'
import { CenterChat } from '@/components/shell/CenterChat'
import { RightPanel } from '@/components/shell/RightPanel'
import { QuickCheckin } from '@/components/global/QuickCheckin'
import { BacklogNotification } from '@/components/backlog'

// Inner component that uses useSearchParams
function ShellLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const isOnboarding = searchParams?.get('onboarding') === 'true'

  const centerContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4">
        <BacklogNotification />
      </div>
      <div className="flex-1 overflow-hidden">
        {children || <CenterChat />}
      </div>
    </div>
  )

  return (
    <>
      <Shell
        left={<LeftSidebar />}
        center={centerContent}
        right={!isOnboarding ? <RightPanel /> : null}
      />
      <QuickCheckin />
    </>
  )
}

// Fallback while loading
function ShellFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-oa-bg-primary">
      <div className="text-oa-text-secondary">Loading...</div>
    </div>
  )
}

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <ShellLayoutInner>{children}</ShellLayoutInner>
    </Suspense>
  )
}

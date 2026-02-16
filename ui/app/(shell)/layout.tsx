'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { LeftSidebar } from '@/components/shell/LeftSidebar'
import { CenterChat } from '@/components/shell/CenterChat'
import { RightPanel } from '@/components/shell/RightPanel'
import { QuickCheckin } from '@/components/global/QuickCheckin'
import { BacklogNotification } from '@/components/backlog'
import { useFileSync } from '@/hooks/useFileSync'

// Inner component that uses useSearchParams
function ShellLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  // Subscribe to file system changes for real-time sync with CLI
  useFileSync()

  useEffect(() => {
    const profileId = localStorage.getItem('activeProfileId')
    if (!profileId) {
      router.replace('/profiles')
    } else {
      setHasProfile(true)
    }
  }, [router])

  // Still checking profile
  if (hasProfile === null) {
    return <ShellFallback />
  }

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
        right={<RightPanel />}
      />
      <QuickCheckin />
    </>
  )
}

// Fallback while loading
function ShellFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-oa-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-sm">10X</span>
        </div>
        <div className="w-6 h-6 border-2 border-oa-border border-t-oa-accent rounded-full animate-spin" />
      </div>
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

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Always redirect to profiles page first (Netflix-style)
    // The profiles page handles the logic for new users vs existing users
    router.replace('/profiles')
  }, [router])

  // Simple loading state while redirecting
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4">
          <div className="w-full h-full border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}

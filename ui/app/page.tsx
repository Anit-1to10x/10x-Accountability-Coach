'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the static landing page
    window.location.href = '/landing/index.html'
  }, [])

  // Brief loading state while redirecting
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
        <span className="text-white font-bold text-sm">10X</span>
      </div>
    </div>
  )
}

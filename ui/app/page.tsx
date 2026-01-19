'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Always redirect to profiles page first (Netflix-style)
    // The profiles page handles the logic for new users vs existing users
    const timer = setTimeout(() => {
      router.replace('/profiles')
    }, 1200) // Brief delay to show the logo animation
    return () => clearTimeout(timer)
  }, [router])

  // Modern 10X branded loading animation
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* Background glow effect */}
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main Logo Container */}
        <motion.div
          className="relative"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Rotating ring */}
          <motion.div
            className="absolute -inset-4 rounded-2xl"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(168, 85, 247, 0.4), transparent)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Logo box */}
          <motion.div
            className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30"
            animate={{
              boxShadow: [
                '0 0 30px rgba(168, 85, 247, 0.3)',
                '0 0 60px rgba(168, 85, 247, 0.5)',
                '0 0 30px rgba(168, 85, 247, 0.3)',
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Inner gradient shine */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent" />

            {/* 10X Text */}
            <motion.span
              className="relative text-3xl font-black text-white tracking-tight"
              animate={{
                textShadow: [
                  '0 0 10px rgba(255,255,255,0.5)',
                  '0 0 20px rgba(255,255,255,0.8)',
                  '0 0 10px rgba(255,255,255,0.5)',
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              10X
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Brand text */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.p
            className="text-gray-400 text-sm font-medium tracking-widest uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading
          </motion.p>
        </motion.div>

        {/* Animated dots */}
        <motion.div
          className="flex gap-1.5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

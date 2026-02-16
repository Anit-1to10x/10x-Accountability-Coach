'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Profile {
  id: string
  name: string
  email: string
  created: string
  lastActive: string
  owner: boolean
}

// Avatar colors for profiles (Netflix-style)
const avatarColors = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-teal-500 to-green-500',
]

export default function ProfilesPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const res = await fetch('/api/profiles')
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProfile = (profileId: string, profileName: string) => {
    setSelectedProfile(profileId)
    setIsTransitioning(true)

    // Store active profile
    localStorage.setItem('activeProfileId', profileId)
    localStorage.setItem('activeProfileName', profileName)

    // Delay navigation for animation
    setTimeout(() => {
      router.push('/app')
    }, 1500)
  }

  const handleCreateProfile = () => {
    router.push('/onboarding')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          {/* 10X Logo */}
          <motion.div
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
            animate={{
              boxShadow: [
                '0 0 20px rgba(168, 85, 247, 0.3)',
                '0 0 40px rgba(168, 85, 247, 0.5)',
                '0 0 20px rgba(168, 85, 247, 0.3)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-xl font-black text-white">10X</span>
          </motion.div>
          {/* Dots */}
          <div className="flex gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Transition loading screen after profile selection
  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          {/* Background glow */}
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Animated 10X Logo */}
          <motion.div
            className="relative w-28 h-28 mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Rotating outer ring */}
            <motion.div
              className="absolute -inset-3 rounded-2xl"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(168, 85, 247, 0.5), rgba(236, 72, 153, 0.5), transparent)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Main logo box */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(168, 85, 247, 0.4)',
                  '0 0 60px rgba(168, 85, 247, 0.6)',
                  '0 0 30px rgba(168, 85, 247, 0.4)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent" />

              {/* 10X Text with glow */}
              <motion.span
                className="relative text-4xl font-black text-white"
                animate={{
                  textShadow: [
                    '0 0 10px rgba(255,255,255,0.5)',
                    '0 0 30px rgba(255,255,255,0.8)',
                    '0 0 10px rgba(255,255,255,0.5)',
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                10X
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Welcome text */}
          <motion.p
            className="text-white font-medium text-lg mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome back!
          </motion.p>

          {/* Loading indicator */}
          <motion.p
            className="text-gray-400 text-sm tracking-wider uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Preparing your workspace
          </motion.p>

          {/* Animated progress dots */}
          <div className="flex gap-2 mt-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // No profiles - show create profile
  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-2xl font-black text-white">10X</span>
          </motion.div>

          <h1 className="text-2xl font-semibold text-white mb-2">Welcome to 10X Accountability Coach</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-sm">
            Your AI-powered accountability coach by Team 10X. Create your profile to get started.
          </p>

          <motion.button
            onClick={handleCreateProfile}
            className="group relative px-8 py-4 rounded-xl overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all group-hover:opacity-90" />
            <div className="relative flex items-center gap-3 text-white font-medium">
              <span className="text-xl">+</span>
              <span>Create Your Profile</span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Has profiles - Netflix-style grid
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        {/* Logo */}
        <motion.div
          className="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
          animate={{
            boxShadow: [
              '0 0 20px rgba(168, 85, 247, 0.2)',
              '0 0 30px rgba(168, 85, 247, 0.4)',
              '0 0 20px rgba(168, 85, 247, 0.2)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xl font-black text-white">10X</span>
        </motion.div>
        <h1 className="text-3xl font-medium text-white mb-2">Who's coaching today?</h1>
      </motion.div>

      {/* Profile Grid */}
      <motion.div
        className="flex flex-wrap justify-center gap-6 max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence>
          {profiles.map((profile, index) => (
            <motion.button
              key={profile.id}
              onClick={() => handleSelectProfile(profile.id, profile.name)}
              className="group flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Avatar */}
              <div className={`relative w-28 h-28 rounded-lg bg-gradient-to-br ${avatarColors[index % avatarColors.length]}
                            flex items-center justify-center overflow-hidden
                            ring-0 group-hover:ring-4 ring-white/50 transition-all duration-200`}>
                <span className="text-3xl font-bold text-white">
                  {getInitials(profile.name)}
                </span>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>

              {/* Name */}
              <span className="text-gray-400 group-hover:text-white transition-colors text-sm">
                {profile.name}
              </span>
            </motion.button>
          ))}

          {/* Add Profile Button */}
          <motion.button
            onClick={handleCreateProfile}
            className="group flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: profiles.length * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Avatar placeholder */}
            <div className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-600
                          group-hover:border-gray-400 flex items-center justify-center
                          transition-all duration-200">
              <span className="text-4xl text-gray-600 group-hover:text-gray-400 transition-colors">+</span>
            </div>

            {/* Label */}
            <span className="text-gray-500 group-hover:text-gray-300 transition-colors text-sm">
              Add Profile
            </span>
          </motion.button>
        </AnimatePresence>
      </motion.div>

      {/* Manage Profiles link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 px-6 py-2 text-sm text-gray-500 border border-gray-700 rounded-md
                 hover:text-white hover:border-gray-500 transition-colors"
      >
        Manage Profiles
      </motion.button>
    </div>
  )
}

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
      router.push('/streak')
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          {/* Animated logo/orb */}
          <motion.div
            className="relative w-20 h-20 mb-8"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Core orb */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600"
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            {/* Inner shine */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
          </motion.div>

          {/* Loading dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500"
                animate={{
                  y: [-3, 3, -3],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
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
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-2xl font-bold text-white">OA</span>
          </motion.div>

          <h1 className="text-2xl font-semibold text-white mb-2">Welcome to OpenAnalyst</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-sm">
            Your AI-powered accountability coach. Create your profile to get started.
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
        <div className="w-12 h-12 mx-auto mb-6 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-lg font-bold text-white">OA</span>
        </div>
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

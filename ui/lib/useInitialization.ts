import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface InitStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete' | 'error'
}

export function useInitialization() {
  const router = useRouter()
  const [steps, setSteps] = useState<InitStep[]>([
    { id: 'env', label: 'Setting up environment', status: 'pending' },
    { id: 'profiles', label: 'Checking profiles', status: 'pending' },
    { id: 'onboarding', label: 'Checking user status', status: 'pending' },
    { id: 'agents', label: 'Loading agents', status: 'pending' },
    { id: 'workspace', label: 'Reading workspace files', status: 'pending' },
    { id: 'config', label: 'Loading configurations', status: 'pending' },
  ])
  const [isComplete, setIsComplete] = useState(false)

  const updateStep = (id: string, status: InitStep['status']) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status } : step))
    )
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        // Step 1: Environment setup
        updateStep('env', 'loading')
        await new Promise((resolve) => setTimeout(resolve, 500))
        updateStep('env', 'complete')

        // Step 2: Check for profiles
        updateStep('profiles', 'loading')
        try {
          const profilesRes = await fetch('/api/profiles')
          const profilesData = await profilesRes.json()
          const profiles = profilesData.profiles || []

          // No profiles exist - redirect to onboarding
          if (profiles.length === 0) {
            updateStep('profiles', 'complete')
            router.push('/onboarding')
            return
          }

          // Check if active profile is set
          const activeProfileId = localStorage.getItem('activeProfileId')

          if (!activeProfileId) {
            // If only one profile exists, auto-select it
            if (profiles.length === 1) {
              localStorage.setItem('activeProfileId', profiles[0].id)
              updateStep('profiles', 'complete')
              // Continue to app with auto-selected profile
            } else {
              // Multiple profiles - redirect to profile selector
              updateStep('profiles', 'complete')
              router.push('/profiles')
              return
            }
          } else {
            updateStep('profiles', 'complete')
          }
        } catch (error) {
          console.error('Failed to check profiles:', error)
          updateStep('profiles', 'complete')
          router.push('/onboarding')
          return
        }

        // Step 3: Check onboarding status (kept for backward compat)
        updateStep('onboarding', 'loading')
        updateStep('onboarding', 'complete')

        // Step 3: Load agents
        updateStep('agents', 'loading')
        try {
          await fetch('/api/agents')
          updateStep('agents', 'complete')
        } catch (error) {
          console.error('Failed to load agents:', error)
          updateStep('agents', 'error')
        }

        // Step 4: Load workspace files
        updateStep('workspace', 'loading')
        await new Promise((resolve) => setTimeout(resolve, 400))
        updateStep('workspace', 'complete')

        // Step 5: Load configurations
        updateStep('config', 'loading')
        try {
          const activeProfileId = localStorage.getItem('activeProfileId')
          const profileParam = activeProfileId ? `?profileId=${activeProfileId}` : ''
          await Promise.all([
            fetch(`/api/user/status${profileParam}`),
            fetch(`/api/todos${profileParam}`),
            fetch(`/api/challenges${profileParam}`),
          ])
          updateStep('config', 'complete')
        } catch (error) {
          console.error('Failed to load config:', error)
          updateStep('config', 'error')
        }

        // All done - redirect to app
        await new Promise((resolve) => setTimeout(resolve, 300))
        setIsComplete(true)
        router.push('/app')
      } catch (error) {
        console.error('Initialization error:', error)
      }
    }

    initialize()
  }, [router])

  return { steps, isComplete }
}

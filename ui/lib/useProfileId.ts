// Hook to get active profile ID from localStorage
// Defaults to Arjun (owner) if no profile is set
export function useProfileId(): string | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('activeProfileId')

  // If no profile is set, default to Arjun (owner)
  if (!stored) {
    const defaultProfile = 'arjun-gmail-com'
    localStorage.setItem('activeProfileId', defaultProfile)
    return defaultProfile
  }

  return stored
}

// Helper to add profileId to fetch URL
export function addProfileId(url: string, profileId: string | null): string {
  if (!profileId) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}profileId=${profileId}`
}

// Helper to create headers with profileId
export function getProfileHeaders(profileId: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (profileId) {
    headers['X-Profile-Id'] = profileId
  }

  return headers
}

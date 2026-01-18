/**
 * Index Updater Utility
 *
 * Automatically updates data/index.md when user creates/modifies files
 * This keeps the architecture manifest in sync for Claude Code
 */

interface ChallengeData {
  id: string
  name: string
  type: string
  progress: number
  streak: number
  punishment: string
}

interface FileData {
  filePath: string
  purpose: string
  created: string
  modified: string
}

interface ModificationData {
  filePath: string
  original: string
  changes: string
  date: string
}

interface PunishmentData {
  challenge: string
  trigger: string
  punishment: string
  lastTriggered: string
  status: string
}

interface SessionData {
  currentFocus?: string
  pendingQuestions?: string
}

/**
 * Update index.md when a new challenge is created
 */
export async function logChallengeCreated(challenge: ChallengeData) {
  try {
    const response = await fetch('/api/system/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'challenge_created',
        data: challenge,
      }),
    })

    if (!response.ok) {
      console.error('Failed to log challenge creation to index.md')
    }
  } catch (error) {
    console.error('Error logging challenge creation:', error)
  }
}

/**
 * Update index.md when a file is created
 */
export async function logFileCreated(file: FileData) {
  try {
    const response = await fetch('/api/system/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'file_created',
        data: file,
      }),
    })

    if (!response.ok) {
      console.error('Failed to log file creation to index.md')
    }
  } catch (error) {
    console.error('Error logging file creation:', error)
  }
}

/**
 * Update index.md when a file is modified
 */
export async function logFileModified(modification: ModificationData) {
  try {
    const response = await fetch('/api/system/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'file_modified',
        data: modification,
      }),
    })

    if (!response.ok) {
      console.error('Failed to log file modification to index.md')
    }
  } catch (error) {
    console.error('Error logging file modification:', error)
  }
}

/**
 * Update index.md when a punishment is triggered
 */
export async function logPunishmentTriggered(punishment: PunishmentData) {
  try {
    const response = await fetch('/api/system/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'punishment_triggered',
        data: punishment,
      }),
    })

    if (!response.ok) {
      console.error('Failed to log punishment trigger to index.md')
    }
  } catch (error) {
    console.error('Error logging punishment trigger:', error)
  }
}

/**
 * Update session context in index.md
 */
export async function updateSessionContext(session: SessionData) {
  try {
    const response = await fetch('/api/system/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'session_update',
        data: session,
      }),
    })

    if (!response.ok) {
      console.error('Failed to update session context in index.md')
    }
  } catch (error) {
    console.error('Error updating session context:', error)
  }
}

/**
 * Update specific section of index.md
 */
export async function updateIndexSection(section: string, data: any) {
  try {
    const response = await fetch('/api/system/index', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section,
        data,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to update ${section} section in index.md`)
    }
  } catch (error) {
    console.error(`Error updating ${section} section:`, error)
  }
}

/**
 * Get current index.md content
 */
export async function getIndexContent() {
  try {
    const response = await fetch('/api/system/index')
    if (!response.ok) {
      throw new Error('Failed to fetch index.md')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching index content:', error)
    return null
  }
}

/**
 * Sync all challenges to index.md
 * Call this on app startup to ensure index is up to date
 */
export async function syncChallenges(challenges: ChallengeData[]) {
  try {
    await updateIndexSection('challenges', challenges)

    // Update system overview counts
    await updateIndexSection('systemOverview', {
      totalChallenges: challenges.length,
      activeStreaks: challenges.filter(c => c.streak > 0).length,
    })
  } catch (error) {
    console.error('Error syncing challenges to index:', error)
  }
}

/**
 * Initialize index.md with user profile data
 * Call this during first-time setup
 */
export async function initializeIndex(userName: string) {
  try {
    await updateIndexSection('systemOverview', {
      appName: 'OpenAnalyst Accountability Coach',
      userName,
      created: new Date().toISOString(),
      totalChallenges: 0,
      activeStreaks: 0,
    })

    await updateIndexSection('pendingActions', [
      'Complete first-time onboarding',
      'Create first challenge',
    ])
  } catch (error) {
    console.error('Error initializing index:', error)
  }
}

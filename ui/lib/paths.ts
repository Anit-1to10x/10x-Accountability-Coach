import path from 'path'

// Determine project root - handle both UI dev mode and production
// In Next.js, process.cwd() is the 'ui' folder during dev
const isInsideUI = process.cwd().endsWith('ui') || process.cwd().includes('\\ui')
export const PROJECT_ROOT = isInsideUI ? path.join(process.cwd(), '..') : process.cwd()

// Data directory - relative to project root, not user home
// This makes the app self-contained
export const DATA_DIR = path.join(PROJECT_ROOT, 'data')

// Skills directory - at project root level
export const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills')

// Commands directory - at project root level
export const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands')

// Profile-specific paths - isolated per user
export function getProfilePaths(profileId: string) {
  const profileDir = path.join(DATA_DIR, 'profiles', profileId)
  return {
    profile: profileDir,
    challenges: path.join(profileDir, 'challenges'),
    todos: path.join(profileDir, 'todos'),
    chats: path.join(profileDir, 'chats'),
    checkins: path.join(profileDir, 'checkins'),
    visionboards: path.join(profileDir, 'visionboards'),
    schedule: path.join(profileDir, 'schedule'),
  }
}

// Shared paths - global across all profiles
export const SHARED_PATHS = {
  agents: path.join(DATA_DIR, 'agents.json'),
  agentsDir: path.join(DATA_DIR, 'agents'),
  skills: SKILLS_DIR,
  prompts: path.join(DATA_DIR, 'prompts'),
  assets: path.join(DATA_DIR, 'assets'),
  uploads: path.join(DATA_DIR, 'assets', 'uploads'),
  commands: COMMANDS_DIR,
  inbox: path.join(DATA_DIR, '.inbox'),
  registry: path.join(DATA_DIR, '.registry'),
  profiles: path.join(DATA_DIR, 'profiles'),
  profilesMd: path.join(DATA_DIR, 'profiles', 'profiles.md'),
}

// Legacy PATHS object (backward compatible - uses old structure)
export const PATHS = {
  challenges: path.join(DATA_DIR, 'challenges'),
  todos: path.join(DATA_DIR, 'todos'),
  profile: path.join(DATA_DIR, 'profile'),
  agents: path.join(DATA_DIR, 'agents.json'),
  agentsDir: path.join(DATA_DIR, 'agents'),
  chats: path.join(DATA_DIR, 'chats'),
  inbox: path.join(DATA_DIR, '.inbox'),
  visionboards: path.join(DATA_DIR, 'visionboards'),
  prompts: path.join(DATA_DIR, 'prompts'),
  checkins: path.join(DATA_DIR, 'checkins'),
  registry: path.join(DATA_DIR, '.registry'),
  assets: path.join(DATA_DIR, 'assets'),
  uploads: path.join(DATA_DIR, 'assets', 'uploads'),
  skills: SKILLS_DIR,
  commands: COMMANDS_DIR,
}

export default DATA_DIR

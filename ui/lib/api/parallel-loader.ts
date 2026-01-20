/**
 * Parallel API Loader
 *
 * Optimizes API calls by running them in parallel instead of sequentially.
 * Used by chat components and other parts of the app for better performance.
 */

import { buildContext, UserContext } from './context-builder'
import { matchSkill } from './skills-manager'
import { loadUserProfile, buildUserContext, UserProfile } from '../user-profile-context'
import { processFile, formatFileContext, getRelevantChunks, ProcessedFile } from '../file-processor'
import { getToolsForLLM } from '../mcp/manager'
import { checkMCPStatus, MCPStreamEvent } from '../mcp/data-fetcher'
import { getAgentCapabilities, getCombinedAgentCapabilities, AgentCapabilities } from '../agent-capabilities'

// File attachment from chat
interface FileAttachment {
  name: string
  content: string
  type: string
  size: number
}

// Result of parallel loading
export interface ParallelLoadResult {
  context: UserContext
  userProfile: UserProfile | null
  userProfileContext: string
  processedFiles: ProcessedFile[]
  fileContexts: string[]
  matchedSkill: { name: string; body: string } | null
  mcpTools: any[]
  mcpStatus: MCPStreamEvent | null
  agentCapabilities: AgentCapabilities
  loadTime: number
}

/**
 * Load all necessary context data in parallel
 * This is much faster than loading sequentially
 */
export async function loadContextParallel(options: {
  profileId?: string | null
  agentId?: string
  selectedAgentIds?: string[] // For unified chat with multiple agents
  userMessage?: string
  files?: FileAttachment[]
  timezone?: string // User's timezone for context-aware datetime
}): Promise<ParallelLoadResult> {
  const startTime = Date.now()
  const { profileId, agentId = 'unified', selectedAgentIds = [], userMessage = '', files = [], timezone } = options

  // Start all operations in parallel
  const [
    contextResult,
    userProfileResult,
    skillResult,
    mcpToolsResult,
    mcpStatusResult,
    capabilitiesResult,
    ...fileResults
  ] = await Promise.allSettled([
    // Core context with timezone
    buildContext(profileId, timezone),

    // User profile
    profileId ? loadUserProfile(profileId) : Promise.resolve(null),

    // Skill matching
    userMessage ? matchSkill(userMessage, agentId) : Promise.resolve(null),

    // MCP tools
    getToolsForLLM().catch(() => []),

    // MCP status
    checkMCPStatus().catch(() => null),

    // Agent capabilities - use combined if multiple agents selected
    selectedAgentIds.length > 0
      ? getCombinedAgentCapabilities(selectedAgentIds)
      : getAgentCapabilities(agentId),

    // Process all files in parallel
    ...files.map(async (file) => {
      try {
        const processed = await processFile(file.name, file.content)
        const chunks = getRelevantChunks(processed, userMessage, 3)
        const context = formatFileContext(processed, chunks)
        return { processed, context }
      } catch {
        return { processed: null, context: `## File: ${file.name}\n*Could not process file*\n` }
      }
    }),
  ])

  // Extract results with fallbacks
  const context = contextResult.status === 'fulfilled'
    ? contextResult.value
    : { profile: null, tasks: { summary: { totalTodos: 0, completedToday: 0, pending: 0 }, todos: [] }, challenges: { data: [], count: 0, todaysTasks: [] }, progress: { streaks: [] }, schedule: { today: [] }, recentCheckins: [], currentDate: new Date().toISOString().split('T')[0], datetime: { date: '', time: '', dayOfWeek: '', greeting: 'Hello', dayProgress: 0, timezone: 'UTC' } }

  const userProfile = userProfileResult.status === 'fulfilled'
    ? userProfileResult.value
    : null

  const userProfileContext = userProfile ? buildUserContext(userProfile) : ''

  const matchedSkill = skillResult.status === 'fulfilled' && skillResult.value
    ? { name: skillResult.value.name, body: skillResult.value.body }
    : null

  const mcpTools = mcpToolsResult.status === 'fulfilled'
    ? mcpToolsResult.value
    : []

  const mcpStatus = mcpStatusResult.status === 'fulfilled'
    ? mcpStatusResult.value
    : null

  const agentCapabilities = capabilitiesResult.status === 'fulfilled'
    ? capabilitiesResult.value
    : { agentId, assignedSkills: [], assignedPrompts: [], restrictions: { allowOnlyAssigned: false }, updatedAt: new Date().toISOString() }

  // Process file results
  const processedFiles: ProcessedFile[] = []
  const fileContexts: string[] = []

  for (const result of fileResults) {
    if (result.status === 'fulfilled') {
      const { processed, context } = result.value as { processed: ProcessedFile | null; context: string }
      if (processed) processedFiles.push(processed)
      if (context) fileContexts.push(context)
    }
  }

  return {
    context,
    userProfile,
    userProfileContext,
    processedFiles,
    fileContexts,
    matchedSkill,
    mcpTools,
    mcpStatus,
    agentCapabilities,
    loadTime: Date.now() - startTime,
  }
}

/**
 * Batch multiple API calls into a single parallel execution
 */
export async function batchAPICallsParallel<T>(
  calls: Array<() => Promise<T>>,
  options?: {
    maxConcurrent?: number
    onProgress?: (completed: number, total: number) => void
  }
): Promise<Array<{ success: boolean; result?: T; error?: string }>> {
  const { maxConcurrent = 10, onProgress } = options || {}
  const results: Array<{ success: boolean; result?: T; error?: string }> = []
  let completed = 0

  // Process in batches if maxConcurrent is set
  for (let i = 0; i < calls.length; i += maxConcurrent) {
    const batch = calls.slice(i, i + maxConcurrent)

    const batchResults = await Promise.allSettled(batch.map(call => call()))

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push({ success: true, result: result.value })
      } else {
        results.push({ success: false, error: result.reason?.message || 'Unknown error' })
      }
      completed++
      onProgress?.(completed, calls.length)
    }
  }

  return results
}

/**
 * Preload common data for faster initial load
 * Call this on app startup or when entering a chat
 */
let preloadedData: Partial<ParallelLoadResult> | null = null
let preloadPromise: Promise<Partial<ParallelLoadResult>> | null = null

export async function preloadCommonData(profileId?: string | null): Promise<void> {
  if (preloadPromise) {
    await preloadPromise
    return
  }

  preloadPromise = (async () => {
    const [context, userProfile, mcpTools, mcpStatus] = await Promise.allSettled([
      buildContext(profileId),
      profileId ? loadUserProfile(profileId) : Promise.resolve(null),
      getToolsForLLM().catch(() => []),
      checkMCPStatus().catch(() => null),
    ])

    const data: Partial<ParallelLoadResult> = {}

    if (context.status === 'fulfilled') data.context = context.value
    if (userProfile.status === 'fulfilled') {
      data.userProfile = userProfile.value
      if (userProfile.value) {
        data.userProfileContext = buildUserContext(userProfile.value)
      }
    }
    if (mcpTools.status === 'fulfilled') data.mcpTools = mcpTools.value
    if (mcpStatus.status === 'fulfilled') data.mcpStatus = mcpStatus.value

    preloadedData = data
    return data
  })()

  await preloadPromise
  preloadPromise = null
}

/**
 * Get preloaded data if available
 */
export function getPreloadedData(): Partial<ParallelLoadResult> | null {
  return preloadedData
}

/**
 * Clear preloaded data (call when profile changes)
 */
export function clearPreloadedData(): void {
  preloadedData = null
  preloadPromise = null
}

/**
 * Debounced API call - prevents multiple calls within a time window
 */
const debounceMap = new Map<string, { promise: Promise<any>; timestamp: number }>()

export async function debouncedAPICall<T>(
  key: string,
  call: () => Promise<T>,
  debounceMs: number = 300
): Promise<T> {
  const existing = debounceMap.get(key)

  if (existing && Date.now() - existing.timestamp < debounceMs) {
    return existing.promise
  }

  const promise = call()
  debounceMap.set(key, { promise, timestamp: Date.now() })

  // Clean up old entries
  setTimeout(() => debounceMap.delete(key), debounceMs * 2)

  return promise
}

/**
 * Quick Query API for Claude Code
 *
 * Provides instant data access using the cache manager.
 * All agents can use this centralized API for fast responses.
 */

const cacheManager = require('./cache-manager');

/**
 * Initialize the quick query system
 */
async function initialize() {
  await cacheManager.initialize();
  console.log('[QuickQuery] Ready for instant queries');
}

/**
 * Get user profile data instantly (includes full onboarding data)
 */
function getProfile(profileId) {
  const profile = cacheManager.getProfile(profileId);

  if (!profile) {
    return {
      found: false,
      message: `Profile ${profileId} not found`,
    };
  }

  return {
    found: true,
    data: profile,
  };
}

/**
 * Get user's onboarding/preferences data
 */
function getOnboardingData(profileId) {
  const profile = cacheManager.getProfile(profileId);

  if (!profile) {
    return {
      found: false,
      message: `Profile ${profileId} not found`,
    };
  }

  return {
    found: true,
    data: {
      name: profile.name,
      email: profile.email,
      timezone: profile.timezone,
      bigGoal: profile.about || profile.big_goal,
      preferences: profile.preferences || {},
      availability: profile.availability || {},
      motivation: profile.motivation || {},
      accountabilityStyle: profile.preferences?.type || 'balanced',
      productiveTime: profile.availability?.peak_hours || 'morning',
      dailyCapacity: profile.availability?.daily_capacity || '2 hours',
    },
  };
}

/**
 * Get all challenges for a profile instantly
 */
function getChallenges(profileId, options = {}) {
  const challenges = cacheManager.getChallenges(profileId);

  let filtered = challenges;

  // Apply filters
  if (options.status) {
    filtered = filtered.filter(c => c.status === options.status);
  }

  if (options.active) {
    filtered = filtered.filter(c => c.status === 'active');
  }

  return {
    found: filtered.length > 0,
    count: filtered.length,
    data: filtered,
  };
}

/**
 * Get all todos for a profile instantly
 */
function getTodos(profileId, options = {}) {
  const todos = cacheManager.getTodos(profileId);

  let filtered = todos;

  // Apply filters
  if (options.completed !== undefined) {
    filtered = filtered.filter(t => t.completed === options.completed);
  }

  if (options.today) {
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(t => t.dueDate === today || t.date === today);
  }

  if (options.upcoming) {
    const today = new Date();
    filtered = filtered.filter(t => {
      const dueDate = new Date(t.dueDate || t.date);
      return dueDate >= today;
    });
  }

  return {
    found: filtered.length > 0,
    count: filtered.length,
    data: filtered,
  };
}

/**
 * Get agent data instantly
 */
function getAgent(agentId) {
  const agent = cacheManager.getAgent(agentId);

  if (!agent) {
    return {
      found: false,
      message: `Agent ${agentId} not found`,
    };
  }

  return {
    found: true,
    data: agent,
  };
}

/**
 * Get today's tasks for a user (instant summary)
 */
function getTodaysTasks(profileId) {
  const challenges = cacheManager.getChallenges(profileId);
  const todos = cacheManager.getTodos(profileId);
  const profile = cacheManager.getProfile(profileId);

  const today = new Date().toISOString().split('T')[0];

  // Filter today's todos
  const todaysTodos = todos.filter(t =>
    (t.dueDate === today || t.date === today) && !t.completed
  );

  // Get active challenges
  const activeChallenges = challenges.filter(c => c.status === 'active');

  return {
    found: true,
    profile: profile ? {
      name: profile.name,
      goal: profile.about || profile.big_goal,
    } : null,
    summary: {
      totalTodos: todaysTodos.length,
      totalChallenges: activeChallenges.length,
      completedToday: todos.filter(t =>
        (t.dueDate === today || t.date === today) && t.completed
      ).length,
    },
    todos: todaysTodos,
    challenges: activeChallenges,
  };
}

/**
 * Get user progress summary (instant)
 */
function getProgressSummary(profileId) {
  const challenges = cacheManager.getChallenges(profileId);
  const todos = cacheManager.getTodos(profileId);

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;

  return {
    found: true,
    challenges: {
      active: activeChallenges.length,
      completed: completedChallenges.length,
      total: challenges.length,
    },
    todos: {
      completed: completedTodos,
      pending: totalTodos - completedTodos,
      total: totalTodos,
      completionRate: totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0,
    },
    streaks: activeChallenges.map(c => ({
      name: c.name || c.challenge_name,
      streak: c.streak || 0,
      status: c.status,
    })),
  };
}

/**
 * Search across all data (fast in-memory search)
 */
function search(profileId, query) {
  const challenges = cacheManager.getChallenges(profileId);
  const todos = cacheManager.getTodos(profileId);

  const lowerQuery = query.toLowerCase();

  const matchingChallenges = challenges.filter(c => {
    const name = (c.name || c.challenge_name || '').toLowerCase();
    const goal = (c.goal || '').toLowerCase();
    return name.includes(lowerQuery) || goal.includes(lowerQuery);
  });

  const matchingTodos = todos.filter(t => {
    const text = (t.text || t.title || '').toLowerCase();
    return text.includes(lowerQuery);
  });

  return {
    found: matchingChallenges.length > 0 || matchingTodos.length > 0,
    results: {
      challenges: matchingChallenges,
      todos: matchingTodos,
    },
    count: {
      challenges: matchingChallenges.length,
      todos: matchingTodos.length,
      total: matchingChallenges.length + matchingTodos.length,
    },
  };
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return cacheManager.getStats();
}

/**
 * Invalidate cache for a profile (force reload)
 */
function invalidateProfile(profileId) {
  cacheManager.invalidate(`profile:${profileId}`);
  cacheManager.invalidate(`challenges:${profileId}`);
  cacheManager.invalidate(`todos:${profileId}`);
}

/**
 * Rebuild index (if data structure changes)
 */
async function rebuildIndex() {
  await cacheManager.rebuildIndex();
}

/**
 * Shutdown the system gracefully
 */
function shutdown() {
  cacheManager.shutdown();
}

/**
 * Get all available profile IDs
 */
function getAllProfileIds() {
  const ids = cacheManager.getAllProfileIds();

  // If no profiles found, try to scan the profiles directory directly
  if (ids.length === 0) {
    const fs = require('fs');
    const path = require('path');
    const profilesDir = path.join(__dirname, '..', 'data', 'profiles');

    if (fs.existsSync(profilesDir)) {
      const dirs = fs.readdirSync(profilesDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const profilePath = path.join(profilesDir, dir.name, 'profile.md');
          if (fs.existsSync(profilePath)) {
            ids.push(dir.name);
          }
        }
      }
    }
  }

  return ids;
}

/**
 * Get the first available profile ID (for single-user or default scenarios)
 * Defaults to Arjun (owner) if available
 */
function getFirstProfileId() {
  const DEFAULT_OWNER = 'arjun-gmail-com';

  // First check if Arjun (owner) exists
  const ownerProfile = cacheManager.getProfile(DEFAULT_OWNER);
  if (ownerProfile) {
    return DEFAULT_OWNER;
  }

  // Fall back to cache manager's first profile
  return cacheManager.getFirstProfileId();
}

// Export the API
module.exports = {
  initialize,
  getProfile,
  getOnboardingData,
  getChallenges,
  getTodos,
  getAgent,
  getTodaysTasks,
  getProgressSummary,
  search,
  getCacheStats,
  invalidateProfile,
  rebuildIndex,
  shutdown,
  getAllProfileIds,
  getFirstProfileId,
};

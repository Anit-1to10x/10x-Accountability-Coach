/**
 * Context Builder
 *
 * Builds rich context from user data for AI system prompts.
 * Provides all necessary information for personalized AI responses.
 * Integrates with prompt indexer for dynamic prompt selection.
 * Includes timezone-aware datetime context and agent capabilities.
 */

import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR, PATHS, getProfilePaths } from '../paths';
import {
  matchPrompts,
  renderPromptTemplate,
  PromptMatchResult,
  PromptContent,
} from './prompt-indexer';
import { getDateTimeContext } from '../datetime';
import {
  getAgentCapabilities,
  getAgentSkills,
  getAgentPrompts,
  AgentCapabilities,
} from '../agent-capabilities';
import { ragService, RAGContext } from '../rag';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  created?: string;
  lastActive?: string;
  owner?: boolean;
}

export interface Todo {
  id: string;
  title: string;
  text?: string;
  status: 'pending' | 'completed';
  completed: boolean;
  priority?: string;
  dueDate?: string | null;
  challengeName?: string | null;
}

export interface Challenge {
  id: string;
  name: string;
  type?: string;
  goal?: string;
  status?: string;
  startDate?: string;
  streak: {
    current: number;
    best: number;
    lastCheckin?: string | null;
  };
  progress: number;
  completedDays: number;
  totalDays: number;
}

export interface TaskSummary {
  totalTodos: number;
  completedToday: number;
  pending: number;
}

export interface ScheduleEvent {
  title: string;
  time?: string;
  date: string;
  type?: string;
}

export interface CheckinRecord {
  date: string;
  challengeId: string;
  mood?: string;
  notes?: string;
}

export interface DayTask {
  task: string;
  completed: boolean;
  duration?: string;
}

export interface DateTimeContext {
  date: string;
  time: string;
  dayOfWeek: string;
  greeting: string;
  dayProgress: number;
  timezone: string;
}

export interface UserContext {
  profile: UserProfile | null;
  tasks: {
    summary: TaskSummary;
    todos: Todo[];
  };
  challenges: {
    data: Challenge[];
    count: number;
    todaysTasks: Array<{
      challengeId: string;
      challengeName: string;
      dayNumber: number;
      tasks: DayTask[];
      focus?: string;
    }>;
  };
  progress: {
    streaks: Array<{
      challengeId: string;
      challengeName: string;
      streak: number;
    }>;
  };
  schedule: {
    today: ScheduleEvent[];
  };
  recentCheckins: CheckinRecord[];
  currentDate: string;
  datetime: DateTimeContext;
  ragContext?: RAGContext;
}

/**
 * Parse profile.md file to extract profile data
 */
async function parseProfileMd(profilePath: string): Promise<UserProfile | null> {
  try {
    const content = (await fs.readFile(profilePath, 'utf-8')).replace(/\r\n/g, '\n');
    const profile: UserProfile = { id: '', name: 'User' };

    // Extract fields from markdown
    const idMatch = content.match(/\*\*ID:\*\*\s*(.+)/i);
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/i);
    const emailMatch = content.match(/\*\*Email:\*\*\s*(.+)/i);

    if (idMatch) profile.id = idMatch[1].trim();
    if (nameMatch) profile.name = nameMatch[1].trim();
    if (emailMatch) profile.email = emailMatch[1].trim();

    return profile;
  } catch {
    return null;
  }
}

/**
 * Parse todos from active.md file
 */
async function parseTodosMd(todosPath: string): Promise<Todo[]> {
  try {
    const content = (await fs.readFile(todosPath, 'utf-8')).replace(/\r\n/g, '\n');
    const todos: Todo[] = [];
    const today = new Date().toISOString().split('T')[0];

    const lines = content.split('\n');
    let currentDate = today;
    let currentChallenge = '';

    for (const line of lines) {
      // Check for date sections
      const dateSectionMatch = line.match(/^##\s+Today\s*\((\d{4}-\d{2}-\d{2})\)/i);
      if (dateSectionMatch) {
        currentDate = dateSectionMatch[1];
        continue;
      }

      // Track current challenge/section header
      const sectionMatch = line.match(/^###\s+(.+)/);
      if (sectionMatch) {
        currentChallenge = sectionMatch[1].trim();
        continue;
      }

      // Match todo items
      const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(?:\*\*)?(.+?)(?:\*\*)?$/);
      if (todoMatch) {
        const completed = todoMatch[1].toLowerCase() === 'x';
        const title = todoMatch[2].trim();

        todos.push({
          id: `todo-${todos.length + 1}`,
          title,
          text: title,
          status: completed ? 'completed' : 'pending',
          completed,
          priority: 'medium',
          dueDate: currentDate,
          challengeName: currentChallenge || null,
        });
      }
    }

    return todos;
  } catch {
    return [];
  }
}

/**
 * Parse challenge.md file to extract challenge data
 */
async function parseChallengeMd(challengePath: string, id: string): Promise<Challenge | null> {
  try {
    const content = (await fs.readFile(challengePath, 'utf-8')).replace(/\r\n/g, '\n');
    const lines = content.split('\n');

    const challenge: Challenge = {
      id,
      name: id,
      streak: { current: 0, best: 0, lastCheckin: null },
      progress: 0,
      completedDays: 0,
      totalDays: 30,
    };

    // Extract name from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) challenge.name = titleMatch[1].trim();

    // Extract key-value pairs
    for (const line of lines) {
      const match = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/i);
      if (match) {
        const key = match[1].toLowerCase().replace(/\s+/g, '_');
        const value = match[2].trim();

        if (key === 'type') challenge.type = value;
        if (key === 'status') challenge.status = value;
        if (key === 'start_date' || key === 'startdate') challenge.startDate = value;
        if (key === 'current') challenge.streak.current = parseInt(value) || 0;
        if (key === 'best') challenge.streak.best = parseInt(value) || 0;
        if (key === 'last_check-in' || key === 'last_checkin') {
          challenge.streak.lastCheckin = value !== 'None' ? value : null;
        }
      }
    }

    // Extract goal from ## Goal section
    const goalMatch = content.match(/##\s*Goal\n+([^\n#]+)/i);
    if (goalMatch) challenge.goal = goalMatch[1].trim();

    return challenge;
  } catch {
    return null;
  }
}

/**
 * Load challenges for a profile
 * Uses profile-specific challenges directory if profileId is provided,
 * falling back to global challenges directory
 */
async function loadChallenges(profileId?: string): Promise<Challenge[]> {
  const challenges: Challenge[] = [];

  // Try profile-specific challenges first, then fall back to global
  const challengesDirs: string[] = [];
  if (profileId) {
    const profilePaths = getProfilePaths(profileId);
    challengesDirs.push(profilePaths.challenges);
  }
  challengesDirs.push(PATHS.challenges);

  const seenIds = new Set<string>();

  for (const challengesDir of challengesDirs) {
    try {
      const dirs = await fs.readdir(challengesDir, { withFileTypes: true });

      for (const dir of dirs) {
        if (dir.isDirectory() && !seenIds.has(dir.name)) {
          seenIds.add(dir.name);
          const challengePath = path.join(challengesDir, dir.name, 'challenge.md');
          const challenge = await parseChallengeMd(challengePath, dir.name);
          if (challenge) {
            challenges.push(challenge);
          }
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  return challenges;
}

/**
 * Parse day-XX.md file to extract today's tasks for a challenge
 */
async function parseDayTasks(challengeDir: string, dayNumber: number): Promise<{ tasks: DayTask[]; focus?: string }> {
  const tasks: DayTask[] = [];
  let focus: string | undefined;

  try {
    const dayFile = path.join(challengeDir, 'days', `day-${String(dayNumber).padStart(2, '0')}.md`);
    const content = (await fs.readFile(dayFile, 'utf-8')).replace(/\r\n/g, '\n');

    // Extract focus from "Today's Focus" section
    const focusMatch = content.match(/##\s*Today'?s?\s*Focus\n+([^\n#]+)/i);
    if (focusMatch) focus = focusMatch[1].trim();

    // Extract tasks
    const lines = content.split('\n');
    for (const line of lines) {
      const taskMatch = line.match(/^-\s*\[([ xX])\]\s*(.+?)(?:\s*\((\d+)\s*min\))?$/);
      if (taskMatch) {
        tasks.push({
          task: taskMatch[2].trim(),
          completed: taskMatch[1].toLowerCase() === 'x',
          duration: taskMatch[3] ? `${taskMatch[3]} min` : undefined,
        });
      }
    }
  } catch {
    // Day file might not exist
  }

  return { tasks, focus };
}

/**
 * Calculate what day of the challenge we're on
 */
function calculateChallengeDay(startDate: string | undefined, totalDays: number): number {
  if (!startDate) return 1;

  const start = new Date(startDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.min(Math.max(1, diffDays), totalDays);
}

/**
 * Load schedule events for today
 */
async function loadTodaySchedule(profileId?: string): Promise<ScheduleEvent[]> {
  const events: ScheduleEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    // Try profile-specific schedule
    if (profileId) {
      const profilePaths = getProfilePaths(profileId);
      const schedulePath = path.join(profilePaths.schedule, 'events.json');
      try {
        const content = (await fs.readFile(schedulePath, 'utf-8')).replace(/\r\n/g, '\n');
        const allEvents = JSON.parse(content);
        if (Array.isArray(allEvents)) {
          events.push(...allEvents.filter((e: ScheduleEvent) => e.date === today));
        }
      } catch {
        // File might not exist
      }
    }

    // Also check data/schedule/events.md
    const scheduleDir = path.join(DATA_DIR, 'schedule');
    const eventsMd = path.join(scheduleDir, 'events.md');
    try {
      const content = (await fs.readFile(eventsMd, 'utf-8')).replace(/\r\n/g, '\n');
      const lines = content.split('\n');
      let currentDate = '';

      for (const line of lines) {
        const dateMatch = line.match(/^##\s*(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          currentDate = dateMatch[1];
          continue;
        }

        if (currentDate === today) {
          const eventMatch = line.match(/^-\s*(?:(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*[-–]\s*)?(.+)/i);
          if (eventMatch) {
            events.push({
              title: eventMatch[2].trim(),
              time: eventMatch[1] || undefined,
              date: today,
            });
          }
        }
      }
    } catch {
      // File might not exist
    }
  } catch {
    // Schedule directory might not exist
  }

  return events;
}

/**
 * Load recent check-ins (last 7 days)
 */
async function loadRecentCheckins(profileId?: string): Promise<CheckinRecord[]> {
  const checkins: CheckinRecord[] = [];

  try {
    const checkinsDir = profileId
      ? getProfilePaths(profileId).checkins
      : PATHS.checkins;

    const files = await fs.readdir(checkinsDir);
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const file of files.slice(-14)) { // Check last 14 files max
      if (file.endsWith('.md')) {
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate >= sevenDaysAgo) {
            const content = (await fs.readFile(path.join(checkinsDir, file), 'utf-8')).replace(/\r\n/g, '\n');
            const moodMatch = content.match(/\*\*Mood:\*\*\s*(.+)/i);
            const challengeMatch = content.match(/\*\*Challenge:\*\*\s*(.+)/i);

            checkins.push({
              date: dateMatch[1],
              challengeId: challengeMatch?.[1]?.trim() || 'unknown',
              mood: moodMatch?.[1]?.trim(),
            });
          }
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return checkins.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Build complete context object from user data
 * @param profileId - The user's profile ID
 * @param timezone - Optional timezone override (auto-detected if not provided)
 * @returns Context object with profile, tasks, challenges, progress, schedule, checkins, datetime
 */
export async function buildContext(profileId?: string | null, timezone?: string): Promise<UserContext> {
  // Get timezone-aware datetime context
  const datetimeCtx = getDateTimeContext(timezone);
  const today = datetimeCtx.date.split(',')[0] || new Date().toISOString().split('T')[0];

  if (!profileId) {
    return {
      profile: null,
      tasks: { summary: { totalTodos: 0, completedToday: 0, pending: 0 }, todos: [] },
      challenges: { data: [], count: 0, todaysTasks: [] },
      progress: { streaks: [] },
      schedule: { today: [] },
      recentCheckins: [],
      currentDate: today,
      datetime: datetimeCtx,
    };
  }

  const profilePaths = getProfilePaths(profileId);

  // Load profile
  const profilePath = path.join(profilePaths.profile, 'profile.md');
  const profile = await parseProfileMd(profilePath);

  // Load todos - try profile-specific first, then fallback to legacy
  let todos: Todo[] = [];
  const profileTodosPath = path.join(profilePaths.todos, 'active.md');
  todos = await parseTodosMd(profileTodosPath);
  if (todos.length === 0) {
    const legacyTodosPath = path.join(PATHS.todos, 'active.md');
    todos = await parseTodosMd(legacyTodosPath);
  }

  // Calculate task summary
  const todaysTodos = todos.filter(t => t.dueDate === today || !t.dueDate);
  const completedToday = todaysTodos.filter(t => t.completed).length;
  const pending = todaysTodos.filter(t => !t.completed).length;

  // Load challenges
  const challenges = await loadChallenges(profileId);

  // Load today's tasks for each active challenge
  // Use profile-specific challenge dir if available, fallback to global
  const todaysTasks: UserContext['challenges']['todaysTasks'] = [];
  for (const challenge of challenges.filter(c => c.status === 'active' || !c.status)) {
    const dayNumber = calculateChallengeDay(challenge.startDate, challenge.totalDays);
    let challengeDir = path.join(PATHS.challenges, challenge.id);
    if (profileId) {
      const profileChallengeDir = path.join(getProfilePaths(profileId).challenges, challenge.id);
      try {
        await fs.access(profileChallengeDir);
        challengeDir = profileChallengeDir;
      } catch {
        // Profile-specific dir doesn't exist, use global
      }
    }
    const { tasks, focus } = await parseDayTasks(challengeDir, dayNumber);

    if (tasks.length > 0) {
      todaysTasks.push({
        challengeId: challenge.id,
        challengeName: challenge.name,
        dayNumber,
        tasks,
        focus,
      });
    }
  }

  // Build progress streaks
  const streaks = challenges
    .filter(c => c.streak.current > 0)
    .map(c => ({
      challengeId: c.id,
      challengeName: c.name,
      streak: c.streak.current,
    }))
    .sort((a, b) => b.streak - a.streak);

  // Load schedule and check-ins
  const scheduleEvents = await loadTodaySchedule(profileId);
  const recentCheckins = await loadRecentCheckins(profileId);

  return {
    profile: profile || { id: profileId, name: 'User' },
    tasks: {
      summary: {
        totalTodos: todaysTodos.length,
        completedToday,
        pending,
      },
      todos: todaysTodos.slice(0, 10), // Limit for context
    },
    challenges: {
      data: challenges,
      count: challenges.length,
      todaysTasks,
    },
    progress: {
      streaks,
    },
    schedule: {
      today: scheduleEvents,
    },
    recentCheckins,
    currentDate: today,
    datetime: datetimeCtx,
  };
}

/**
 * Build the system prompt for the AI with user context
 * @param context - Context object from buildContext()
 * @param agentId - The agent being used (for personality)
 * @param matchedSkill - Optional matched skill content to include
 * @returns System prompt with context
 */
export function buildSystemPrompt(
  context: UserContext,
  agentId: string = 'unified',
  matchedSkill?: { name: string; body: string } | null
): string {
  const userName = context.profile?.name || 'User';
  const challengeCount = context.challenges?.count || 0;
  const pendingTasks = context.tasks?.summary?.pending || 0;
  const completedTasks = context.tasks?.summary?.completedToday || 0;
  const currentStreak = context.progress?.streaks?.[0]?.streak || 0;
  const currentDate = context.currentDate || new Date().toISOString().split('T')[0];

  // Build task list
  let taskList = '';
  if (context.tasks?.todos?.length > 0) {
    taskList = context.tasks.todos
      .slice(0, 5)
      .map((t, i) => `  ${i + 1}. [${t.completed ? 'x' : ' '}] ${t.text || t.title}`)
      .join('\n');
  }

  // Build challenge list with more details
  let challengeList = '';
  if (context.challenges?.data?.length > 0) {
    challengeList = context.challenges.data
      .map(c => {
        const streak = c.streak?.current || 0;
        const status = c.status || 'active';
        const goal = c.goal ? ` - Goal: ${c.goal}` : '';
        return `  - **${c.name}** (${status})${streak > 0 ? ` | ${streak} day streak` : ''}${goal}`;
      })
      .join('\n');
  }

  // Build today's challenge tasks
  let todaysChallengeTasks = '';
  if (context.challenges?.todaysTasks?.length > 0) {
    todaysChallengeTasks = context.challenges.todaysTasks
      .map(ct => {
        const taskLines = ct.tasks
          .map(t => `    - [${t.completed ? 'x' : ' '}] ${t.task}${t.duration ? ` (${t.duration})` : ''}`)
          .join('\n');
        return `  **${ct.challengeName} - Day ${ct.dayNumber}**${ct.focus ? `\n  Focus: ${ct.focus}` : ''}\n${taskLines}`;
      })
      .join('\n\n');
  }

  // Build schedule
  let scheduleList = '';
  if (context.schedule?.today?.length > 0) {
    scheduleList = context.schedule.today
      .map(e => `  - ${e.time ? `${e.time}: ` : ''}${e.title}`)
      .join('\n');
  }

  // Build recent check-ins summary
  let checkinSummary = '';
  if (context.recentCheckins?.length > 0) {
    const lastCheckin = context.recentCheckins[0];
    const checkinCount = context.recentCheckins.length;
    checkinSummary = `Last check-in: ${lastCheckin.date}${lastCheckin.mood ? ` (Mood: ${lastCheckin.mood})` : ''} | ${checkinCount} check-ins in the last 7 days`;
  }

  // Base system prompt
  let systemPrompt = `You are the 10X Coach, a personal accountability coach by Team 10X. You help users stay on track with their goals, challenges, and daily tasks.

## Current Date
${currentDate}

## User Context
- **Name:** ${userName}
- **Active Challenges:** ${challengeCount}
- **Pending Tasks Today:** ${pendingTasks}
- **Completed Today:** ${completedTasks}
- **Current Streak:** ${currentStreak} days
${checkinSummary ? `- **Check-in History:** ${checkinSummary}` : ''}

`;

  // Add today's tasks if available
  if (taskList) {
    systemPrompt += `## Today's Todo Tasks
${taskList}

`;
  }

  // Add today's challenge-specific tasks
  if (todaysChallengeTasks) {
    systemPrompt += `## Today's Challenge Tasks
${todaysChallengeTasks}

`;
  }

  // Add challenge details if available
  if (challengeList) {
    systemPrompt += `## Active Challenges
${challengeList}

`;
  }

  // Add schedule if available
  if (scheduleList) {
    systemPrompt += `## Today's Schedule
${scheduleList}

`;
  }

  // Add skill instructions if matched
  if (matchedSkill) {
    systemPrompt += `## Active Skill: ${matchedSkill.name}
The user's message matched this skill. Follow these instructions:

${matchedSkill.body}

`;
  }

  // Add coaching guidelines
  systemPrompt += `## Your Role
1. Be encouraging but honest - reference their ACTUAL progress data shown above
2. Help them overcome blockers and stay accountable
3. Celebrate their wins, even small ones
4. Keep responses concise and actionable
5. When discussing tasks or challenges, reference the specific items from the context above

## Available Slash Commands
- /streak - Check in to their challenge
- /streak-new - Create a new challenge
- /streak-list - Show all challenges
- /streak-stats - Show statistics
- /schedule - View and manage schedule
- /motivation - Get motivational content

## Important Guidelines
- Always use the user's actual data to personalize responses
- If they mention a challenge or task, verify it exists in their context
- Suggest specific next actions based on their current progress
- Be aware of their current day in each challenge

Respond naturally and helpfully. Use the context above to personalize your responses.`;

  return systemPrompt;
}

/**
 * Format context as a readable summary string
 * @param context - Context object from buildContext()
 * @returns Human-readable summary
 */
export function formatContextSummary(context: UserContext): string {
  const userName = context.profile?.name || 'User';
  const challengeCount = context.challenges?.count || 0;
  const pendingTasks = context.tasks?.summary?.pending || 0;
  const streak = context.progress?.streaks?.[0]?.streak || 0;

  return `${userName}: ${challengeCount} challenges, ${pendingTasks} pending tasks, ${streak} day streak`;
}

/**
 * Build an optimized system prompt using dynamic prompt matching
 * Uses agent capabilities to filter available prompts and skills
 * Includes timezone-aware datetime context
 *
 * @param context - User context from buildContext()
 * @param userMessage - The user's message to match prompts against
 * @param agentId - Agent ID for filtering (determines which prompts/skills are available)
 * @param matchedSkill - Optional skill content
 * @returns Enhanced system prompt with matched prompts
 */
export async function buildEnhancedSystemPrompt(
  context: UserContext,
  userMessage: string,
  agentId: string = 'unified',
  matchedSkill?: { name: string; body: string } | null,
  enableRAG: boolean = true
): Promise<{ systemPrompt: string; matchedPrompts: PromptMatchResult; agentCapabilities: AgentCapabilities; ragContext?: RAGContext }> {
  // Get agent capabilities (which prompts/skills this agent can use)
  const capabilities = await getAgentCapabilities(agentId);

  // Fetch RAG context if enabled and available
  let ragContext: RAGContext | undefined;
  if (enableRAG && ragService.isAvailable()) {
    try {
      ragContext = await ragService.agenticSearch(userMessage, {
        limit: 3,
        threshold: 0.3,
      });
      // Only include if we found relevant documents
      if (ragContext.relevantDocuments.length === 0) {
        ragContext = undefined;
      }
    } catch (error) {
      console.warn('[Context Builder] RAG search failed:', error);
    }
  }

  // Match prompts to user message
  let matchedPrompts = await matchPrompts(userMessage);

  // Filter matched prompts based on agent capabilities
  if (capabilities.restrictions?.allowOnlyAssigned && matchedPrompts.primary) {
    const promptId = matchedPrompts.primary.prompt.id ||
      matchedPrompts.primary.prompt.name?.toLowerCase().replace(/\s+/g, '-');

    if (!capabilities.assignedPrompts.includes(promptId)) {
      // Primary prompt not allowed for this agent - clear it
      matchedPrompts = {
        ...matchedPrompts,
        primary: null,
      };
    }
  }

  // Prepare template context for rendering (dynamic based on user profile)
  const templateContext = {
    name: context.profile?.name || 'User',
    today_date: context.datetime?.date || context.currentDate,
    time: context.datetime?.time || '',
    timezone: context.datetime?.timezone || 'UTC',
    greeting: context.datetime?.greeting || 'Hello',
    day_of_week: context.datetime?.dayOfWeek || '',
    day_progress: String(context.datetime?.dayProgress || 0),
    active_challenges: String(context.challenges?.count || 0),
    pending_tasks: String(context.tasks?.summary?.pending || 0),
    completed_tasks: String(context.tasks?.summary?.completedToday || 0),
    current_streak: String(context.progress?.streaks?.[0]?.streak || 0),
    daily_hours: '8', // Default, could be from user preferences
  };

  // Build the system prompt
  const userName = context.profile?.name || 'User';
  const challengeCount = context.challenges?.count || 0;
  const pendingTasks = context.tasks?.summary?.pending || 0;
  const completedTasks = context.tasks?.summary?.completedToday || 0;
  const currentStreak = context.progress?.streaks?.[0]?.streak || 0;

  // Use timezone-aware date/time
  const datetime = context.datetime || getDateTimeContext();
  const greeting = datetime.greeting;
  const currentDate = datetime.date;
  const currentTime = datetime.time;
  const dayOfWeek = datetime.dayOfWeek;
  const timezone = datetime.timezone;
  const dayProgress = datetime.dayProgress;

  // Determine agent personality
  const personality = capabilities.personality;
  let personalityInstructions = '';
  if (personality) {
    const toneDescriptions: Record<string, string> = {
      strict: 'Be direct, demanding, and hold high standards. No excuses accepted.',
      balanced: 'Be supportive but honest. Celebrate wins while pushing for growth.',
      friendly: 'Be warm, encouraging, and focus on positive reinforcement.',
    };
    personalityInstructions = toneDescriptions[personality.tone] || '';
    if (personality.style) {
      personalityInstructions += ` ${personality.style}`;
    }
  }

  // Start with core identity and datetime context
  let systemPrompt = `You are the 10X Coach, a personal accountability coach by Team 10X.

## Current Date & Time
- **Date:** ${currentDate} (${dayOfWeek})
- **Time:** ${currentTime} (${timezone})
- **Day Progress:** ${dayProgress}% of productive day complete

## User Context
${greeting}, ${userName}!
- **Active Challenges:** ${challengeCount}
- **Pending Tasks:** ${pendingTasks}
- **Completed Today:** ${completedTasks}
- **Current Streak:** ${currentStreak} days

`;

  // Add personality instructions if configured
  if (personalityInstructions) {
    systemPrompt += `## Coaching Style
${personalityInstructions}

`;
  }

  // Add matched prompt's framework/guidance if available and allowed
  // IMPORTANT: The framework is for AI guidance only - never output template text directly
  if (matchedPrompts.primary && matchedPrompts.primary.score > 5) {
    const renderedTemplate = renderPromptTemplate(
      matchedPrompts.primary.prompt.template,
      templateContext
    );

    systemPrompt += `## Active Framework: ${matchedPrompts.primary.prompt.name}
**IMPORTANT INSTRUCTION**: The following framework is for your internal guidance ONLY.
DO NOT output this template text directly to the user.
Instead, USE these concepts to generate a natural, conversational response that addresses the user's specific question.
Generate a fresh, personalized response - never copy template text verbatim.

Framework guidance:
${renderedTemplate}

`;
  }

  // Add system prompt guidance for complex reasoning
  if (matchedPrompts.systemPrompt) {
    systemPrompt += `## Reasoning Protocol
${matchedPrompts.systemPrompt.template}

`;
  }

  // Add custom system prompt override if agent has one
  if (capabilities.systemPrompt) {
    systemPrompt += `## Agent Instructions
${capabilities.systemPrompt}

`;
  }

  // Add skill instructions if matched
  if (matchedSkill) {
    systemPrompt += `## Active Skill: ${matchedSkill.name}
${matchedSkill.body}

`;
  }

  // Add condensed task list
  if (context.tasks?.todos?.length > 0) {
    const taskList = context.tasks.todos
      .slice(0, 5)
      .map((t, i) => `${i + 1}. [${t.completed ? 'x' : ' '}] ${t.text || t.title}`)
      .join('\n');
    systemPrompt += `## Today's Tasks
${taskList}

`;
  }

  // Add challenge info if relevant
  const needsChallengeContext = matchedPrompts.contextRequirements.some(
    r => r.type === 'challenges' && r.required
  );
  if (needsChallengeContext && context.challenges?.data?.length > 0) {
    const challengeList = context.challenges.data
      .slice(0, 3)
      .map(c => `- ${c.name}: ${c.streak?.current || 0} day streak`)
      .join('\n');
    systemPrompt += `## Challenges
${challengeList}

`;
  }

  // Add blocked topics if configured
  if (capabilities.restrictions?.blockedTopics?.length) {
    systemPrompt += `## Topics to Avoid
Do not discuss: ${capabilities.restrictions.blockedTopics.join(', ')}

`;
  }

  // Add available skills context (only assigned ones)
  if (capabilities.assignedSkills.length > 0) {
    systemPrompt += `## Your Available Skills
You can help with: ${capabilities.assignedSkills.join(', ')}
${capabilities.restrictions?.allowOnlyAssigned ? 'Note: Only use your assigned skills. For other requests, guide the user appropriately.' : ''}

`;
  }

  // Add RAG knowledge base context if available
  if (ragContext && ragContext.relevantDocuments.length > 0) {
    systemPrompt += `## Knowledge Base (RAG)
The following articles from the knowledge base may be relevant to the user's question.
Use this information to provide more informed, accurate responses:

${ragContext.contextText}

**Sources:** ${ragContext.sources.map(s => s.title).join(', ')}
**Confidence:** ${Math.round(ragContext.confidence * 100)}%

`;
  }

  // Add concise coaching guidelines
  systemPrompt += `## Guidelines
- ALWAYS generate fresh, natural conversational responses - never output template text
- Reference user's actual data from context above (challenges, tasks, streaks, etc.)
- Be encouraging but honest about their progress
- Keep responses concise and actionable
- Use time-aware greetings (${datetime.greeting}) and acknowledge the user's timezone
- Apply the ${matchedPrompts.primary?.prompt.name || 'coaching'} framework concepts, but express them in your own words
- Personalize based on the user's stated goals and current context
- Never show placeholders like {{variable}} - all data should be filled in
- This is a multi-turn conversation. Reference and build upon previous messages naturally. Do not repeat information already discussed unless asked.`;

  return { systemPrompt, matchedPrompts, agentCapabilities: capabilities, ragContext };
}

/**
 * Get a compact context string for token optimization
 * @param context - User context from buildContext()
 * @returns Compact context string
 */
export function getCompactContext(context: UserContext): string {
  const parts: string[] = [];

  if (context.profile?.name) {
    parts.push(`User: ${context.profile.name}`);
  }

  if (context.challenges?.count) {
    parts.push(`${context.challenges.count} challenges`);
    const streak = context.progress?.streaks?.[0]?.streak;
    if (streak) parts.push(`${streak}d streak`);
  }

  if (context.tasks?.summary?.pending) {
    parts.push(`${context.tasks.summary.pending} pending tasks`);
  }

  return parts.join(' | ');
}

/**
 * Prompt Indexer & Matcher
 *
 * Loads, indexes, and dynamically matches prompts to user queries.
 * Provides intelligent prompt selection for optimized API responses.
 */

import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from '../paths';

const PROMPTS_DIR = path.join(DATA_DIR, 'prompts');
const SYSTEM_PROMPTS_DIR = path.join(PROMPTS_DIR, 'system');

export interface PromptMetadata {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  intent: string[];
  category: string;
  priority: number;
  reasoning?: string;
  type?: string;
  filePath: string;
}

export interface PromptContent extends PromptMetadata {
  template: string;
  fullContent: string;
}

export interface MatchedPrompt {
  prompt: PromptContent;
  score: number;
  matchReasons: string[];
}

export interface PromptMatchResult {
  primary: MatchedPrompt | null;
  secondary: MatchedPrompt[];
  systemPrompt: PromptContent | null;
  contextRequirements: ContextRequirement[];
}

export interface ContextRequirement {
  type: 'profile' | 'tasks' | 'challenges' | 'checkins' | 'schedule' | 'history';
  required: boolean;
}

// Cache for loaded prompts
let promptsCache: Map<string, PromptContent> | null = null;
let systemPromptsCache: Map<string, PromptContent> | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL = 120000; // 2 minute cache

/**
 * Parse prompt metadata from markdown content
 */
function parsePromptMetadata(content: string, filePath: string): PromptMetadata | null {
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''));

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');

  const metadata: PromptMetadata = {
    id: path.basename(filePath, '.md'),
    name,
    description: '',
    keywords: [],
    intent: [],
    category: 'general',
    priority: 5,
    filePath,
  };

  // Parse metadata lines
  for (const line of lines) {
    const match = line.match(/^-\s*(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();

      switch (key) {
        case 'description':
          metadata.description = value;
          break;
        case 'keywords':
          metadata.keywords = value.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
          break;
        case 'intent':
          metadata.intent = value.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
          break;
        case 'category':
          metadata.category = value.toLowerCase();
          break;
        case 'priority':
          metadata.priority = parseInt(value) || 5;
          break;
        case 'reasoning':
          metadata.reasoning = value;
          break;
        case 'type':
          metadata.type = value;
          break;
      }
    }
  }

  return metadata;
}

/**
 * Extract template content from prompt file
 */
function extractTemplate(content: string): string {
  // Find ## Template section
  const templateMatch = content.match(/##\s*(?:Template|System Prompt)\s*\n([\s\S]*?)(?=\n##|\n$|$)/i);
  if (templateMatch) {
    return templateMatch[1].trim();
  }

  // Fallback: remove metadata section and return rest
  const lines = content.split('\n');
  let templateStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Find first ## heading or empty line after metadata
    if (line.startsWith('##') || (i > 5 && line.trim() === '')) {
      templateStart = i;
      break;
    }
  }

  return lines.slice(templateStart).join('\n').trim();
}

/**
 * Load a single prompt file
 */
async function loadPromptFile(filePath: string): Promise<PromptContent | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const metadata = parsePromptMetadata(content, filePath);

    if (!metadata) return null;

    return {
      ...metadata,
      template: extractTemplate(content),
      fullContent: content,
    };
  } catch {
    return null;
  }
}

/**
 * Load all prompts from a directory
 */
async function loadPromptsFromDir(dir: string): Promise<Map<string, PromptContent>> {
  const prompts = new Map<string, PromptContent>();

  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          const prompt = await loadPromptFile(filePath);
          if (prompt) {
            prompts.set(prompt.id, prompt);
          }
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return prompts;
}

/**
 * Ensure prompt cache is loaded
 */
async function ensureCache(): Promise<void> {
  const now = Date.now();
  if (promptsCache && systemPromptsCache && (now - lastLoadTime) < CACHE_TTL) {
    return;
  }

  promptsCache = await loadPromptsFromDir(PROMPTS_DIR);
  systemPromptsCache = await loadPromptsFromDir(SYSTEM_PROMPTS_DIR);
  lastLoadTime = now;
}

/**
 * Tokenize a string into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

/**
 * Calculate keyword overlap score
 */
function calculateKeywordScore(queryTokens: string[], keywords: string[]): number {
  let score = 0;

  for (const keyword of keywords) {
    const keywordTokens = tokenize(keyword);

    for (const kToken of keywordTokens) {
      for (const qToken of queryTokens) {
        // Exact match
        if (qToken === kToken) {
          score += 3;
        }
        // Partial match (starts with)
        else if (qToken.startsWith(kToken) || kToken.startsWith(qToken)) {
          score += 1.5;
        }
        // Contains
        else if (qToken.includes(kToken) || kToken.includes(qToken)) {
          score += 0.5;
        }
      }
    }
  }

  return score;
}

/**
 * Calculate intent alignment score
 */
function calculateIntentScore(query: string, intents: string[]): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  for (const intent of intents) {
    if (queryLower.includes(intent)) {
      score += 5;
    } else {
      // Check word overlap
      const intentWords = tokenize(intent);
      const queryWords = tokenize(query);
      const overlap = intentWords.filter(w => queryWords.includes(w)).length;
      score += overlap * 2;
    }
  }

  return score;
}

/**
 * Detect query category from message
 */
function detectCategory(query: string): string[] {
  const categories: string[] = [];
  const queryLower = query.toLowerCase();

  const categoryPatterns: Record<string, RegExp[]> = {
    'planning': [/plan/i, /schedule/i, /organize/i, /prioritize/i, /next\s+steps/i],
    'productivity': [/focus/i, /productive/i, /time\s+management/i, /get\s+things\s+done/i],
    'reflection': [/review/i, /reflect/i, /progress/i, /how\s+did/i, /looking\s+back/i],
    'problem-solving': [/problem/i, /stuck/i, /obstacle/i, /blocker/i, /can't/i, /help\s+me/i],
    'motivation': [/motivat/i, /inspir/i, /encourage/i, /push\s+me/i],
    'wellness': [/stress/i, /overwhelm/i, /energy/i, /tired/i, /burnout/i],
    'mindset': [/fear/i, /afraid/i, /anxious/i, /confidence/i, /belief/i],
    'learning': [/learn/i, /skill/i, /course/i, /study/i, /education/i],
    'career': [/career/i, /job/i, /work/i, /professional/i, /interview/i],
    'tech-skills': [/ai\s+agent/i, /rag/i, /vector/i, /coding/i, /develop/i, /programming/i],
    'business': [/startup/i, /business/i, /entrepreneur/i, /founder/i],
    'marketing': [/marketing/i, /influencer/i, /content/i, /social\s+media/i],
    'operations': [/operations/i, /manufacturing/i, /process/i, /efficiency/i],
    'leadership': [/leader/i, /executive/i, /ceo/i, /manage/i, /strategy/i],
    'analysis': [/research/i, /analyze/i, /investigate/i, /understand/i],
    'soft-skills': [/communicat/i, /talk/i, /speak/i, /conversation/i],
    'celebration': [/achiev/i, /accomplish/i, /complet/i, /success/i, /win/i],
    'habits': [/habit/i, /routine/i, /daily/i, /streak/i],
  };

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(p => p.test(queryLower))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories : ['general'];
}

/**
 * Score a single prompt against a query
 */
function scorePrompt(prompt: PromptContent, query: string, detectedCategories: string[]): MatchedPrompt {
  const queryTokens = tokenize(query);
  const matchReasons: string[] = [];
  let totalScore = 0;

  // Keyword score (weight: 3)
  const keywordScore = calculateKeywordScore(queryTokens, prompt.keywords);
  if (keywordScore > 0) {
    matchReasons.push(`Keywords: +${keywordScore.toFixed(1)}`);
    totalScore += keywordScore * 3;
  }

  // Intent score (weight: 4)
  const intentScore = calculateIntentScore(query, prompt.intent);
  if (intentScore > 0) {
    matchReasons.push(`Intent: +${intentScore.toFixed(1)}`);
    totalScore += intentScore * 4;
  }

  // Category match (weight: 5)
  if (detectedCategories.includes(prompt.category)) {
    matchReasons.push(`Category: ${prompt.category}`);
    totalScore += 5;
  }

  // Priority bonus (weight: normalized 0-2)
  const priorityBonus = (prompt.priority / 10) * 2;
  totalScore += priorityBonus;

  // Direct name/description match
  const nameTokens = tokenize(prompt.name);
  const descTokens = tokenize(prompt.description);
  const nameOverlap = nameTokens.filter(t => queryTokens.includes(t)).length;
  const descOverlap = descTokens.filter(t => queryTokens.includes(t)).length;

  if (nameOverlap > 0) {
    matchReasons.push(`Name match: ${nameOverlap} words`);
    totalScore += nameOverlap * 4;
  }

  if (descOverlap > 0) {
    matchReasons.push(`Desc match: ${descOverlap} words`);
    totalScore += descOverlap * 2;
  }

  return {
    prompt,
    score: totalScore,
    matchReasons,
  };
}

/**
 * Determine context requirements based on query
 */
function determineContextRequirements(query: string): ContextRequirement[] {
  const requirements: ContextRequirement[] = [];
  const queryLower = query.toLowerCase();

  // Always include profile for personalization
  requirements.push({ type: 'profile', required: true });

  // Check for task-related queries
  if (/task|todo|pending|complete|finish/i.test(queryLower)) {
    requirements.push({ type: 'tasks', required: true });
  } else {
    requirements.push({ type: 'tasks', required: false });
  }

  // Check for challenge-related queries
  if (/challenge|streak|day\s+\d|check\s*in/i.test(queryLower)) {
    requirements.push({ type: 'challenges', required: true });
  } else {
    requirements.push({ type: 'challenges', required: false });
  }

  // Check for history/review queries
  if (/history|progress|review|how\s+did|last\s+week|yesterday/i.test(queryLower)) {
    requirements.push({ type: 'checkins', required: true });
    requirements.push({ type: 'history', required: true });
  } else {
    requirements.push({ type: 'checkins', required: false });
    requirements.push({ type: 'history', required: false });
  }

  // Check for schedule queries
  if (/schedule|today|tomorrow|calendar|meeting/i.test(queryLower)) {
    requirements.push({ type: 'schedule', required: true });
  } else {
    requirements.push({ type: 'schedule', required: false });
  }

  return requirements;
}

/**
 * Select appropriate system prompt based on query analysis
 */
function selectSystemPrompt(
  query: string,
  detectedCategories: string[]
): PromptContent | null {
  if (!systemPromptsCache) return null;

  const queryLower = query.toLowerCase();

  // Route to specific system prompts based on complexity
  if (/break\s+down|decompose|steps|how\s+to/i.test(queryLower)) {
    return systemPromptsCache.get('task-decomposition-agent') || null;
  }

  if (/solve|problem|stuck|obstacle|blocker/i.test(queryLower)) {
    return systemPromptsCache.get('reasoning-chain') || null;
  }

  // Default to query analysis for complex queries
  if (query.length > 100 || query.includes('?')) {
    return systemPromptsCache.get('query-analysis') || null;
  }

  return null;
}

/**
 * Match user query to relevant prompts
 */
export async function matchPrompts(
  query: string,
  maxResults: number = 3
): Promise<PromptMatchResult> {
  await ensureCache();

  const detectedCategories = detectCategory(query);
  const contextRequirements = determineContextRequirements(query);

  // Score all prompts
  const scoredPrompts: MatchedPrompt[] = [];

  for (const prompt of promptsCache!.values()) {
    // Skip system prompts
    if (prompt.category === 'system' || prompt.type === 'agentic-system') {
      continue;
    }

    const scored = scorePrompt(prompt, query, detectedCategories);
    if (scored.score > 0) {
      scoredPrompts.push(scored);
    }
  }

  // Sort by score descending
  scoredPrompts.sort((a, b) => b.score - a.score);

  // Get primary and secondary matches
  const primary = scoredPrompts[0] || null;
  const secondary = scoredPrompts.slice(1, maxResults);

  // Select system prompt for enhanced reasoning
  const systemPrompt = selectSystemPrompt(query, detectedCategories);

  return {
    primary,
    secondary,
    systemPrompt,
    contextRequirements,
  };
}

/**
 * Get all prompts by category
 */
export async function getPromptsByCategory(category: string): Promise<PromptContent[]> {
  await ensureCache();

  return Array.from(promptsCache!.values()).filter(p => p.category === category);
}

/**
 * Get a specific prompt by ID
 */
export async function getPromptById(id: string): Promise<PromptContent | null> {
  await ensureCache();

  return promptsCache!.get(id) || systemPromptsCache!.get(id) || null;
}

/**
 * Get all available categories
 */
export async function getAllCategories(): Promise<string[]> {
  await ensureCache();

  const categories = new Set<string>();
  for (const prompt of promptsCache!.values()) {
    categories.add(prompt.category);
  }

  return Array.from(categories).sort();
}

/**
 * Get all prompts with metadata
 */
export async function getAllPrompts(): Promise<PromptContent[]> {
  await ensureCache();

  return Array.from(promptsCache!.values());
}

/**
 * Get system prompts
 */
export async function getSystemPrompts(): Promise<PromptContent[]> {
  await ensureCache();

  return Array.from(systemPromptsCache!.values());
}

/**
 * Clear prompt cache (useful for testing or when prompts are updated)
 */
export function clearPromptCache(): void {
  promptsCache = null;
  systemPromptsCache = null;
  lastLoadTime = 0;
}

/**
 * Render a prompt template with user context
 */
export function renderPromptTemplate(
  template: string,
  context: Record<string, string | number | undefined>
): string {
  let rendered = template;

  // Replace {{variable}} placeholders
  for (const [key, value] of Object.entries(context)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    rendered = rendered.replace(placeholder, String(value ?? ''));
  }

  return rendered;
}

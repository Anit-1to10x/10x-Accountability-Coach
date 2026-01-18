/**
 * Prompts Manager Module
 *
 * Dynamically loads and matches prompts from data/prompts folder.
 * Prompts are used to enhance responses based on user query intent.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROMPTS_DIR = path.join(DATA_DIR, 'prompts');

// Cache for loaded prompts
let promptsCache = [];
let lastLoadTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Prompt structure:
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   keywords: string[],
 *   intent: string[],
 *   category: string,
 *   template: string,
 *   variables: string[],
 *   skill: string (optional - associated skill)
 * }
 */

/**
 * Parse a prompt MD file
 */
function parsePromptMd(content, filename) {
  const prompt = {
    id: filename.replace('.md', ''),
    name: '',
    description: '',
    keywords: [],
    intent: [],
    category: 'general',
    template: '',
    variables: [],
    skill: null,
    priority: 0, // Higher priority prompts are matched first
  };

  const lines = content.split('\n');
  let inTemplate = false;
  let templateLines = [];

  for (const line of lines) {
    // Extract name from first heading
    if (line.startsWith('# ') && !prompt.name) {
      prompt.name = line.slice(2).trim();
      continue;
    }

    // Extract key-value pairs
    const kvMatch = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/i);
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase().trim();
      const value = kvMatch[2].trim();

      switch (key) {
        case 'description':
          prompt.description = value;
          break;
        case 'keywords':
          prompt.keywords = value.split(',').map(k => k.trim().toLowerCase());
          break;
        case 'intent':
          prompt.intent = value.split(',').map(i => i.trim().toLowerCase());
          break;
        case 'category':
          prompt.category = value.toLowerCase();
          break;
        case 'skill':
          prompt.skill = value;
          break;
        case 'priority':
          prompt.priority = parseInt(value) || 0;
          break;
        case 'variables':
          prompt.variables = value.split(',').map(v => v.trim());
          break;
      }
      continue;
    }

    // Detect template section
    if (line.match(/^##\s*template/i)) {
      inTemplate = true;
      continue;
    }

    // Collect template lines
    if (inTemplate) {
      // Stop at next section
      if (line.startsWith('## ') && !line.toLowerCase().includes('template')) {
        inTemplate = false;
      } else {
        templateLines.push(line);
      }
    }
  }

  prompt.template = templateLines.join('\n').trim();

  return prompt;
}

/**
 * Load all prompts from the prompts directory
 */
function loadPrompts() {
  const now = Date.now();

  // Return cached if still valid
  if (promptsCache.length > 0 && (now - lastLoadTime) < CACHE_TTL) {
    return promptsCache;
  }

  promptsCache = [];

  // Ensure prompts directory exists
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
    return promptsCache;
  }

  // Load prompts from root prompts folder
  const files = fs.readdirSync(PROMPTS_DIR);

  for (const file of files) {
    if (file.endsWith('.md') && file !== 'prompts.md') {
      try {
        const filePath = path.join(PROMPTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const prompt = parsePromptMd(content, file);
        if (prompt.name && prompt.template) {
          promptsCache.push(prompt);
        }
      } catch (error) {
        console.error(`[PromptsManager] Error loading ${file}:`, error.message);
      }
    }
  }

  // Also check for category subdirectories
  for (const item of files) {
    const itemPath = path.join(PROMPTS_DIR, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const subFiles = fs.readdirSync(itemPath);
      for (const file of subFiles) {
        if (file.endsWith('.md')) {
          try {
            const filePath = path.join(itemPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const prompt = parsePromptMd(content, file);
            prompt.category = item; // Use folder name as category
            if (prompt.name && prompt.template) {
              promptsCache.push(prompt);
            }
          } catch (error) {
            console.error(`[PromptsManager] Error loading ${item}/${file}:`, error.message);
          }
        }
      }
    }
  }

  // Sort by priority (higher first)
  promptsCache.sort((a, b) => b.priority - a.priority);

  lastLoadTime = now;
  console.log(`[PromptsManager] Loaded ${promptsCache.length} prompts`);

  return promptsCache;
}

/**
 * Get current time of day category
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Check if prompt is time-appropriate
 */
function isTimeAppropriate(promptId) {
  const timeOfDay = getTimeOfDay();

  // Morning prompt only valid in morning
  if (promptId === 'morning-checkin' && timeOfDay !== 'morning') {
    return false;
  }

  // Evening prompt only valid in evening/night
  if (promptId === 'evening-review' && !['evening', 'night'].includes(timeOfDay)) {
    return false;
  }

  return true;
}

/**
 * Match a user message to the best prompt
 * Returns the matched prompt or null if no match
 * Uses strict word matching and time-awareness
 */
function matchPrompt(userMessage, options = {}) {
  const prompts = loadPrompts();
  const lowerMessage = userMessage.toLowerCase();
  const words = lowerMessage.split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;

  for (const prompt of prompts) {
    // Skip time-inappropriate prompts
    if (!isTimeAppropriate(prompt.id)) {
      continue;
    }

    let score = 0;

    // Check keyword matches (strict - exact word match)
    for (const keyword of prompt.keywords) {
      // For multi-word keywords, check phrase
      if (keyword.includes(' ')) {
        if (lowerMessage.includes(keyword)) {
          score += 15;
        }
      } else {
        // Single word - exact match only
        if (words.includes(keyword)) {
          score += 10;
        }
      }
    }

    // Check intent matches (higher weight, phrase match)
    for (const intent of prompt.intent) {
      if (lowerMessage.includes(intent)) {
        score += 20;
      }
    }

    // Category filter if provided
    if (options.category && prompt.category !== options.category) {
      continue;
    }

    // Skill filter if provided
    if (options.skill && prompt.skill !== options.skill) {
      continue;
    }

    // Add priority bonus
    score += prompt.priority;

    // Update best match (higher threshold)
    if (score > bestScore && score >= 15) {
      bestScore = score;
      bestMatch = prompt;
    }
  }

  if (bestMatch) {
    console.log(`[PromptsManager] Matched prompt: ${bestMatch.name} (score: ${bestScore})`);
  }

  return bestMatch;
}

/**
 * Get all prompts by category
 */
function getPromptsByCategory(category) {
  const prompts = loadPrompts();
  return prompts.filter(p => p.category === category);
}

/**
 * Get all prompts for a specific skill
 */
function getPromptsBySkill(skillId) {
  const prompts = loadPrompts();
  return prompts.filter(p => p.skill === skillId);
}

/**
 * Fill a prompt template with variables
 */
function fillTemplate(template, variables = {}) {
  let filled = template;

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    filled = filled.replace(pattern, value);
  }

  // Remove any unfilled variables
  filled = filled.replace(/\{\{\s*\w+\s*\}\}/g, '');

  return filled.trim();
}

/**
 * Get a prompt by ID
 */
function getPromptById(promptId) {
  const prompts = loadPrompts();
  return prompts.find(p => p.id === promptId) || null;
}

/**
 * Get all available prompts
 */
function getAllPrompts() {
  return loadPrompts();
}

/**
 * Get prompt categories
 */
function getCategories() {
  const prompts = loadPrompts();
  const categories = new Set(prompts.map(p => p.category));
  return Array.from(categories);
}

/**
 * Invalidate cache to force reload
 */
function invalidateCache() {
  promptsCache = [];
  lastLoadTime = 0;
}

module.exports = {
  loadPrompts,
  matchPrompt,
  getPromptsByCategory,
  getPromptsBySkill,
  fillTemplate,
  getPromptById,
  getAllPrompts,
  getCategories,
  invalidateCache,
};

/**
 * Skills Manager Module
 *
 * Loads, matches, and provides skill content based on user messages.
 * Supports both explicit /command invocation and implicit keyword matching.
 * Integrates with agent-capabilities system for skill filtering.
 */

import fs from 'fs/promises';
import path from 'path';
import { SKILLS_DIR, COMMANDS_DIR, SHARED_PATHS } from '../paths';
import { getAgentCapabilities, canAgentUseSkill } from '../agent-capabilities';

export interface Skill {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  body: string;
  path: string;
  type: 'skill' | 'command';
  format?: string;
}

export interface Agent {
  id: string;
  name: string;
  skills?: string[];
}

interface Frontmatter {
  name?: string;
  description?: string;
  triggers?: string[];
  [key: string]: unknown;
}

// Cache for loaded skills and commands
let skillsCache: Map<string, Skill> | null = null;
let commandsCache: Map<string, Skill> | null = null;
let agentsCache: Agent[] | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter: Frontmatter = {};

  // Simple YAML parsing
  frontmatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value: unknown = line.substring(colonIndex + 1).trim();

      // Handle arrays
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/"/g, '').replace(/'/g, ''));
      }

      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

/**
 * Extract trigger phrases from skill content
 */
function extractTriggers(frontmatter: Frontmatter, body: string): string[] {
  const triggers: string[] = [];

  // From frontmatter triggers array
  if (frontmatter.triggers && Array.isArray(frontmatter.triggers)) {
    triggers.push(...frontmatter.triggers.map(t => t.toLowerCase().trim()));
  }

  // Extract from "Triggers on:" line in description
  if (typeof frontmatter.description === 'string') {
    const triggersMatch = frontmatter.description.match(/triggers?\s*(?:on)?:?\s*([^.]+)/i);
    if (triggersMatch) {
      const triggerPhrases = triggersMatch[1].split(',').map(t => t.trim().toLowerCase());
      triggers.push(...triggerPhrases);
    }
  }

  // Extract from "| trigger phrase |" table rows
  const triggerRowRegex = /\|\s*"([^"]+)"\s*\|/g;
  let match;
  while ((match = triggerRowRegex.exec(body)) !== null) {
    const phrase = match[1].trim().toLowerCase();
    if (phrase && phrase.length > 2 && phrase.length < 40) {
      triggers.push(phrase);
    }
  }

  // Deduplicate and filter empty
  return Array.from(new Set(triggers)).filter(t => t && t.length > 2);
}

/**
 * Parse a SKILL.md file
 */
async function parseSkillFile(filePath: string, folderId: string): Promise<Skill | null> {
  try {
    const content = (await fs.readFile(filePath, 'utf-8')).replace(/\r\n/g, '\n');
    const { frontmatter, body } = parseFrontmatter(content);

    const triggers = extractTriggers(frontmatter, body);

    return {
      id: (frontmatter.name as string) || folderId,
      name: (frontmatter.name as string) || folderId,
      description: (frontmatter.description as string) || '',
      triggers,
      body,
      path: filePath,
      type: 'skill',
    };
  } catch {
    return null;
  }
}

/**
 * Parse a command markdown file
 */
async function parseCommandFile(filePath: string, fileName: string): Promise<Skill | null> {
  try {
    const content = (await fs.readFile(filePath, 'utf-8')).replace(/\r\n/g, '\n');
    const { frontmatter, body } = parseFrontmatter(content);
    const commandId = fileName.replace('.md', '');

    return {
      id: commandId,
      name: commandId,
      description: (frontmatter.description as string) || '',
      triggers: [`/${commandId}`],
      body,
      path: filePath,
      type: 'command',
    };
  } catch {
    return null;
  }
}

/**
 * Load all skills from skills/ directory
 */
async function loadAllSkills(): Promise<Map<string, Skill>> {
  const skills = new Map<string, Skill>();

  try {
    const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });

    // Load folder-based skills
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
        try {
          await fs.access(skillPath);
          const skill = await parseSkillFile(skillPath, entry.name);
          if (skill) {
            skills.set(skill.id, skill);
          }
        } catch {
          // SKILL.md doesn't exist in this folder
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Load file-based skills
        const skillPath = path.join(SKILLS_DIR, entry.name);
        const skillId = entry.name.replace('.md', '');
        if (!skills.has(skillId)) {
          const skill = await parseSkillFile(skillPath, skillId);
          if (skill) {
            skill.format = 'claude-official';
            skills.set(skill.id, skill);
          }
        }
      }
    }
  } catch {
    // Skills directory might not exist
  }

  return skills;
}

/**
 * Load all commands from commands/ directory
 */
async function loadAllCommands(): Promise<Map<string, Skill>> {
  const commands = new Map<string, Skill>();

  try {
    const files = await fs.readdir(COMMANDS_DIR);
    const commandFiles = files.filter(f => f.endsWith('.md'));

    for (const file of commandFiles) {
      const commandPath = path.join(COMMANDS_DIR, file);
      const command = await parseCommandFile(commandPath, file);
      if (command) {
        commands.set(command.id, command);
      }
    }
  } catch {
    // Commands directory might not exist
  }

  return commands;
}

/**
 * Load agents configuration
 */
async function loadAgents(): Promise<Agent[]> {
  try {
    const content = await fs.readFile(SHARED_PATHS.agents, 'utf-8');
    const data = JSON.parse(content);
    return data.agents || data || [];
  } catch {
    return [];
  }
}

/**
 * Initialize or refresh the cache
 */
async function ensureCache(): Promise<void> {
  const now = Date.now();
  if (skillsCache && commandsCache && (now - lastLoadTime) < CACHE_TTL) {
    return;
  }

  skillsCache = await loadAllSkills();
  commandsCache = await loadAllCommands();
  agentsCache = await loadAgents();
  lastLoadTime = now;
}

/**
 * Get skills available for a specific agent
 * Uses the agent-capabilities system to determine which skills are assigned
 */
async function getAgentSkillsFiltered(agentId: string): Promise<Skill[]> {
  await ensureCache();

  // Get agent capabilities
  const capabilities = await getAgentCapabilities(agentId);
  const allSkills = Array.from(skillsCache!.values());

  // If restrictions are disabled, agent has access to all skills
  if (!capabilities.restrictions?.allowOnlyAssigned) {
    return allSkills;
  }

  // If unified agent with no specific restrictions, return all skills
  if (agentId === 'unified' && capabilities.assignedSkills.length === 0) {
    return allSkills;
  }

  // Filter skills based on agent capabilities
  const assignedSkillIds = capabilities.assignedSkills.map(s => s.toLowerCase());

  return allSkills.filter(skill => {
    const skillId = skill.id.toLowerCase();
    const skillName = skill.name.toLowerCase().replace(/\s+/g, '-');
    return assignedSkillIds.includes(skillId) || assignedSkillIds.includes(skillName);
  });
}

/**
 * Score how well a skill matches the user message
 */
function scoreSkillMatch(skill: Skill, message: string): number {
  let score = 0;
  const messageWords = message.split(/\s+/);

  // Check skill name in message
  const skillWords = [skill.id.toLowerCase(), skill.name.toLowerCase()];
  for (const skillWord of skillWords) {
    if (messageWords.includes(skillWord)) {
      score += 5;
    }
  }

  // Check triggers
  for (const trigger of skill.triggers) {
    const triggerLower = trigger.toLowerCase();
    // For multi-word triggers, check phrase
    if (triggerLower.includes(' ')) {
      if (message.includes(triggerLower)) {
        score += 4;
      }
    } else {
      // For single words, require exact word match
      if (messageWords.includes(triggerLower)) {
        score += 3;
      }
    }
  }

  return score;
}

/**
 * Match user message to skill or command
 * @param message - User message
 * @param agentId - Agent ID for filtering (uses agent-capabilities system)
 * @returns Matched skill/command or null
 */
export async function matchSkill(
  message: string,
  agentId: string = 'unified'
): Promise<Skill | null> {
  await ensureCache();

  const lowerMessage = message.toLowerCase().trim();

  // Check for explicit /command
  if (lowerMessage.startsWith('/')) {
    const commandName = lowerMessage.split(/\s+/)[0].substring(1);
    const command = commandsCache!.get(commandName);
    if (command) {
      // Verify agent can use this command/skill
      const canUse = await canAgentUseSkill(agentId, commandName);
      if (canUse) {
        return command;
      }
    }
  }

  // Get available skills for this agent (filtered by capabilities)
  const availableSkills = await getAgentSkillsFiltered(agentId);

  // Score each skill based on trigger matches
  let bestMatch: Skill | null = null;
  let bestScore = 0;

  for (const skill of availableSkills) {
    const score = scoreSkillMatch(skill, lowerMessage);
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestMatch = skill;
    }
  }

  return bestMatch;
}

/**
 * Get full skill content for injection into prompt
 */
export async function getSkillContent(skillId: string): Promise<string | null> {
  await ensureCache();

  const skill = skillsCache!.get(skillId) || commandsCache!.get(skillId);
  if (!skill) return null;

  return skill.body;
}

/**
 * Get all available skills
 */
export async function getAllSkills(): Promise<Skill[]> {
  await ensureCache();
  return Array.from(skillsCache!.values());
}

/**
 * Get all available commands
 */
export async function getAllCommands(): Promise<Skill[]> {
  await ensureCache();
  return Array.from(commandsCache!.values());
}

/**
 * Clear the cache (useful for testing or when skills are updated)
 */
export function clearCache(): void {
  skillsCache = null;
  commandsCache = null;
  agentsCache = null;
  lastLoadTime = 0;
}

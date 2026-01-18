import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { Prompt } from '@/types/prompt'
import { PATHS } from '@/lib/paths'

const getPromptsDir = () => PATHS.prompts

const getPromptsFile = () => path.join(getPromptsDir(), 'prompts.json')

// Parse a prompt MD file (for dynamic prompts with templates)
interface DynamicPrompt {
  id: string
  name: string
  description: string
  keywords: string[]
  intent: string[]
  category: string
  priority: number
  template: string
  skill?: string
  isDynamic: true
}

function parsePromptMd(content: string, filename: string): DynamicPrompt | null {
  const prompt: DynamicPrompt = {
    id: filename.replace('.md', ''),
    name: '',
    description: '',
    keywords: [],
    intent: [],
    category: 'general',
    priority: 0,
    template: '',
    isDynamic: true,
  }

  const lines = content.split('\n')
  let inTemplate = false
  const templateLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('# ') && !prompt.name) {
      prompt.name = line.slice(2).trim()
      continue
    }

    const kvMatch = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/i)
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase().trim()
      const value = kvMatch[2].trim()

      switch (key) {
        case 'description':
          prompt.description = value
          break
        case 'keywords':
          prompt.keywords = value.split(',').map(k => k.trim().toLowerCase())
          break
        case 'intent':
          prompt.intent = value.split(',').map(i => i.trim().toLowerCase())
          break
        case 'category':
          prompt.category = value.toLowerCase()
          break
        case 'skill':
          prompt.skill = value
          break
        case 'priority':
          prompt.priority = parseInt(value) || 0
          break
      }
      continue
    }

    if (line.match(/^##\s*template/i)) {
      inTemplate = true
      continue
    }

    if (inTemplate) {
      if (line.startsWith('## ') && !line.toLowerCase().includes('template')) {
        inTemplate = false
      } else {
        templateLines.push(line)
      }
    }
  }

  prompt.template = templateLines.join('\n').trim()

  if (!prompt.name) return null
  return prompt
}

// GET - List all prompts (JSON + MD dynamic prompts)
export async function GET(request: NextRequest) {
  try {
    const promptsDir = getPromptsDir()
    const promptsFile = getPromptsFile()

    // Ensure directory exists
    await fs.mkdir(promptsDir, { recursive: true })

    // Load JSON prompts
    let jsonPrompts: Prompt[] = []
    try {
      const data = await fs.readFile(promptsFile, 'utf-8')
      jsonPrompts = JSON.parse(data)
    } catch {
      // File doesn't exist, no JSON prompts
    }

    // Load MD dynamic prompts
    const dynamicPrompts: DynamicPrompt[] = []
    const files = await fs.readdir(promptsDir)

    for (const file of files) {
      if (file.endsWith('.md') && file !== 'prompts.md') {
        try {
          const filePath = path.join(promptsDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const prompt = parsePromptMd(content, file)
          if (prompt) {
            dynamicPrompts.push(prompt)
          }
        } catch (error) {
          console.error(`Error loading ${file}:`, error)
        }
      }
    }

    // Also check subdirectories for categorized prompts
    for (const item of files) {
      const itemPath = path.join(promptsDir, item)
      try {
        const stat = await fs.stat(itemPath)
        if (stat.isDirectory()) {
          const subFiles = await fs.readdir(itemPath)
          for (const file of subFiles) {
            if (file.endsWith('.md')) {
              const filePath = path.join(itemPath, file)
              const content = await fs.readFile(filePath, 'utf-8')
              const prompt = parsePromptMd(content, file)
              if (prompt) {
                prompt.category = item
                dynamicPrompts.push(prompt)
              }
            }
          }
        }
      } catch {}
    }

    // Sort dynamic prompts by priority
    dynamicPrompts.sort((a, b) => b.priority - a.priority)

    // Get all categories
    const categories = Array.from(new Set([
      ...jsonPrompts.map(p => p.category),
      ...dynamicPrompts.map(p => p.category)
    ]))

    return NextResponse.json({
      prompts: jsonPrompts,
      dynamicPrompts,
      categories,
      total: jsonPrompts.length + dynamicPrompts.length,
    })
  } catch (error) {
    console.error('Failed to load prompts:', error)
    return NextResponse.json(
      { error: 'Failed to load prompts' },
      { status: 500 }
    )
  }
}

// POST - Create new prompt
export async function POST(request: NextRequest) {
  try {
    const promptData = await request.json()
    const promptsFile = getPromptsFile()

    // Ensure directory exists
    await fs.mkdir(getPromptsDir(), { recursive: true })

    // Load existing prompts
    let prompts: Prompt[] = []
    try {
      const data = await fs.readFile(promptsFile, 'utf-8')
      prompts = JSON.parse(data)
    } catch {
      // File doesn't exist, will create it
    }

    // Create new prompt
    const newPrompt: Prompt = {
      id: `prompt-${Date.now()}`,
      name: promptData.name,
      description: promptData.description,
      content: promptData.content,
      category: promptData.category || 'custom',
      tags: promptData.tags || [],
      isGlobal: promptData.isGlobal ?? false,
      createdBy: promptData.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    prompts.push(newPrompt)
    await fs.writeFile(promptsFile, JSON.stringify(prompts, null, 2))

    return NextResponse.json({ prompt: newPrompt })
  } catch (error) {
    console.error('Failed to create prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
}

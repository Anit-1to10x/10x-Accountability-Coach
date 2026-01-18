import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SKILLS_DIR } from '@/lib/paths'

interface ImportSkillRequest {
  source: 'url' | 'content' | 'official'
  url?: string
  content?: string
  skillId?: string // For official skills from catalog
  name?: string // Optional override name
}

// Parse frontmatter from markdown content
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content }
  }

  const [, frontmatterStr, body] = frontmatterMatch
  const frontmatter: Record<string, any> = {}

  frontmatterStr.split('\n').forEach((line) => {
    const match = line.match(/^(\w[\w-]*):\s*(.+)$/)
    if (match) {
      const [, key, value] = match
      const cleanValue = value.replace(/^["']|["']$/g, '').trim()
      frontmatter[key] = cleanValue
    }
  })

  return { frontmatter, body }
}

// Extract skill metadata from content
function extractSkillMetadata(content: string, overrideName?: string) {
  const { frontmatter, body } = parseFrontmatter(content)

  // Get name from frontmatter, header, or override
  let name = overrideName || frontmatter.name
  if (!name) {
    const nameMatch = body.match(/^#\s+(.+)$/m)
    name = nameMatch ? nameMatch[1].trim() : 'Imported Skill'
  }

  // Get description
  let description = frontmatter.description
  if (!description) {
    const descMatch = body.match(/^#\s+.+\n\n([\s\S]+?)(?:\n\n|\n#|$)/)
    description = descMatch ? descMatch[1].trim().slice(0, 200) : 'Imported skill'
  }

  // Generate ID from name
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return {
    id,
    name,
    description,
    category: frontmatter.category || 'custom',
    triggers: frontmatter.triggers ? frontmatter.triggers.split(',').map((t: string) => t.trim()) : [],
    author: frontmatter.author || 'Imported',
    version: frontmatter.version || '1.0.0',
  }
}

// POST: Import a skill from URL, content, or official catalog
export async function POST(request: NextRequest) {
  try {
    const body: ImportSkillRequest = await request.json()
    const { source, url, content: rawContent, skillId, name: overrideName } = body

    let skillContent: string

    if (source === 'url' && url) {
      // Fetch skill from URL
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'OpenAnalyst-SkillImporter/1.0',
            'Accept': 'text/plain, text/markdown, */*'
          }
        })

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch from URL: ${response.status} ${response.statusText}` },
            { status: 400 }
          )
        }

        skillContent = await response.text()
      } catch (fetchError: any) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${fetchError.message}` },
          { status: 400 }
        )
      }
    } else if (source === 'content' && rawContent) {
      // Use provided content directly
      skillContent = rawContent
    } else if (source === 'official' && skillId) {
      // Fetch from official Claude skills directory
      // This could be extended to fetch from a known GitHub repo or CDN
      const officialSkillsUrl = `https://raw.githubusercontent.com/anthropics/claude-code/main/skills/${skillId}.md`

      try {
        const response = await fetch(officialSkillsUrl)
        if (!response.ok) {
          return NextResponse.json(
            { error: `Official skill not found: ${skillId}` },
            { status: 404 }
          )
        }
        skillContent = await response.text()
      } catch {
        return NextResponse.json(
          { error: 'Failed to fetch official skill' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid import request. Provide url, content, or skillId' },
        { status: 400 }
      )
    }

    // Extract metadata from content
    const metadata = extractSkillMetadata(skillContent, overrideName)

    // Check if skill already exists
    const skillPath = path.join(SKILLS_DIR, metadata.id)
    try {
      await fs.access(skillPath)
      // Skill exists - generate unique ID
      metadata.id = `${metadata.id}-${Date.now().toString(36)}`
    } catch {
      // Skill doesn't exist, proceed
    }

    // Create skill directory
    const finalSkillPath = path.join(SKILLS_DIR, metadata.id)
    await fs.mkdir(finalSkillPath, { recursive: true })

    // Create SKILL.md with frontmatter
    const frontmatter = `---
name: ${metadata.name}
description: ${metadata.description}
category: ${metadata.category}
author: ${metadata.author}
version: ${metadata.version}
imported: true
importedAt: ${new Date().toISOString()}
---

`
    // Check if content already has frontmatter
    const hasExistingFrontmatter = skillContent.trim().startsWith('---')
    const finalContent = hasExistingFrontmatter ? skillContent : frontmatter + skillContent

    await fs.writeFile(path.join(finalSkillPath, 'SKILL.md'), finalContent)

    // Create .skill-meta.json
    const metaJson = {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      category: metadata.category,
      triggers: metadata.triggers,
      version: metadata.version,
      author: metadata.author,
      importedAt: new Date().toISOString(),
      source: source === 'url' ? url : source === 'official' ? `official:${skillId}` : 'pasted',
      isImported: true,
    }

    await fs.writeFile(
      path.join(finalSkillPath, '.skill-meta.json'),
      JSON.stringify(metaJson, null, 2)
    )

    return NextResponse.json({
      success: true,
      skill: {
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        path: finalSkillPath,
      }
    })
  } catch (error: any) {
    console.error('Failed to import skill:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET: Fetch official skills catalog
export async function GET() {
  // This returns a catalog of popular/official skills that can be imported
  // In production, this could fetch from a remote catalog API
  const officialCatalog = [
    {
      id: 'commit',
      name: 'Git Commit',
      description: 'Smart git commit message generator with conventional commits support',
      category: 'productivity',
      author: 'Claude',
      source: 'official',
    },
    {
      id: 'pr-review',
      name: 'PR Review',
      description: 'Automated pull request code review with suggestions',
      category: 'productivity',
      author: 'Claude',
      source: 'official',
    },
    {
      id: 'test-writer',
      name: 'Test Writer',
      description: 'Automatically generate unit tests for your code',
      category: 'productivity',
      author: 'Claude',
      source: 'official',
    },
    {
      id: 'docs-generator',
      name: 'Documentation Generator',
      description: 'Generate comprehensive documentation for your codebase',
      category: 'productivity',
      author: 'Claude',
      source: 'official',
    },
    {
      id: 'refactor',
      name: 'Code Refactor',
      description: 'Intelligent code refactoring with best practices',
      category: 'productivity',
      author: 'Claude',
      source: 'official',
    },
    {
      id: 'explain-code',
      name: 'Explain Code',
      description: 'Get detailed explanations of complex code',
      category: 'learning',
      author: 'Claude',
      source: 'official',
    },
  ]

  return NextResponse.json({
    catalog: officialCatalog,
    total: officialCatalog.length,
  })
}

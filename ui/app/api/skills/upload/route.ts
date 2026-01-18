import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SKILLS_DIR } from '@/lib/paths'

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
    name = nameMatch ? nameMatch[1].trim() : 'Uploaded Skill'
  }

  // Get description
  let description = frontmatter.description
  if (!description) {
    const descMatch = body.match(/^#\s+.+\n\n([\s\S]+?)(?:\n\n|\n#|$)/)
    description = descMatch ? descMatch[1].trim().slice(0, 200) : 'Uploaded skill'
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
    author: frontmatter.author || 'Uploaded',
    version: frontmatter.version || '1.0.0',
  }
}

// Save a single skill from content
async function saveSkill(content: string, originalName?: string): Promise<{ success: boolean; skill?: any; error?: string }> {
  try {
    const metadata = extractSkillMetadata(content, originalName)

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

    // Write SKILL.md
    await fs.writeFile(path.join(finalSkillPath, 'SKILL.md'), content)

    // Create .skill-meta.json
    const metaJson = {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      category: metadata.category,
      triggers: metadata.triggers,
      version: metadata.version,
      author: metadata.author,
      uploadedAt: new Date().toISOString(),
      isUploaded: true,
    }

    await fs.writeFile(
      path.join(finalSkillPath, '.skill-meta.json'),
      JSON.stringify(metaJson, null, 2)
    )

    return {
      success: true,
      skill: {
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        path: finalSkillPath,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// POST: Upload skill file(s)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const zipFile = formData.get('zip') as File | null

    const results: { success: boolean; skill?: any; error?: string; filename?: string }[] = []

    // Handle ZIP file (extract and import all SKILL.md files)
    if (zipFile) {
      // For ZIP handling, we need the JSZip library
      // Since it may not be available, we'll handle this differently
      // by reading the ZIP as a buffer and using node's built-in capabilities
      // For simplicity, let's return an instruction to use the manual method

      // Note: In a production app, you'd want to use a library like 'jszip' or 'unzipper'
      // For now, we'll return an error suggesting the alternative
      return NextResponse.json({
        success: false,
        error: 'ZIP upload requires extracting to the skills/ folder manually. Please extract your ZIP and restart the app, or upload individual SKILL.md files.',
        tip: 'To bulk import skills, extract your ZIP to the "skills/" folder in your project directory.'
      }, { status: 400 })
    }

    // Handle individual .md files
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    for (const file of files) {
      if (!file.name.endsWith('.md')) {
        results.push({
          success: false,
          error: 'Only .md files are supported',
          filename: file.name
        })
        continue
      }

      const content = await file.text()
      const result = await saveSkill(content, file.name.replace('.md', '').replace('SKILL', '').trim() || undefined)
      results.push({ ...result, filename: file.name })
    }

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    return NextResponse.json({
      success: failed.length === 0,
      imported: successful.length,
      failed: failed.length,
      results,
      skills: successful.map(r => r.skill)
    })
  } catch (error: any) {
    console.error('Failed to upload skills:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

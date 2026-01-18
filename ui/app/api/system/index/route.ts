import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR } from '@/lib/paths'

const INDEX_PATH = path.join(DATA_DIR, 'index.md')

interface IndexSection {
  systemOverview?: Partial<{
    appName: string
    userName: string
    created: string
    totalChallenges: number
    activeStreaks: number
  }>
  features?: Array<{
    feature: string
    status: string
    location: string
    notes: string
  }>
  customizations?: Array<{
    customization: string
    value: string
    modified: string
  }>
  challenges?: Array<{
    id: string
    name: string
    type: string
    progress: number
    streak: number
    punishment: string
  }>
  agents?: Array<{
    id: string
    name: string
    persona: string
    assignedChallenges: string[]
  }>
  files?: Array<{
    filePath: string
    purpose: string
    created: string
    modified: string
  }>
  modifications?: Array<{
    filePath: string
    original: string
    changes: string
    date: string
  }>
  pendingActions?: string[]
  punishments?: Array<{
    challenge: string
    trigger: string
    punishment: string
    lastTriggered: string
    status: string
  }>
  sessionContext?: Partial<{
    lastInteraction: string
    currentFocus: string
    pendingQuestions: string
  }>
}

async function ensureIndexExists() {
  try {
    await fs.access(INDEX_PATH)
  } catch {
    // Create default index.md
    const defaultContent = generateIndexTemplate({
      systemOverview: {
        appName: 'OpenAnalyst Accountability Coach',
        userName: 'User',
        created: new Date().toISOString(),
        totalChallenges: 0,
        activeStreaks: 0,
      },
    })
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(INDEX_PATH, defaultContent, 'utf-8')
  }
}

function generateIndexTemplate(data: IndexSection): string {
  const timestamp = new Date().toISOString()
  const overview = data.systemOverview || {}
  const features = data.features || []
  const customizations = data.customizations || []
  const challenges = data.challenges || []
  const agents = data.agents || []
  const files = data.files || []
  const modifications = data.modifications || []
  const pendingActions = data.pendingActions || []
  const punishments = data.punishments || []
  const session = data.sessionContext || {}

  return `# OpenAnalyst Architecture Index
> Last Updated: ${timestamp}
> Version: 2.0

## System Overview
- **App Name:** ${overview.appName || 'OpenAnalyst Accountability Coach'}
- **User:** ${overview.userName || 'User'}
- **Created:** ${overview.created || timestamp}
- **Total Challenges:** ${overview.totalChallenges || 0}
- **Active Streaks:** ${overview.activeStreaks || 0}

## Features Status

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
${features.length > 0 ? features.map(f => `| ${f.feature} | ${f.status} | ${f.location} | ${f.notes} |`).join('\n') : '| User Profile | ✅ Active | data/profiles/{userId}/ | Name, timezone, preferences |'}

## User Customizations

| Customization | Value | Modified |
|---------------|-------|----------|
${customizations.length > 0 ? customizations.map(c => `| ${c.customization} | ${c.value} | ${c.modified} |`).join('\n') : '| Persona | Not Set | - |'}

## Active Challenges

| ID | Name | Type | Progress | Streak | Punishment |
|----|------|------|----------|--------|------------|
${challenges.length > 0 ? challenges.map(c => `| ${c.id} | ${c.name} | ${c.type} | ${c.progress}% | ${c.streak} days | ${c.punishment} |`).join('\n') : '| - | No challenges yet | - | - | - | - |'}

## Agents

| ID | Name | Persona | Assigned Challenges |
|----|------|---------|---------------------|
${agents.length > 0 ? agents.map(a => `| ${a.id} | ${a.name} | ${a.persona} | ${a.assignedChallenges.join(', ')} |`).join('\n') : '| accountability-coach | Accountability Coach | Not Set | [] |'}

## File Registry

### Created Files

| File Path | Purpose | Created | Modified |
|-----------|---------|---------|----------|
${files.length > 0 ? files.map(f => `| ${f.filePath} | ${f.purpose} | ${f.created} | ${f.modified} |`).join('\n') : '| - | No files tracked yet | - | - |'}

### Modified Files

| File Path | Original | Changes | Date |
|-----------|----------|---------|------|
${modifications.length > 0 ? modifications.map(m => `| ${m.filePath} | ${m.original} | ${m.changes} | ${m.date} |`).join('\n') : '| - | - | - | - |'}

## Pending Actions

${pendingActions.length > 0 ? pendingActions.map(a => `- [ ] ${a}`).join('\n') : '- [ ] Complete first-time onboarding'}

## Punishments Registry

| Challenge | Trigger | Punishment | Last Triggered | Status |
|-----------|---------|------------|----------------|--------|
${punishments.length > 0 ? punishments.map(p => `| ${p.challenge} | ${p.trigger} | ${p.punishment} | ${p.lastTriggered} | ${p.status} |`).join('\n') : '| - | - | - | - | - |'}

## Session Context

- **Last Interaction:** ${session.lastInteraction || 'Never'}
- **Current Focus:** ${session.currentFocus || 'Initial setup'}
- **Pending Questions:** ${session.pendingQuestions || 'None'}
`
}

async function parseIndexContent(content: string): Promise<IndexSection> {
  const data: IndexSection = {
    systemOverview: {},
    features: [],
    customizations: [],
    challenges: [],
    agents: [],
    files: [],
    modifications: [],
    pendingActions: [],
    punishments: [],
    sessionContext: {},
  }

  // Parse System Overview
  const userMatch = content.match(/\*\*User:\*\*\s*(.+)/)
  if (userMatch) data.systemOverview!.userName = userMatch[1].trim()

  const createdMatch = content.match(/\*\*Created:\*\*\s*(.+)/)
  if (createdMatch) data.systemOverview!.created = createdMatch[1].trim()

  const challengesMatch = content.match(/\*\*Total Challenges:\*\*\s*(\d+)/)
  if (challengesMatch) data.systemOverview!.totalChallenges = parseInt(challengesMatch[1])

  const streaksMatch = content.match(/\*\*Active Streaks:\*\*\s*(\d+)/)
  if (streaksMatch) data.systemOverview!.activeStreaks = parseInt(streaksMatch[1])

  // Parse Pending Actions
  const pendingSection = content.match(/## Pending Actions\s*\n([\s\S]*?)(?=\n##|$)/)
  if (pendingSection) {
    const actions = pendingSection[1].match(/- \[ \] (.+)/g)
    if (actions) {
      data.pendingActions = actions.map(a => a.replace('- [ ] ', '').trim())
    }
  }

  // Parse Session Context
  const lastInteractionMatch = content.match(/\*\*Last Interaction:\*\*\s*(.+)/)
  if (lastInteractionMatch) data.sessionContext!.lastInteraction = lastInteractionMatch[1].trim()

  const currentFocusMatch = content.match(/\*\*Current Focus:\*\*\s*(.+)/)
  if (currentFocusMatch) data.sessionContext!.currentFocus = currentFocusMatch[1].trim()

  return data
}

// GET: Return current index.md content
export async function GET(request: NextRequest) {
  try {
    await ensureIndexExists()
    const content = await fs.readFile(INDEX_PATH, 'utf-8')
    const parsed = await parseIndexContent(content)

    return NextResponse.json({
      success: true,
      content,
      parsed,
    })
  } catch (error: any) {
    console.error('Failed to read index.md:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update specific sections of index.md
export async function PUT(request: NextRequest) {
  try {
    await ensureIndexExists()
    const body = await request.json()
    const { section, data } = body

    // Read current content
    const currentContent = await fs.readFile(INDEX_PATH, 'utf-8')
    const currentData = await parseIndexContent(currentContent)

    // Merge new data
    const updatedData: IndexSection = {
      ...currentData,
      [section]: data,
    }

    // Regenerate index
    const newContent = generateIndexTemplate(updatedData)
    await fs.writeFile(INDEX_PATH, newContent, 'utf-8')

    return NextResponse.json({
      success: true,
      message: `Updated section: ${section}`,
    })
  } catch (error: any) {
    console.error('Failed to update index.md:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Log new actions/modifications
export async function POST(request: NextRequest) {
  try {
    await ensureIndexExists()
    const body = await request.json()
    const { action, data } = body

    const currentContent = await fs.readFile(INDEX_PATH, 'utf-8')
    const currentData = await parseIndexContent(currentContent)

    // Handle different action types
    switch (action) {
      case 'challenge_created':
        currentData.challenges = currentData.challenges || []
        currentData.challenges.push(data)
        if (currentData.systemOverview) {
          currentData.systemOverview.totalChallenges = (currentData.systemOverview.totalChallenges || 0) + 1
          currentData.systemOverview.activeStreaks = (currentData.systemOverview.activeStreaks || 0) + 1
        }
        break

      case 'file_created':
        currentData.files = currentData.files || []
        currentData.files.push(data)
        break

      case 'file_modified':
        currentData.modifications = currentData.modifications || []
        currentData.modifications.push(data)
        break

      case 'punishment_triggered':
        currentData.punishments = currentData.punishments || []
        currentData.punishments.push(data)
        break

      case 'session_update':
        currentData.sessionContext = {
          ...currentData.sessionContext,
          ...data,
          lastInteraction: new Date().toISOString(),
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Regenerate index
    const newContent = generateIndexTemplate(currentData)
    await fs.writeFile(INDEX_PATH, newContent, 'utf-8')

    return NextResponse.json({
      success: true,
      message: `Logged action: ${action}`,
    })
  } catch (error: any) {
    console.error('Failed to log action to index.md:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

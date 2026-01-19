import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { DATA_DIR, PATHS } from '@/lib/paths'

// Helper to get agents array from data (handles both formats)
function getAgentsArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data.agents && Array.isArray(data.agents)) return data.agents
  return []
}

export async function GET() {
  try {
    const agentsJsonFile = PATHS.agents

    // Read from agents.json (primary source of truth)
    try {
      const data = await fs.readFile(agentsJsonFile, 'utf-8')
      const agentsData = JSON.parse(data)
      const agents = getAgentsArray(agentsData)
      // Return in consistent format with agents array
      return NextResponse.json({
        agents,
        globalSkills: agentsData.globalSkills || [],
        lastUpdated: agentsData.lastUpdated || new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to read agents.json:', error)
      // Return default agent if file doesn't exist
      return NextResponse.json({
        agents: [
          {
            id: 'accountability-coach',
            name: 'Accountability Coach',
            description: 'Your personal accountability partner who helps you stay on track with your goals',
            avatar: 'coach',
            isDefault: true,
            skills: ['streak', 'daily-checkin', 'smart-scheduler'],
            capabilities: ['challenge-creation', 'daily-checkin', 'progress-tracking', 'motivation', 'planning'],
            personality: { tone: 'encouraging', style: 'supportive but honest' }
          }
        ],
        globalSkills: [],
        lastUpdated: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Failed to load agents:', error)
    return NextResponse.json({ agents: [], globalSkills: [] }, { status: 500 })
  }
}

// Helper to generate enhanced agent description and capabilities based on user input
function enhanceAgentDescription(name: string, userDescription: string): {
  description: string
  capabilities: string[]
  personality: { tone: string; style: string }
  customInstructions: string
} {
  // Analyze the name and description to determine agent focus
  const nameLower = name.toLowerCase()
  const descLower = (userDescription || '').toLowerCase()

  // Determine agent type based on keywords
  let agentType = 'general'
  let capabilities: string[] = []
  let tone = 'encouraging'
  let style = 'supportive and professional'

  if (nameLower.includes('fitness') || nameLower.includes('health') || descLower.includes('workout') || descLower.includes('exercise')) {
    agentType = 'fitness'
    capabilities = ['workout-planning', 'nutrition-guidance', 'progress-tracking', 'motivation', 'habit-building']
    tone = 'motivating'
    style = 'energetic and supportive like a personal trainer'
  } else if (nameLower.includes('finance') || nameLower.includes('money') || descLower.includes('budget') || descLower.includes('invest')) {
    agentType = 'finance'
    capabilities = ['budget-tracking', 'savings-goals', 'financial-planning', 'expense-analysis', 'investment-basics']
    tone = 'professional'
    style = 'clear, analytical, and trustworthy'
  } else if (nameLower.includes('study') || nameLower.includes('learn') || descLower.includes('education') || descLower.includes('course')) {
    agentType = 'learning'
    capabilities = ['study-planning', 'progress-tracking', 'flashcard-creation', 'quiz-generation', 'time-management']
    tone = 'encouraging'
    style = 'patient and educational like a supportive tutor'
  } else if (nameLower.includes('career') || nameLower.includes('work') || descLower.includes('job') || descLower.includes('professional')) {
    agentType = 'career'
    capabilities = ['goal-setting', 'skill-development', 'networking-advice', 'interview-prep', 'career-planning']
    tone = 'professional'
    style = 'strategic and supportive like a career mentor'
  } else if (nameLower.includes('creative') || nameLower.includes('art') || descLower.includes('writing') || descLower.includes('design')) {
    agentType = 'creative'
    capabilities = ['creative-prompts', 'project-tracking', 'feedback-sessions', 'inspiration-boost', 'portfolio-building']
    tone = 'inspiring'
    style = 'creative and enthusiastic'
  } else {
    // Default general coach capabilities
    capabilities = ['goal-tracking', 'daily-checkin', 'motivation', 'progress-analysis', 'habit-formation']
  }

  // Generate enhanced description
  const enhancedDescription = userDescription
    ? `${userDescription}. Specialized in ${capabilities.slice(0, 3).join(', ')} to help you achieve your goals. Works seamlessly with the 10X Accountability Coach to provide focused guidance and support.`
    : `Your dedicated ${name} assistant, specialized in ${capabilities.slice(0, 3).join(', ')}. Provides personalized guidance and tracks your progress as part of the 10X Accountability ecosystem.`

  // Generate custom instructions
  const customInstructions = `You are ${name}, a specialized AI assistant within the 10X Accountability Coach platform.

Your primary role is to help users with ${agentType}-related goals and challenges.

Key responsibilities:
${capabilities.map(c => `- ${c.replace(/-/g, ' ')}`).join('\n')}

Communication style:
- Be ${tone} and ${style.split(' and ')[0]}
- Provide actionable advice and specific recommendations
- Track progress and celebrate achievements
- Gently hold users accountable to their commitments
- Integrate with other agents when cross-domain support is needed

Always remember that you are part of the user's accountability team, working together to help them achieve their goals.`

  return {
    description: enhancedDescription,
    capabilities,
    personality: { tone, style },
    customInstructions
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgent = await request.json()
    const agentsFile = PATHS.agents

    // Validate required fields
    if (!newAgent.id || !newAgent.name) {
      return NextResponse.json(
        { error: 'Agent ID and name are required' },
        { status: 400 }
      )
    }

    // Enhance agent data based on user input
    const enhanced = enhanceAgentDescription(newAgent.name, newAgent.description || '')

    // Merge enhanced data with user-provided data (user data takes precedence where provided)
    const enhancedAgent = {
      ...newAgent,
      description: newAgent.description || enhanced.description,
      capabilities: newAgent.capabilities?.length > 0 ? newAgent.capabilities : enhanced.capabilities,
      personality: newAgent.personality || enhanced.personality,
      customInstructions: newAgent.customInstructions || enhanced.customInstructions,
      // Ensure required fields for UI display
      icon: newAgent.icon || '🤖',
      color: newAgent.color || 'blue',
      quickActions: newAgent.quickActions || [],
      sections: newAgent.sections || [],
    }

    // Ensure base directory exists
    await fs.mkdir(DATA_DIR, { recursive: true })

    // Create agent-specific folder with complete workspace structure
    const agentDir = path.join(DATA_DIR, 'agents', newAgent.id)
    await fs.mkdir(agentDir, { recursive: true })

    // Create workspace subdirectories
    const workspaceDirs = [
      'files',           // General files uploaded by user
      'images',          // Generated or uploaded images
      'videos',          // Generated or uploaded videos
      'summaries',       // AI-generated summaries
      'notes',           // Meeting notes, personal notes
      'exports',         // Exported content
      'chats',           // Chat history for this agent
      'generated',       // All AI-generated content
    ]

    for (const dir of workspaceDirs) {
      await fs.mkdir(path.join(agentDir, dir), { recursive: true })
    }

    // Create README.md in the agent folder
    const readmeMd = `# ${newAgent.name} Workspace

This folder contains all files and content related to the **${newAgent.name}** agent.

## Folder Structure

- \`files/\` - General files uploaded by you
- \`images/\` - Generated or uploaded images
- \`videos/\` - Generated or uploaded videos
- \`summaries/\` - AI-generated summaries and insights
- \`notes/\` - Meeting notes and personal notes
- \`exports/\` - Exported content (PDFs, reports)
- \`chats/\` - Chat history with this agent
- \`generated/\` - All AI-generated content

## Agent Details

- **ID:** ${newAgent.id}
- **Created:** ${new Date().toISOString().split('T')[0]}

---
*This workspace is managed by 10X Accountability Coach*
`
    await fs.writeFile(path.join(agentDir, 'README.md'), readmeMd)

    // Create agent metadata file with enhanced data
    const agentMetadata = {
      id: enhancedAgent.id,
      name: enhancedAgent.name,
      icon: enhancedAgent.icon,
      color: enhancedAgent.color,
      avatar: enhancedAgent.avatar || 'default',
      description: enhancedAgent.description,
      skills: enhancedAgent.skills || [],
      capabilities: enhancedAgent.capabilities,
      personality: enhancedAgent.personality,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await fs.writeFile(
      path.join(agentDir, 'agent.json'),
      JSON.stringify(agentMetadata, null, 2)
    )

    // Create agent.md instruction file with enhanced content
    const skillsList = enhancedAgent.skills && enhancedAgent.skills.length > 0
      ? enhancedAgent.skills.map((s: string) => `- ${s}`).join('\n')
      : '- No skills assigned yet'

    const capsList = enhancedAgent.capabilities && enhancedAgent.capabilities.length > 0
      ? enhancedAgent.capabilities.map((c: string) => `- ${c.replace(/-/g, ' ')}`).join('\n')
      : '- No specific capabilities defined'

    const agentMd = `# ${enhancedAgent.name}

**ID:** ${enhancedAgent.id}
**Icon:** ${enhancedAgent.icon}
**Color:** ${enhancedAgent.color}

## Description
${enhancedAgent.description}

## Personality
- **Tone:** ${enhancedAgent.personality?.tone || 'encouraging'}
- **Style:** ${enhancedAgent.personality?.style || 'supportive and professional'}

## Assigned Skills
${skillsList}

## Capabilities
${capsList}

## Custom Instructions
${enhancedAgent.customInstructions}

## Integration with 10X Accountability Coach
This agent is designed to work seamlessly with the 10X Accountability Coach platform. It can:
- Share progress data with other connected agents
- Contribute to unified goal tracking
- Provide specialized support within its domain
- Integrate with the main accountability dashboard

---
Created: ${new Date().toISOString().split('T')[0]}
Last Modified: ${new Date().toISOString().split('T')[0]}
Managed by: 10X Accountability Coach Webapp
`
    // Save as {agent-id}.md (e.g., fitness-coach.md, general-coach.md)
    await fs.writeFile(path.join(agentDir, `${enhancedAgent.id}.md`), agentMd)

    // Load existing agents from agents.json
    let agents = []
    try {
      const data = await fs.readFile(agentsFile, 'utf-8')
      const agentsData = JSON.parse(data)
      agents = getAgentsArray(agentsData)
    } catch {
      // File doesn't exist, will create it
    }

    // Check if agent ID already exists
    if (agents.some((a: any) => a.id === newAgent.id)) {
      return NextResponse.json(
        { error: 'Agent with this ID already exists' },
        { status: 409 }
      )
    }

    // Add new enhanced agent
    agents.push(enhancedAgent)

    // Save to agents.json (preserve structure)
    const outputData = {
      agents: agents,
      globalSkills: [],
      lastUpdated: new Date().toISOString()
    }
    await fs.writeFile(agentsFile, JSON.stringify(outputData, null, 2))

    return NextResponse.json({ success: true, agent: enhancedAgent })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}

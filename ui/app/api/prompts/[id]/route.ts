import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { Prompt } from '@/types/prompt'
import { PATHS } from '@/lib/paths'

const getPromptsFile = () => path.join(PATHS.prompts, 'prompts.json')

// GET - Get single prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptsFile = getPromptsFile()
    const data = await fs.readFile(promptsFile, 'utf-8')
    const prompts: Prompt[] = JSON.parse(data)

    const prompt = prompts.find((p) => p.id === params.id)

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Failed to load prompt:', error)
    return NextResponse.json(
      { error: 'Failed to load prompt' },
      { status: 500 }
    )
  }
}

// PUT - Update prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const promptsFile = getPromptsFile()
    const data = await fs.readFile(promptsFile, 'utf-8')
    let prompts: Prompt[] = JSON.parse(data)

    const index = prompts.findIndex((p) => p.id === params.id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Update prompt
    prompts[index] = {
      ...prompts[index],
      ...updates,
      id: params.id,  // Prevent ID changes
      updatedAt: new Date().toISOString(),
    }

    await fs.writeFile(promptsFile, JSON.stringify(prompts, null, 2))

    return NextResponse.json({ prompt: prompts[index] })
  } catch (error) {
    console.error('Failed to update prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    )
  }
}

// DELETE - Delete prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptsFile = getPromptsFile()
    const data = await fs.readFile(promptsFile, 'utf-8')
    let prompts: Prompt[] = JSON.parse(data)

    prompts = prompts.filter((p) => p.id !== params.id)

    await fs.writeFile(promptsFile, JSON.stringify(prompts, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    )
  }
}

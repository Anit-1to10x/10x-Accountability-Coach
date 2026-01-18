import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { PATHS } from '@/lib/paths'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const punishmentPath = path.join(
      PATHS.challenges,
      challengeId,
      'punishment.json'
    )

    const content = await fs.readFile(punishmentPath, 'utf-8')
    const data = JSON.parse(content)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error reading punishment config:', error)
    return NextResponse.json(
      {
        punishments: [],
        active: false,
        grace_period_hours: 24,
        triggered: [],
        history: [],
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = params.id
    const data = await request.json()

    const punishmentPath = path.join(
      PATHS.challenges,
      challengeId,
      'punishment.json'
    )

    await fs.writeFile(punishmentPath, JSON.stringify(data, null, 2), 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating punishment config:', error)
    return NextResponse.json(
      { error: 'Failed to update punishment config' },
      { status: 500 }
    )
  }
}

/**
 * Sandbox Code Execution API
 *
 * POST /api/sandbox/execute - Execute code in isolated sandbox
 *
 * This endpoint allows the LLM to execute code server-side,
 * reducing context window usage by returning only results.
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeCode, formatResultForLLM, ExecutionRequest } from '@/lib/sandbox/executor'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max for code execution

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    if (!body.code || !body.language) {
      return NextResponse.json(
        { error: 'code and language are required' },
        { status: 400 }
      )
    }

    const validLanguages = ['javascript', 'typescript', 'python', 'shell', 'bash']
    if (!validLanguages.includes(body.language)) {
      return NextResponse.json(
        { error: `Invalid language. Supported: ${validLanguages.join(', ')}` },
        { status: 400 }
      )
    }

    // Execute code
    const executionRequest: ExecutionRequest = {
      language: body.language,
      code: body.code,
      timeout: body.timeout,
      env: body.env,
      workingDir: body.workingDir,
    }

    const result = await executeCode(executionRequest)

    // Return result
    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      language: result.language,
      truncated: result.truncated,
      // Compact version for LLM context
      llmFormat: formatResultForLLM(result),
    })

  } catch (error: any) {
    console.error('[sandbox/execute] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET: Get sandbox capabilities and status
 */
export async function GET() {
  return NextResponse.json({
    enabled: true,
    supportedLanguages: ['javascript', 'typescript', 'python', 'shell', 'bash'],
    limits: {
      maxOutputSize: 50000,
      defaultTimeout: 30000,
      maxTimeout: 120000,
    },
    features: [
      'Isolated execution environment',
      'Automatic output truncation',
      'Dangerous command blocking',
      'Multiple language support',
    ],
  })
}

/**
 * Agentic Vision Board Generation API
 *
 * Uses main brain for prompt generation + Gemini for image creation.
 * Implements self-evaluation with retry loop and confidence scoring.
 * Supports streaming progress updates to the UI.
 */

import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { SHARED_PATHS, getProfilePaths } from '@/lib/paths'

// Types
interface VisionBoardRequest {
  profileId: string
  type: 'daily' | 'goal' | 'challenge' | 'custom'
  title: string
  goals: string[]
  tasks?: string[]
  challengeId?: string
  challengeName?: string
  userImageBase64?: string
  style?: 'horizontal' | 'vertical' | 'square'
  aesthetic?: 'sketch' | 'photorealistic' | 'collage' | 'modern' | 'vintage'
}

interface GenerationAttempt {
  attemptNumber: number
  prompt: string
  imageGenerated: boolean
  evaluationScore: number
  evaluationFeedback: string
  improvementSuggestions?: string
}

interface StreamEvent {
  type: 'progress' | 'attempt' | 'evaluation' | 'success' | 'error'
  data: any
}

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)
const imageModel = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001'

// Constants
const MAX_RETRIES = 3
const MIN_CONFIDENCE_SCORE = 7 // Out of 10

/**
 * Generate vision board prompt using main brain (OpenAnalyst API)
 */
async function generateVisionBoardPrompt(
  request: VisionBoardRequest,
  previousFeedback?: string
): Promise<string> {
  const apiUrl = process.env.OPENANALYST_API_URL
  const apiKeyOA = process.env.OPENANALYST_API_KEY

  if (!apiUrl || !apiKeyOA) {
    // Fallback to local prompt generation
    return generateLocalPrompt(request, previousFeedback)
  }

  const systemPrompt = `You are an expert vision board designer and prompt engineer. Your job is to create highly detailed image generation prompts for vision boards.

The user wants to create a ${request.type} vision board with the following details:
- Title: ${request.title}
- Goals: ${request.goals.join(', ')}
${request.tasks ? `- Today's Tasks: ${request.tasks.join(', ')}` : ''}
${request.challengeName ? `- Challenge: ${request.challengeName}` : ''}
- Style: ${request.style || 'horizontal'} layout
- Aesthetic: ${request.aesthetic || 'modern'}

${previousFeedback ? `\nPREVIOUS ATTEMPT FEEDBACK:\n${previousFeedback}\n\nPlease improve the prompt based on this feedback.` : ''}

Create a detailed image generation prompt that:
1. Visualizes the user achieving their goals
2. Uses the specified aesthetic (${request.aesthetic || 'modern'})
3. Is laid out in a ${request.style || 'horizontal'} format
4. Includes motivational visual elements
5. Has a cohesive color scheme
6. Includes clear, readable text elements for goals

IMPORTANT: The prompt should be specific, detailed, and optimized for AI image generation.
Return ONLY the image generation prompt, nothing else.`

  try {
    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyOA}`,
      },
      body: JSON.stringify({
        model: process.env.OPENANALYST_MODEL || 'openanalyst-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a vision board prompt for: ${request.title}` }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error('Main brain API request failed')
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || generateLocalPrompt(request, previousFeedback)
  } catch (error) {
    console.error('Main brain prompt generation failed:', error)
    return generateLocalPrompt(request, previousFeedback)
  }
}

/**
 * Local prompt generation fallback
 */
function generateLocalPrompt(request: VisionBoardRequest, previousFeedback?: string): string {
  const stylePrompts: Record<string, string> = {
    sketch: 'A detailed blue ballpoint pen sketch style with cross-hatching for shading and hand-drawn doodle aesthetic',
    photorealistic: 'Photorealistic high-quality professional photography style with perfect lighting and composition',
    collage: 'A creative collage style with overlapping images, textures, and cut-out elements',
    modern: 'Clean, modern minimalist design with geometric shapes and a contemporary aesthetic',
    vintage: 'Vintage aesthetic with muted colors, film grain, and retro typography',
  }

  const layoutPrompts: Record<string, string> = {
    horizontal: 'wide horizontal panoramic layout (16:9 aspect ratio)',
    vertical: 'tall vertical portrait layout (9:16 aspect ratio)',
    square: 'square balanced layout (1:1 aspect ratio)',
  }

  const aesthetic = request.aesthetic || 'modern'
  const layout = request.style || 'horizontal'

  let prompt = `Create a stunning vision board with ${layoutPrompts[layout]}.

Style: ${stylePrompts[aesthetic]}

Central Theme: "${request.title}"

Goals to visualize:
${request.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

${request.tasks?.length ? `Today's focus areas:\n${request.tasks.slice(0, 3).join(', ')}` : ''}

Visual elements to include:
- Central focus on the main goal or achievement
- Surrounding supportive imagery representing each goal
- Motivational text overlays with key phrases
- Success symbols (stars, checkmarks, trophy elements)
- Progress indicators or pathway imagery
- Warm, inspiring color palette
- Clear visual hierarchy

The vision board should feel achievable, inspiring, and personally meaningful. Include subtle details that represent growth, progress, and success.`

  if (previousFeedback) {
    prompt += `\n\nIMPROVEMENT NOTES FROM PREVIOUS ATTEMPT:\n${previousFeedback}\n\nPlease address these issues in this version.`
  }

  return prompt
}

/**
 * Generate image using Gemini
 */
async function generateImage(prompt: string): Promise<{ success: boolean; imageData?: string; error?: string }> {
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY not configured' }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateImage?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          sampleCount: 1,
          aspectRatio: '16:9', // Horizontal by default
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error?.message || 'Image generation failed' }
    }

    const data = await response.json()

    if (!data.generatedImages || data.generatedImages.length === 0) {
      return { success: false, error: 'No image was generated' }
    }

    return { success: true, imageData: data.generatedImages[0].image }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Evaluate generated image using Gemini Vision
 */
async function evaluateImage(
  imageData: string,
  originalPrompt: string,
  goals: string[]
): Promise<{ score: number; feedback: string; improvements: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const evaluationPrompt = `You are a vision board quality evaluator. Analyze this image and provide a detailed evaluation.

ORIGINAL PROMPT:
${originalPrompt}

INTENDED GOALS:
${goals.join(', ')}

Evaluate the generated vision board image on:
1. Goal Representation (Are the goals visually represented?)
2. Aesthetic Quality (Is it visually appealing and professional?)
3. Motivation Factor (Does it inspire and motivate?)
4. Clarity (Is the message clear and readable?)
5. Composition (Is the layout balanced and well-organized?)

Provide your response in this EXACT format:
SCORE: [1-10]
FEEDBACK: [2-3 sentences explaining the score]
IMPROVEMENTS: [Specific suggestions for improvement, or "None needed" if score is 8+]`

    const result = await model.generateContent([
      evaluationPrompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageData,
        },
      },
    ])

    const response = result.response.text()

    // Parse the evaluation response
    const scoreMatch = response.match(/SCORE:\s*(\d+)/i)
    const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]+?)(?=IMPROVEMENTS:|$)/i)
    const improvementsMatch = response.match(/IMPROVEMENTS:\s*([\s\S]+)/i)

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Unable to parse evaluation'
    const improvements = improvementsMatch ? improvementsMatch[1].trim() : ''

    return { score, feedback, improvements }
  } catch (error) {
    console.error('Image evaluation error:', error)
    // Return a neutral score if evaluation fails
    return {
      score: 6,
      feedback: 'Automatic evaluation unavailable. Image generated successfully.',
      improvements: '',
    }
  }
}

/**
 * Save the generated image
 */
async function saveImage(imageData: string, boardId: string, profileId?: string): Promise<string> {
  const imagesDir = profileId
    ? path.join(getProfilePaths(profileId).visionboards, boardId, 'images')
    : path.join(SHARED_PATHS.assets, 'visionboards', boardId)

  await fs.mkdir(imagesDir, { recursive: true })

  const filename = `visionboard-${Date.now()}.png`
  const filepath = path.join(imagesDir, filename)
  const imageBuffer = Buffer.from(imageData, 'base64')
  await fs.writeFile(filepath, imageBuffer)

  return `/api/assets/visionboards/${boardId}/${filename}`
}

/**
 * Main POST handler - Streaming generation with evaluation loop
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        const body: VisionBoardRequest = await request.json()
        const boardId = `board-${Date.now()}`
        const attempts: GenerationAttempt[] = []

        sendEvent({
          type: 'progress',
          data: { message: 'Starting vision board generation...', step: 1, totalSteps: 4 }
        })

        let bestAttempt: GenerationAttempt | null = null
        let bestImageData: string | null = null
        let previousFeedback: string | undefined

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          sendEvent({
            type: 'attempt',
            data: {
              attemptNumber: attempt,
              maxAttempts: MAX_RETRIES,
              message: attempt === 1
                ? 'Generating initial vision board prompt...'
                : `Attempt ${attempt}: Improving based on feedback...`
            }
          })

          // Step 1: Generate prompt
          sendEvent({
            type: 'progress',
            data: { message: 'Creating optimized vision board prompt...', step: 2, totalSteps: 4 }
          })

          const prompt = await generateVisionBoardPrompt(body, previousFeedback)

          // Step 2: Generate image
          sendEvent({
            type: 'progress',
            data: { message: 'Generating vision board image with Gemini...', step: 3, totalSteps: 4 }
          })

          const imageResult = await generateImage(prompt)

          if (!imageResult.success || !imageResult.imageData) {
            sendEvent({
              type: 'evaluation',
              data: {
                attemptNumber: attempt,
                score: 0,
                feedback: `Image generation failed: ${imageResult.error}`,
                success: false
              }
            })
            continue
          }

          // Step 3: Evaluate the image
          sendEvent({
            type: 'progress',
            data: { message: 'Evaluating vision board quality...', step: 4, totalSteps: 4 }
          })

          const evaluation = await evaluateImage(imageResult.imageData, prompt, body.goals)

          const currentAttempt: GenerationAttempt = {
            attemptNumber: attempt,
            prompt,
            imageGenerated: true,
            evaluationScore: evaluation.score,
            evaluationFeedback: evaluation.feedback,
            improvementSuggestions: evaluation.improvements,
          }

          attempts.push(currentAttempt)

          sendEvent({
            type: 'evaluation',
            data: {
              attemptNumber: attempt,
              score: evaluation.score,
              maxScore: 10,
              feedback: evaluation.feedback,
              improvements: evaluation.improvements,
              passedThreshold: evaluation.score >= MIN_CONFIDENCE_SCORE
            }
          })

          // Track best attempt
          if (!bestAttempt || evaluation.score > bestAttempt.evaluationScore) {
            bestAttempt = currentAttempt
            bestImageData = imageResult.imageData
          }

          // If score meets threshold, we're done
          if (evaluation.score >= MIN_CONFIDENCE_SCORE) {
            sendEvent({
              type: 'progress',
              data: {
                message: `Vision board passed quality check (${evaluation.score}/10)!`,
                step: 4,
                totalSteps: 4
              }
            })
            break
          }

          // Prepare feedback for next iteration
          previousFeedback = `Score: ${evaluation.score}/10\nFeedback: ${evaluation.feedback}\nImprovements needed: ${evaluation.improvements}`

          if (attempt < MAX_RETRIES) {
            sendEvent({
              type: 'progress',
              data: {
                message: `Score ${evaluation.score}/10 below threshold. Retrying with improvements...`,
                step: 1,
                totalSteps: 4
              }
            })
          }
        }

        // Use the best attempt
        if (bestImageData && bestAttempt) {
          // Save the image
          const imageUrl = await saveImage(bestImageData, boardId, body.profileId)

          // Create vision board record
          const visionBoard = {
            id: boardId,
            title: body.title,
            type: body.type,
            goals: body.goals,
            style: body.style || 'horizontal',
            aesthetic: body.aesthetic || 'modern',
            imageUrl,
            confidenceScore: bestAttempt.evaluationScore,
            evaluationFeedback: bestAttempt.evaluationFeedback,
            generationAttempts: attempts.length,
            prompt: bestAttempt.prompt,
            createdAt: new Date().toISOString(),
            profileId: body.profileId,
          }

          // Save vision board metadata
          const visionboardsDir = body.profileId
            ? getProfilePaths(body.profileId).visionboards
            : SHARED_PATHS.assets
          await fs.mkdir(visionboardsDir, { recursive: true })
          await fs.writeFile(
            path.join(visionboardsDir, `${boardId}.json`),
            JSON.stringify(visionBoard, null, 2)
          )

          sendEvent({
            type: 'success',
            data: {
              visionBoard,
              message: `Vision board created successfully after ${attempts.length} attempt(s)!`,
              finalScore: bestAttempt.evaluationScore,
              imageUrl,
            }
          })
        } else {
          sendEvent({
            type: 'error',
            data: {
              message: 'Failed to generate vision board after all attempts',
              attempts: attempts.length,
            }
          })
        }

        controller.close()
      } catch (error: any) {
        sendEvent({
          type: 'error',
          data: { message: error.message || 'Vision board generation failed' }
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}

/**
 * GET - Get vision board generation status/capabilities
 */
export async function GET() {
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasMainBrain = !!(process.env.OPENANALYST_API_URL && process.env.OPENANALYST_API_KEY)

  return new Response(JSON.stringify({
    capabilities: {
      imageGeneration: hasGemini,
      smartPromptGeneration: hasMainBrain,
      selfEvaluation: hasGemini,
      maxRetries: MAX_RETRIES,
      minConfidenceScore: MIN_CONFIDENCE_SCORE,
    },
    supportedStyles: ['horizontal', 'vertical', 'square'],
    supportedAesthetics: ['sketch', 'photorealistic', 'collage', 'modern', 'vintage'],
    supportedTypes: ['daily', 'goal', 'challenge', 'custom'],
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

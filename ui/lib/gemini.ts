/**
 * Gemini API Client - Media Generation Only
 *
 * IMPORTANT: This module should ONLY be used for creative media generation:
 * - Image generation (Imagen)
 * - Video generation (Veo)
 * - Audio generation (coming soon)
 *
 * For text generation (motivation, quotes, summaries, chat), use OpenAnalyst API.
 * See: lib/api/openanalyst-client.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs/promises'
import path from 'path'
import { SHARED_PATHS, getProfilePaths } from './paths'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)
const imageModel = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001'
const videoModel = process.env.GEMINI_VIDEO_MODEL || 'veo-3.1'

// Types
interface ImageGenerationOptions {
  saveToAssets?: boolean
  profileId?: string
  category?: 'images' | 'visionboards' | 'uploads' | 'avatars'
  customFilename?: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
}

interface ImageGenerationResult {
  success: boolean
  filepath?: string
  filename?: string
  url?: string
  imageData?: string
  prompt: string
  error?: string
}

/**
 * Generate image using Gemini Imagen API
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    saveToAssets = true,
    profileId,
    category = 'images',
    customFilename,
    aspectRatio = '16:9',
  } = options

  try {
    if (!apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY not configured. Please add it to your .env.local file.',
        prompt,
      }
    }

    // Use Imagen API for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateImage?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          sampleCount: 1,
          aspectRatio,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error?.message || 'Image generation failed',
        prompt,
      }
    }

    const data = await response.json()

    if (!data.generatedImages || data.generatedImages.length === 0) {
      return {
        success: false,
        error: 'No image was generated',
        prompt,
      }
    }

    const imageData = data.generatedImages[0].image
    const imageBuffer = Buffer.from(imageData, 'base64')

    // Save to assets folder if requested
    if (saveToAssets) {
      let imagesDir: string

      if (profileId) {
        // Save to profile-specific directory
        const profilePaths = getProfilePaths(profileId)
        switch (category) {
          case 'visionboards':
            imagesDir = profilePaths.visionboards
            break
          case 'avatars':
            imagesDir = path.join(profilePaths.profile, 'avatars')
            break
          default:
            imagesDir = path.join(SHARED_PATHS.assets, category)
        }
      } else {
        imagesDir = path.join(SHARED_PATHS.assets, category)
      }

      await fs.mkdir(imagesDir, { recursive: true })

      const filename = customFilename || `generated-${Date.now()}.png`
      const filepath = path.join(imagesDir, filename)
      await fs.writeFile(filepath, imageBuffer)

      return {
        success: true,
        filepath,
        filename,
        url: `/api/assets/${category}/${filename}`,
        prompt,
      }
    }

    return {
      success: true,
      imageData: imageData, // base64
      prompt,
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image generation failed',
      prompt,
    }
  }
}

/**
 * Generate a vision board prompt optimized for Gemini image generation
 * Uses trending "2026 Vision Board" style prompts
 */
export async function generateVisionBoardPrompt(
  challenge: any,
  userGoals: string[],
  options: {
    style?: 'sketch' | 'photorealistic' | 'collage' | 'modern' | 'vintage'
    layout?: 'horizontal' | 'vertical' | 'square'
    userImageBase64?: string
    tasks?: string[]
  } = {}
): Promise<string> {
  const { style = 'modern', layout = 'horizontal', tasks } = options

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const stylePrompts: Record<string, string> = {
      sketch: `A detailed blue ballpoint pen sketch style knolling vision board on lined notebook paper.
               Uses cross-hatching for shading with a realistic hand-drawn doodle aesthetic.
               Include bright yellow highlighter outlines around key elements and playful handwritten annotations with arrows.`,
      photorealistic: `A photorealistic high-quality professional vision board with perfect lighting and composition.
                       Clean, sharp images representing goals with a cohesive color palette.
                       Studio-quality photography style with subtle textures.`,
      collage: `A creative magazine-style collage vision board with overlapping cut-out images and textures.
                Mix of photographs, typography, and decorative elements layered artistically.
                Includes inspirational text snippets and visual metaphors.`,
      modern: `A clean, modern minimalist vision board with geometric shapes and contemporary design.
               Uses a sophisticated color palette with bold typography and clean lines.
               Infographic-style layout with icons and simple illustrations.`,
      vintage: `A vintage-aesthetic vision board with muted sepia tones, film grain, and retro typography.
                Includes polaroid-style photo frames, old stamps, and nostalgic design elements.
                Warm, aged paper texture background.`,
    }

    const layoutDimensions: Record<string, string> = {
      horizontal: 'wide panoramic 16:9 horizontal layout',
      vertical: 'tall portrait 9:16 vertical layout',
      square: 'balanced 1:1 square layout',
    }

    const systemPrompt = `You are an expert vision board designer. Create a detailed, specific image generation prompt.

Challenge: ${challenge.name || 'Personal Development'}
Type: ${challenge.type || 'Goal Achievement'}
Main Goals: ${userGoals.join(', ')}
${tasks ? `Today's Tasks: ${tasks.slice(0, 5).join(', ')}` : ''}

Create an image generation prompt using this style:
${stylePrompts[style]}

Layout: ${layoutDimensions[layout]}

The prompt must:
1. Be highly specific and detailed for AI image generation
2. Include visual representations of each goal
3. Have a motivational, aspirational feel
4. Include success symbols and progress indicators
5. Maintain visual hierarchy with the main goal prominent
6. Include readable text elements with key motivational phrases

Return ONLY the detailed image generation prompt, nothing else.`

    const result = await model.generateContent(systemPrompt)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error('Vision board prompt generation error:', error)
    // Fallback to basic prompt
    return generateBasicVisionBoardPrompt(challenge, userGoals, options)
  }
}

/**
 * Fallback basic vision board prompt
 */
function generateBasicVisionBoardPrompt(
  challenge: any,
  userGoals: string[],
  options: { style?: string; layout?: string } = {}
): string {
  const { style = 'modern', layout = 'horizontal' } = options

  return `Create a stunning ${layout} vision board for "${challenge.name || 'Personal Growth'}".

Style: Clean ${style} aesthetic with cohesive design.

Goals to visualize:
${userGoals.map((g, i) => `- ${g}`).join('\n')}

Include:
- Central focal point representing the main achievement
- Supporting imagery for each goal
- Motivational text overlays
- Success symbols (stars, checkmarks, upward arrows)
- Warm, inspiring color palette
- Clear visual hierarchy

The vision board should feel achievable, inspiring, and personally meaningful.`
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(
  imageInput: string | Buffer,
  question: string
): Promise<{ success: boolean; analysis?: string; error?: string }> {
  try {
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    let imageData: string
    let mimeType = 'image/png'

    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('/') || imageInput.includes('\\')) {
        // It's a file path
        const imageBuffer = await fs.readFile(imageInput)
        imageData = imageBuffer.toString('base64')

        // Detect mime type from extension
        if (imageInput.endsWith('.jpg') || imageInput.endsWith('.jpeg')) {
          mimeType = 'image/jpeg'
        } else if (imageInput.endsWith('.webp')) {
          mimeType = 'image/webp'
        }
      } else {
        // It's already base64
        imageData = imageInput
      }
    } else {
      // It's a Buffer
      imageData = imageInput.toString('base64')
    }

    const result = await model.generateContent([
      question,
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ])

    return {
      success: true,
      analysis: result.response.text(),
    }
  } catch (error) {
    console.error('Image analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image analysis failed',
    }
  }
}

/**
 * Evaluate a generated image for quality
 */
export async function evaluateGeneratedImage(
  imageData: string,
  originalPrompt: string,
  goals: string[]
): Promise<{ score: number; feedback: string; improvements: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const evaluationPrompt = `You are a vision board quality evaluator. Analyze this generated image.

ORIGINAL PROMPT:
${originalPrompt}

INTENDED GOALS:
${goals.join(', ')}

Rate the image on these criteria (each 1-10):
1. Goal Representation - Are goals visually represented?
2. Aesthetic Quality - Is it visually appealing?
3. Motivation Factor - Is it inspiring?
4. Clarity - Is the message clear?
5. Composition - Is layout balanced?

Respond in EXACTLY this format:
SCORE: [average of all criteria, 1-10]
FEEDBACK: [2-3 sentences on overall quality]
IMPROVEMENTS: [specific suggestions, or "None needed" if excellent]`

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

    const scoreMatch = response.match(/SCORE:\s*(\d+)/i)
    const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]+?)(?=IMPROVEMENTS:|$)/i)
    const improvementsMatch = response.match(/IMPROVEMENTS:\s*([\s\S]+)/i)

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : 'Evaluation complete',
      improvements: improvementsMatch ? improvementsMatch[1].trim() : '',
    }
  } catch (error) {
    console.error('Image evaluation error:', error)
    return { score: 6, feedback: 'Evaluation unavailable', improvements: '' }
  }
}

// Video Generation Types
interface VideoGenerationOptions {
  duration?: number // seconds (default 8)
  resolution?: '720p' | '1080p' | '4k'
  aspectRatio?: '16:9' | '9:16'
  saveToAssets?: boolean
  profileId?: string
  category?: string
  customFilename?: string
}

interface VideoGenerationResult {
  success: boolean
  filepath?: string
  filename?: string
  url?: string
  videoData?: string
  prompt: string
  error?: string
  taskId?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
}

/**
 * Generate video using Gemini Veo API
 * Note: This is an async operation - video generation takes time
 */
export async function generateVideo(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const {
    duration = 8,
    resolution = '1080p',
    aspectRatio = '16:9',
    saveToAssets = true,
    profileId,
    category = 'videos',
    customFilename,
  } = options

  try {
    if (!apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY not configured. Please add it to your .env.local file.',
        prompt,
      }
    }

    // Use Veo API for video generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${videoModel}:generateVideo?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          duration,
          resolution,
          aspectRatio,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error?.message || 'Video generation failed',
        prompt,
      }
    }

    const data = await response.json()

    // Video generation is async - return task ID for polling
    if (data.name) {
      return {
        success: true,
        taskId: data.name,
        status: 'processing',
        prompt,
      }
    }

    // If video is ready immediately
    if (data.generatedVideos?.[0]?.video) {
      const videoData = data.generatedVideos[0].video
      const videoBuffer = Buffer.from(videoData, 'base64')

      if (saveToAssets) {
        let videosDir: string
        if (profileId) {
          const profilePaths = getProfilePaths(profileId)
          videosDir = path.join(profilePaths.profile, category)
        } else {
          videosDir = path.join(SHARED_PATHS.assets, category)
        }

        await fs.mkdir(videosDir, { recursive: true })
        const filename = customFilename || `generated-${Date.now()}.mp4`
        const filepath = path.join(videosDir, filename)
        await fs.writeFile(filepath, videoBuffer)

        return {
          success: true,
          filepath,
          filename,
          url: `/api/assets/${category}/${filename}`,
          status: 'completed',
          prompt,
        }
      }

      return {
        success: true,
        videoData,
        status: 'completed',
        prompt,
      }
    }

    return {
      success: false,
      error: 'Unexpected response from video generation API',
      prompt,
    }
  } catch (error) {
    console.error('Video generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Video generation failed',
      prompt,
    }
  }
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(taskId: string): Promise<VideoGenerationResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${taskId}?key=${apiKey}`
    )

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error?.message || 'Failed to check video status',
        prompt: '',
        taskId,
      }
    }

    const data = await response.json()

    if (data.done && data.response?.generatedVideos?.[0]) {
      return {
        success: true,
        videoData: data.response.generatedVideos[0].video,
        status: 'completed',
        prompt: '',
        taskId,
      }
    }

    return {
      success: true,
      status: data.done ? 'completed' : 'processing',
      prompt: '',
      taskId,
    }
  } catch (error) {
    console.error('Video status check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check video status',
      prompt: '',
      taskId,
    }
  }
}

/**
 * Save an uploaded image to assets
 */
export async function saveUploadedImage(
  imageBuffer: Buffer,
  options: {
    profileId?: string
    category?: string
    filename?: string
    originalName?: string
  } = {}
): Promise<{ success: boolean; filepath?: string; url?: string; error?: string }> {
  try {
    const { profileId, category = 'uploads', originalName } = options

    let saveDir: string
    if (profileId) {
      const profilePaths = getProfilePaths(profileId)
      saveDir = path.join(profilePaths.profile, category)
    } else {
      saveDir = path.join(SHARED_PATHS.assets, category)
    }

    await fs.mkdir(saveDir, { recursive: true })

    // Generate filename
    const ext = originalName ? path.extname(originalName) : '.png'
    const filename = options.filename || `upload-${Date.now()}${ext}`
    const filepath = path.join(saveDir, filename)

    await fs.writeFile(filepath, imageBuffer)

    return {
      success: true,
      filepath,
      url: `/api/assets/${category}/${filename}`,
    }
  } catch (error) {
    console.error('Image save error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save image',
    }
  }
}

/**
 * Create a personalized vision board with user's photo
 */
export async function createPersonalizedVisionBoard(
  userImageBase64: string,
  goals: string[],
  options: {
    style?: string
    overlayText?: boolean
  } = {}
): Promise<{ success: boolean; prompt?: string; error?: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    // Analyze the user's photo to understand context
    const analysisResult = await model.generateContent([
      `Analyze this photo and describe the person briefly (general appearance, setting).
       Then create a vision board prompt that would show this person achieving these goals: ${goals.join(', ')}
       The vision board should be aspirational and show future success.

       Return in this format:
       DESCRIPTION: [brief description]
       PROMPT: [detailed image generation prompt for vision board]`,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: userImageBase64,
        },
      },
    ])

    const response = analysisResult.response.text()
    const promptMatch = response.match(/PROMPT:\s*([\s\S]+)/i)

    if (promptMatch) {
      return { success: true, prompt: promptMatch[1].trim() }
    }

    return { success: false, error: 'Could not generate personalized prompt' }
  } catch (error) {
    console.error('Personalized vision board error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create personalized vision board',
    }
  }
}

/**
 * Check Gemini API availability
 */
export function isGeminiConfigured(): boolean {
  return !!apiKey
}

/**
 * Get Gemini capabilities
 *
 * Note: Gemini is ONLY used for media generation (images, videos, audio).
 * Text generation (motivation, quotes, summaries) uses OpenAnalyst API.
 */
export function getGeminiCapabilities() {
  return {
    // Media generation capabilities (Gemini)
    imageGeneration: !!apiKey,
    imageAnalysis: !!apiKey,
    videoGeneration: !!apiKey,
    visionBoardGeneration: !!apiKey,

    // Models
    imageModel,
    videoModel,

    // Note: Text generation should use OpenAnalyst
    // See: lib/api/openanalyst-client.ts
    textGeneration: false, // Disabled - use OpenAnalyst instead
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs/promises'
import path from 'path'
import { SHARED_PATHS } from './paths'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)
const imageModel = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001'

export async function generateImage(prompt: string, saveToAssets: boolean = true) {
  try {
    if (!apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY not configured. Please add it to your .env file.',
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
      const imagesDir = path.join(SHARED_PATHS.assets, 'images')
      await fs.mkdir(imagesDir, { recursive: true })

      const filename = `generated-${Date.now()}.png`
      const filepath = path.join(imagesDir, filename)
      await fs.writeFile(filepath, imageBuffer)

      return {
        success: true,
        filepath,
        filename,
        url: `/api/assets/images/${filename}`,
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

export async function generateVisionBoardPrompt(
  challenge: any,
  userGoals: string[],
  userImagePath?: string
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const prompt = `You are a vision board creator. Create a detailed, inspiring prompt for generating a vision board image.

Challenge: ${challenge.name}
Type: ${challenge.type}
Goals: ${userGoals.join(', ')}

Create a detailed image generation prompt that:
1. Visualizes the user achieving their goals
2. Is motivating and specific to their challenge
3. Includes visual elements that represent success
4. Has a positive, aspirational tone

Return only the image generation prompt, nothing else.`

    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error('Vision board prompt generation error:', error)
    throw error
  }
}

export async function analyzeImage(imagePath: string, question: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    // Note: This requires implementing file upload
    // Placeholder for now

    return {
      success: false,
      error: 'Image analysis not yet fully implemented',
    }
  } catch (error) {
    console.error('Image analysis error:', error)
    throw error
  }
}

export async function generateMotivation(context: {
  challengeName: string
  currentStreak: number
  recentWins: string[]
  goals: string[]
}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    const prompt = `You are an accountability coach. Generate a personalized, context-aware motivational message.

Challenge: ${context.challengeName}
Current Streak: ${context.currentStreak} days
Recent Wins: ${context.recentWins.join(', ')}
Goals: ${context.goals.join(', ')}

Create a motivational message that:
1. References their specific achievements (no generic quotes!)
2. Connects past wins to future goals
3. Is encouraging but realistic
4. Uses their actual streak number
5. Is 2-3 sentences max

Return only the motivational message, nothing else.`

    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error('Motivation generation error:', error)
    throw error
  }
}

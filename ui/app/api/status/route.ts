import { NextResponse } from 'next/server'

export async function GET() {
  const status = {
    openanalyst: {
      configured: !!process.env.OPENANALYST_API_KEY && process.env.OPENANALYST_API_KEY !== 'sk-oa-v1-your-key-here',
      url: process.env.OPENANALYST_API_URL || 'Not configured',
      model: process.env.OPENANALYST_MODEL || 'Not configured',
    },
    gemini: {
      configured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      imageModel: process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001',
    },
    environment: process.env.NODE_ENV || 'development',
  }

  return NextResponse.json(status)
}

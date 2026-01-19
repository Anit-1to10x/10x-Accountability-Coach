import { NextResponse } from 'next/server'

export async function GET() {
  const status = {
    // Main brain - OpenAnalyst API (Required)
    openanalyst: {
      configured: !!process.env.OPENANALYST_API_KEY && process.env.OPENANALYST_API_KEY !== 'sk-oa-v1-your-key-here',
      url: process.env.OPENANALYST_API_URL || 'Not configured',
      model: process.env.OPENANALYST_MODEL || 'Not configured',
      required: true,
      description: 'Main AI brain for chat and coaching',
      envKey: 'OPENANALYST_API_KEY',
      getKeyUrl: 'https://10x.events/api-key',
      instructions: 'Get your API key at https://10x.events/api-key and add OPENANALYST_API_KEY=sk-oa-v1-xxx to ui/.env.local',
    },
    // Image Generation - Gemini API (Optional)
    gemini: {
      configured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      imageModel: process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001',
      required: false,
      description: 'Image generation for nanobanana skill and creative features',
      envKey: 'GEMINI_API_KEY',
      getKeyUrl: 'https://aistudio.google.com/app/apikey',
      instructions: 'Get your API key at Google AI Studio and add GEMINI_API_KEY=xxx to ui/.env.local',
      usedBy: ['nanobanana-skill', 'ai-image-generation', 'ai-product-photo'],
    },
    // Search - Brave API (Optional)
    brave: {
      configured: !!process.env.BRAVE_API_KEY,
      required: false,
      description: 'Web search capabilities',
      envKey: 'BRAVE_API_KEY',
      getKeyUrl: 'https://brave.com/search/api/',
      instructions: 'Get your API key at Brave Search API and add BRAVE_API_KEY=xxx to ui/.env.local',
      usedBy: ['web-search'],
    },
    // Search Alternative - Perplexity API (Optional)
    perplexity: {
      configured: !!process.env.PERPLEXITY_API_KEY,
      required: false,
      description: 'AI-powered search and research',
      envKey: 'PERPLEXITY_API_KEY',
      getKeyUrl: 'https://www.perplexity.ai/settings/api',
      instructions: 'Get your API key at Perplexity and add PERPLEXITY_API_KEY=xxx to ui/.env.local',
      usedBy: ['research', 'deep-search'],
    },
    // Serper API for Google Search (Optional)
    serper: {
      configured: !!process.env.SERPER_API_KEY,
      required: false,
      description: 'Google Search results via Serper',
      envKey: 'SERPER_API_KEY',
      getKeyUrl: 'https://serper.dev/',
      instructions: 'Get your API key at Serper.dev and add SERPER_API_KEY=xxx to ui/.env.local',
      usedBy: ['google-search'],
    },
    environment: process.env.NODE_ENV || 'development',

    // Summary for UI
    summary: {
      mainBrainConfigured: !!process.env.OPENANALYST_API_KEY && process.env.OPENANALYST_API_KEY !== 'sk-oa-v1-your-key-here',
      optionalServicesConfigured: [
        !!process.env.GEMINI_API_KEY && 'Gemini',
        !!process.env.BRAVE_API_KEY && 'Brave',
        !!process.env.PERPLEXITY_API_KEY && 'Perplexity',
        !!process.env.SERPER_API_KEY && 'Serper',
      ].filter(Boolean),
      missingRequired: !process.env.OPENANALYST_API_KEY || process.env.OPENANALYST_API_KEY === 'sk-oa-v1-your-key-here'
        ? ['OpenAnalyst API Key - Required for the app to work']
        : [],
    },
  }

  return NextResponse.json(status)
}

/**
 * Streaming Chat API Route
 *
 * Provides streaming chat responses using the OpenAnalyst API.
 * Replaces the WebSocket-based Claude Code CLI architecture.
 */

import { NextRequest } from 'next/server';
import { chatStream, createSSETextStream } from '@/lib/api/openanalyst-client';
import { buildContext, buildSystemPrompt } from '@/lib/api/context-builder';
import { matchSkill } from '@/lib/api/skills-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Patterns to detect tasks that benefit from specific APIs
const WEB_SEARCH_PATTERNS = [
  /\b(web search|search the web|search online|google|look up|find online)\b/i,
  /\b(current news|latest news|recent news|today's news)\b/i,
  /\b(what is happening|what's happening)\b/i,
  /\b(current price|stock price|weather today)\b/i,
];

const RESEARCH_PATTERNS = [
  /\b(research|competitive analysis|market research|industry analysis)\b/i,
  /\b(deep dive|comprehensive analysis|thorough research)\b/i,
  /\b(compare.*companies|competitor analysis|market trends)\b/i,
  /\b(literature review|academic research|find papers)\b/i,
  /\b(summarize.*article|summarize.*website|analyze.*url)\b/i,
];

const IMAGE_GENERATION_PATTERNS = [
  /\b(generate.*image|create.*image|make.*image|draw|design)\b/i,
  /\b(nanobanana|ai image|ai art|generate.*picture)\b/i,
  /\b(create.*logo|design.*graphic|make.*visual)\b/i,
];

interface ApiSuggestion {
  type: 'web_search' | 'research' | 'image_generation';
  suggestedApi: string;
  configured: boolean;
  message: string;
  configUrl: string;
  envKey: string;
}

function detectTaskType(content: string): ApiSuggestion | null {
  // Check for web search tasks - Brave excels at this
  for (const pattern of WEB_SEARCH_PATTERNS) {
    if (pattern.test(content)) {
      const configured = !!process.env.BRAVE_API_KEY;
      return {
        type: 'web_search',
        suggestedApi: 'Brave Search',
        configured,
        message: configured
          ? 'Using Brave Search for web results'
          : '💡 **Tip:** For better web search results, configure the Brave Search API. Get your key at brave.com/search/api and add BRAVE_API_KEY to ui/.env.local',
        configUrl: 'https://brave.com/search/api/',
        envKey: 'BRAVE_API_KEY',
      };
    }
  }

  // Check for research tasks - Perplexity excels at this
  for (const pattern of RESEARCH_PATTERNS) {
    if (pattern.test(content)) {
      const configured = !!process.env.PERPLEXITY_API_KEY;
      return {
        type: 'research',
        suggestedApi: 'Perplexity',
        configured,
        message: configured
          ? 'Using Perplexity for comprehensive research'
          : '💡 **Tip:** For better research and analysis, configure the Perplexity API. Get your key at perplexity.ai/settings/api and add PERPLEXITY_API_KEY to ui/.env.local',
        configUrl: 'https://www.perplexity.ai/settings/api',
        envKey: 'PERPLEXITY_API_KEY',
      };
    }
  }

  // Check for image generation tasks - Gemini excels at this
  for (const pattern of IMAGE_GENERATION_PATTERNS) {
    if (pattern.test(content)) {
      const configured = !!process.env.GEMINI_API_KEY;
      return {
        type: 'image_generation',
        suggestedApi: 'Gemini',
        configured,
        message: configured
          ? 'Using Gemini for image generation'
          : '💡 **Tip:** For image generation, configure the Gemini API. Get your key at aistudio.google.com/app/apikey and add GEMINI_API_KEY to ui/.env.local',
        configUrl: 'https://aistudio.google.com/app/apikey',
        envKey: 'GEMINI_API_KEY',
      };
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { agentId, content, profileId } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Message content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Build user context
    const context = await buildContext(profileId);

    // 2. Detect if task would benefit from specific APIs
    const apiSuggestion = detectTaskType(content);

    // 3. Match skill (optional)
    const skill = await matchSkill(content, agentId || 'unified');
    const matchedSkill = skill ? { name: skill.name, body: skill.body } : null;

    // 4. Build system prompt with context + skill
    // If API suggestion exists but not configured, add a note to the system prompt
    let additionalContext = '';
    if (apiSuggestion && !apiSuggestion.configured) {
      additionalContext = `\n\nNote: The user is asking about ${apiSuggestion.type.replace('_', ' ')}. The ${apiSuggestion.suggestedApi} API is not configured, so provide the best response possible with available information, but mention that results could be improved by configuring the ${apiSuggestion.suggestedApi} API.`;
    }

    const systemPrompt = buildSystemPrompt(context, agentId || 'unified', matchedSkill) + additionalContext;

    // 5. Call OpenAnalyst API with streaming
    const apiStream = await chatStream(
      [{ role: 'user', content }],
      systemPrompt
    );

    // 5. Transform the SSE stream to text stream
    const textStream = createSSETextStream(apiStream);

    // 6. Create the response encoder
    const encoder = new TextEncoder();

    // 7. Create a transform stream that converts text to SSE format
    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = textStream.getReader();

        try {
          // Send API suggestion if detected
          if (apiSuggestion) {
            const suggestionEvent = `data: ${JSON.stringify({
              type: 'api_suggestion',
              suggestion: {
                taskType: apiSuggestion.type,
                suggestedApi: apiSuggestion.suggestedApi,
                configured: apiSuggestion.configured,
                message: apiSuggestion.message,
                configUrl: apiSuggestion.configUrl,
                envKey: apiSuggestion.envKey,
              },
            })}\n\n`;
            controller.enqueue(encoder.encode(suggestionEvent));
          }

          // Send skill info if matched
          if (matchedSkill) {
            const skillEvent = `data: ${JSON.stringify({
              type: 'skill_match',
              skillName: matchedSkill.name,
            })}\n\n`;
            controller.enqueue(encoder.encode(skillEvent));
          }

          // Send start event
          const startEvent = `data: ${JSON.stringify({ type: 'start' })}\n\n`;
          controller.enqueue(encoder.encode(startEvent));

          // Stream content chunks
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Send end event
              const endEvent = `data: ${JSON.stringify({ type: 'end' })}\n\n`;
              controller.enqueue(encoder.encode(endEvent));
              controller.close();
              break;
            }

            // Send content chunk
            const chunkEvent = `data: ${JSON.stringify({
              type: 'chunk',
              content: value,
            })}\n\n`;
            controller.enqueue(encoder.encode(chunkEvent));
          }
        } catch (error) {
          // Send error event
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorEvent = `data: ${JSON.stringify({
            type: 'error',
            error: errorMessage,
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    // 8. Return as SSE stream
    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[chat/stream] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET endpoint for checking API configuration
 */
export async function GET() {
  const hasApiUrl = !!process.env.OPENANALYST_API_URL;
  const hasApiKey = !!process.env.OPENANALYST_API_KEY;

  return new Response(
    JSON.stringify({
      configured: hasApiUrl && hasApiKey,
      apiUrl: hasApiUrl ? 'configured' : 'missing',
      apiKey: hasApiKey ? 'configured' : 'missing',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

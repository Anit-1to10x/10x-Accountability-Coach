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

    // 2. Match skill (optional)
    const skill = await matchSkill(content, agentId || 'unified');
    const matchedSkill = skill ? { name: skill.name, body: skill.body } : null;

    // 3. Build system prompt with context + skill
    const systemPrompt = buildSystemPrompt(context, agentId || 'unified', matchedSkill);

    // 4. Call OpenAnalyst API with streaming
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

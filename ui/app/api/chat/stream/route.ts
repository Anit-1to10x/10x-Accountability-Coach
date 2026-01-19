/**
 * Streaming Chat API Route
 *
 * Provides streaming chat responses using the OpenAnalyst API.
 * Features:
 * - Dynamic prompt matching for optimized, context-aware responses
 * - MCP integration for external tool calls
 * - Sandbox code execution capability
 * - Tool call streaming to UI
 * - File chunking and context for discussing uploaded files
 * - User profile context with priority over system defaults
 * - Parallel API loading for optimal performance
 * - MCP data fetching with streaming support
 */

import { NextRequest } from 'next/server';
import { chatStream, createSSETextStream } from '@/lib/api/openanalyst-client';
import { buildEnhancedSystemPrompt } from '@/lib/api/context-builder';
import { loadContextParallel } from '@/lib/api/parallel-loader';
import { executeToolCall } from '@/lib/mcp/manager';
import { executeCode, formatResultForLLM } from '@/lib/sandbox/executor';
import { fetchMCPData, formatMCPContext } from '@/lib/mcp/data-fetcher';
import type { MCPToolCall } from '@/types/mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Built-in tools for the LLM
const BUILT_IN_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'execute_code',
      description: 'Execute code in a sandboxed environment. Use this to run calculations, data processing, or verify code snippets. Returns the execution output.',
      parameters: {
        type: 'object',
        properties: {
          language: {
            type: 'string',
            enum: ['javascript', 'typescript', 'python', 'shell'],
            description: 'Programming language to execute',
          },
          code: {
            type: 'string',
            description: 'The code to execute',
          },
        },
        required: ['language', 'code'],
      },
    },
  },
];

// Handle built-in tool execution
async function executeBuiltInTool(name: string, args: Record<string, any>): Promise<string> {
  if (name === 'execute_code') {
    const result = await executeCode({
      language: args.language,
      code: args.code,
    });
    return formatResultForLLM(result);
  }
  return `Unknown tool: ${name}`;
}

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

// File attachment structure from chat
interface FileAttachment {
  name: string;
  content: string;
  type: string;
  size: number;
}

export async function POST(request: NextRequest) {
  try {
    const { agentId, content, profileId, files, selectedAgentIds } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Message content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const attachedFiles: FileAttachment[] = files || [];

    // 1. PARALLEL LOADING - Load all context data simultaneously
    // This is much faster than sequential loading
    // Pass selectedAgentIds for unified chat to combine capabilities
    const {
      context,
      userProfileContext,
      fileContexts,
      matchedSkill,
      mcpTools,
      mcpStatus,
      agentCapabilities,
      loadTime,
    } = await loadContextParallel({
      profileId,
      agentId: agentId || 'unified',
      selectedAgentIds: selectedAgentIds || [],
      userMessage: content,
      files: attachedFiles,
    });

    console.log(`[chat/stream] Parallel context loaded in ${loadTime}ms`);

    // 2. Build file context string
    let fileContext = '';
    if (fileContexts.length > 0) {
      fileContext = `\n## Attached Files\n${fileContexts.join('\n')}\n`;
    }

    // 3. Detect if task would benefit from specific APIs
    const apiSuggestion = detectTaskType(content);

    // 4. Build enhanced system prompt with dynamic prompt matching
    // This selects the best prompts based on user's message content
    // Also uses agent capabilities to filter which prompts/skills are available
    const { systemPrompt: enhancedPrompt, matchedPrompts } = await buildEnhancedSystemPrompt(
      context,
      content,
      agentId || 'unified',
      matchedSkill
    );

    // 7. Build final system prompt with all contexts
    // Priority order: User profile > System defaults > File context
    let systemPrompt = enhancedPrompt;

    // Add user profile context (HIGH PRIORITY - overrides defaults)
    if (userProfileContext) {
      systemPrompt = `${userProfileContext}\n\n${systemPrompt}`;
    }

    // Add file context for discussing attached files
    if (fileContext) {
      systemPrompt += `\n\n${fileContext}\n\n## File Discussion Instructions
When the user asks about attached files:
- Reference specific data from the file context above
- For CSV files: Use column names and sample data to answer questions
- For code files: Analyze functions, classes, and logic
- For JSON: Navigate the structure and explain the data
- If you need more of the file, tell the user which sections you need
- Be specific: cite line numbers, column names, or keys when possible`;
    }

    // Add API suggestion note if applicable
    if (apiSuggestion && !apiSuggestion.configured) {
      systemPrompt += `\n\nNote: The user is asking about ${apiSuggestion.type.replace('_', ' ')}. The ${apiSuggestion.suggestedApi} API is not configured, so provide the best response possible with available information, but mention that results could be improved by configuring the ${apiSuggestion.suggestedApi} API.`;
    }

    // 8. Get available tools (MCP already loaded in parallel + built-in)
    const availableTools: any[] = [...BUILT_IN_TOOLS, ...mcpTools];

    // Add tools context to system prompt if tools are available
    if (availableTools.length > 0) {
      systemPrompt += `\n\n## Available Tools
You have access to ${availableTools.length} tool(s). Use them when appropriate to help the user:
${availableTools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n')}

When using tools, the results will be shown to the user in real-time.`;
    }

    // 6. Call OpenAnalyst API with streaming
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
          // Send MCP status if connected
          if (mcpStatus && mcpStatus.type === 'mcp_status' && mcpStatus.status === 'connected') {
            const mcpEvent = `data: ${JSON.stringify({
              type: 'mcp_connected',
              servers: mcpStatus.servers || [],
              toolCount: mcpTools.length,
            })}\n\n`;
            controller.enqueue(encoder.encode(mcpEvent));
          }

          // Send file context info if files are attached
          if (attachedFiles.length > 0) {
            const filesEvent = `data: ${JSON.stringify({
              type: 'files_processed',
              files: attachedFiles.map(f => ({
                name: f.name,
                type: f.type,
                size: f.size,
              })),
              message: `Analyzing ${attachedFiles.length} file(s) for context`,
            })}\n\n`;
            controller.enqueue(encoder.encode(filesEvent));
          }

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

          // Send prompt match info if a prompt was matched
          if (matchedPrompts.primary && matchedPrompts.primary.score > 5) {
            const promptEvent = `data: ${JSON.stringify({
              type: 'prompt_match',
              promptName: matchedPrompts.primary.prompt.name,
              promptCategory: matchedPrompts.primary.prompt.category,
              score: matchedPrompts.primary.score,
              reasoning: matchedPrompts.primary.prompt.reasoning || 'standard',
            })}\n\n`;
            controller.enqueue(encoder.encode(promptEvent));
          }

          // Send available tools info
          if (availableTools.length > 0) {
            const toolsEvent = `data: ${JSON.stringify({
              type: 'tools_available',
              tools: availableTools.map(t => ({
                name: t.function.name,
                description: t.function.description,
              })),
            })}\n\n`;
            controller.enqueue(encoder.encode(toolsEvent));
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

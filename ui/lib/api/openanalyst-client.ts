/**
 * OpenAnalyst API Client
 *
 * Anthropic Messages API-compatible client for the OpenAnalyst AI service.
 * Supports streaming responses using Server-Sent Events (SSE).
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatStreamOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Stream a chat response from the OpenAnalyst API
 * @param messages - Array of messages in the conversation
 * @param systemPrompt - System prompt for context
 * @param options - Optional parameters for the request
 * @returns ReadableStream of the response
 */
export async function chatStream(
  messages: Message[],
  systemPrompt: string,
  options: ChatStreamOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const apiUrl = process.env.OPENANALYST_API_URL;
  const apiKey = process.env.OPENANALYST_API_KEY;
  const model = process.env.OPENANALYST_MODEL || 'openanalyst-beta';

  if (!apiUrl || !apiKey) {
    throw new Error('OpenAnalyst API configuration missing. Set OPENANALYST_API_URL and OPENANALYST_API_KEY in .env.local');
  }

  const response = await fetch(`${apiUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAnalyst API error: ${response.status} - ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No response body from OpenAnalyst API');
  }

  return response.body;
}

/**
 * Parse SSE data from the OpenAnalyst API response
 * Handles Anthropic-style streaming events
 * @param chunk - Raw chunk from the stream
 * @returns Parsed text content or null
 */
export function parseSSEChunk(chunk: string): { text: string; done: boolean } | null {
  const lines = chunk.split('\n');
  let text = '';
  let done = false;

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);

      if (data === '[DONE]') {
        done = true;
        continue;
      }

      try {
        const parsed = JSON.parse(data);

        // Handle Anthropic streaming format
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          text += parsed.delta.text;
        } else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
          done = true;
        } else if (parsed.type === 'message_stop') {
          done = true;
        }
        // Handle simpler streaming formats
        else if (parsed.content) {
          text += parsed.content;
        } else if (parsed.text) {
          text += parsed.text;
        }
      } catch {
        // Skip non-JSON lines
      }
    }
  }

  if (text || done) {
    return { text, done };
  }

  return null;
}

/**
 * Transform a ReadableStream to parse SSE events and extract text
 * @param stream - Raw stream from the API
 * @returns TransformStream that emits text chunks
 */
export function createSSETextStream(stream: ReadableStream<Uint8Array>): ReadableStream<string> {
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream<string>({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete events (split by double newline)
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const event of events) {
            const parsed = parseSSEChunk(event);
            if (parsed?.text) {
              controller.enqueue(parsed.text);
            }
            if (parsed?.done) {
              controller.close();
              return;
            }
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Non-streaming chat completion
 * @param messages - Array of messages in the conversation
 * @param systemPrompt - System prompt for context
 * @param options - Optional parameters for the request
 * @returns Complete response text
 */
export async function chat(
  messages: Message[],
  systemPrompt: string,
  options: ChatStreamOptions = {}
): Promise<string> {
  const apiUrl = process.env.OPENANALYST_API_URL;
  const apiKey = process.env.OPENANALYST_API_KEY;
  const model = process.env.OPENANALYST_MODEL || 'openanalyst-beta';

  if (!apiUrl || !apiKey) {
    throw new Error('OpenAnalyst API configuration missing');
  }

  const response = await fetch(`${apiUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAnalyst API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Handle Anthropic response format
  if (data.content && Array.isArray(data.content)) {
    return data.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('');
  }

  // Handle simpler formats
  return data.content || data.text || '';
}

import type { Message } from '@/types/chat';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface StreamChatParams {
  messages: Array<{ role: string; content: string }>;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChat({ messages, onDelta, onDone, onError }: StreamChatParams) {
  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            // Handle Anthropic streaming format
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              onDelta(parsed.delta.text);
            }
            // Handle message start
            else if (parsed.type === 'message_start') {
              // Message started
            }
            // Handle message stop
            else if (parsed.type === 'message_stop') {
              // Message completed
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onDelta(parsed.delta.text);
              }
            } catch {
              // Ignore
            }
          }
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

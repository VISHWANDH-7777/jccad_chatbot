import axios from 'axios';
import { apiUrl } from './api';

interface StreamCallbackParams {
  chunk?: string;
  done?: boolean;
  conversationId?: string;
  citations?: Array<{
    citationIndex: number;
    sourceName: string;
    version: number;
  }>;
  followUp?: string[];
  error?: string;
}

export const executeChatStream = async (
  query: string,
  conversationId: string | null,
  onChunk: (params: StreamCallbackParams) => void,
  signal?: AbortSignal
) => {
  try {
    const response = await fetch(apiUrl('/api/v1/orchestration/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, conversationId }),
      signal
    });

    if (!response.ok) {
      throw new Error('Failed to initiate chat stream connection');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
      throw new Error('Readable stream not supported by browser client');
    }

    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Retain partial lines in buffer

      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('data: ')) {
          try {
            const rawJson = cleanLine.substring(6);
            const payload: StreamCallbackParams = JSON.parse(rawJson);
            onChunk(payload);
          } catch (err) {
            // Skip json parse failures on partial buffer lines
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // Aborted by client stop generation triggers
      onChunk({ done: true });
    } else {
      onChunk({ error: err.message || 'Error executing stream parser' });
    }
  }
};

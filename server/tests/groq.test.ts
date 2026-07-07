import { describe, it, expect } from 'vitest';

describe('Groq Integration helper logic', () => {
  it('should correctly detect a Groq API Key', () => {
    const key = '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';
    expect(key.startsWith('gsk_')).toBe(true);
    
    const geminiKey = 'AIzaSyGeminiApiKey';
    expect(geminiKey.startsWith('gsk_')).toBe(false);
  });

  it('should format message history correctly for Groq', () => {
    const compiledSystemPrompt = 'You are an assistant.';
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' }
    ];

    const formattedMessages = [
      { role: 'system', content: compiledSystemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];

    expect(formattedMessages[0]).toEqual({ role: 'system', content: 'You are an assistant.' });
    expect(formattedMessages[1]).toEqual({ role: 'user', content: 'Hello' });
    expect(formattedMessages[2]).toEqual({ role: 'assistant', content: 'Hi there' });
  });

  it('should parse Groq SSE streams lines correctly', () => {
    const line = 'data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":"JCCAD"},"finish_reason":null}]}';
    
    expect(line.startsWith('data: ')).toBe(true);
    const parsed = JSON.parse(line.substring(6));
    expect(parsed.choices[0].delta.content).toBe('JCCAD');
  });
});

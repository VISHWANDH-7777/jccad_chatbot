export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Array<{
    citationIndex: number;
    sourceName: string;
    version: number;
  }>;
}

export interface ConversationThread {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface LLMConfig {
  provider: 'OpenAI' | 'Anthropic' | 'Local';
  modelName: string;
  temperature: number;
  maxTokens: number;
}

export interface PromptTemplate {
  name: string;
  version: number;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
}

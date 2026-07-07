export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface FeedbackPayload {
  messageIndex: number;
  rating: 'up' | 'down';
  notes?: string;
}

export interface ImageUploadResponse {
  imageUrl: string;
  mimeType: string;
  size: number;
  ocrReady: boolean;
}

export interface ConversationExportData {
  conversationId: string;
  exportedAt: string;
  format: 'json' | 'pdf';
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

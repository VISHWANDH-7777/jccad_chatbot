import mongoose, { Schema, Document } from 'mongoose';
import { ChatMessage } from '../../../shared/types/orchestration';

export interface IConversationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  citations: [
    {
      citationIndex: { type: Number },
      sourceName: { type: String },
      version: { type: Number }
    }
  ]
});

const ConversationSchema: Schema<IConversationDocument> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    messages: [ChatMessageSchema]
  },
  {
    timestamps: true
  }
);

// Indexes
ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model<IConversationDocument>('Conversation', ConversationSchema);

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { ChatMessage } from '../../../shared/types/orchestration';
import { ConversationSummary, FeedbackPayload } from '../../../shared/types/conversation';
import { Conversation } from '../models/Conversation';
import { AuditLog } from '../models/AuditLog';

type PersistedConversation = {
  _id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

type PersistedAuditLog = {
  userId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  details?: string;
  timestamp: string;
};

type LocalStore = {
  localUserId: string;
  conversations: PersistedConversation[];
  auditLogs: PersistedAuditLog[];
};

const STORE_PATH = process.env.JCCAD_CHAT_STORE_PATH
  || (process.env.VERCEL ? '/tmp/chat-store.json' : path.join(process.cwd(), 'data', 'chat-store.json'));

const forceMongoInProduction = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

let storeCache: LocalStore | null = null;
let storeLoadPromise: Promise<LocalStore> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function createObjectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

function createEmptyStore(): LocalStore {
  return {
    localUserId: createObjectId(),
    conversations: [],
    auditLogs: []
  };
}

async function loadStore(): Promise<LocalStore> {
  if (storeCache) {
    return storeCache;
  }

  if (!storeLoadPromise) {
    storeLoadPromise = (async () => {
      try {
        const raw = await fs.readFile(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<LocalStore>;
        const hydrated: LocalStore = {
          localUserId: parsed.localUserId || createObjectId(),
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : []
        };
        storeCache = hydrated;
        return hydrated;
      } catch {
        const fresh = createEmptyStore();
        storeCache = fresh;
        return fresh;
      }
    })();
  }

  return storeLoadPromise;
}

export function isLocalFallbackEnabled(): boolean {
  return !forceMongoInProduction;
}

async function persistStore(store: LocalStore): Promise<void> {
  storeCache = store;
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
      const tempPath = `${STORE_PATH}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(store, null, 2), 'utf-8');
      await fs.rename(tempPath, STORE_PATH);
    } catch (err) {
      console.error('[CHAT_PERSISTENCE] Failed to persist local store:', err);
      if (process.env.VERCEL) {
        // Serverless filesystems can be ephemeral or read-only; keep the in-memory cache alive.
        return;
      }
      throw err;
    }
  });
  await writeQueue;
}

function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function normalizeConversation(doc: any): PersistedConversation {
  const conversation = doc.toObject ? doc.toObject() : doc;
  return {
    _id: conversation._id.toString(),
    userId: conversation.userId.toString(),
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map((message: any) => ({
          role: message.role,
          content: message.content,
          timestamp: new Date(message.timestamp).toISOString(),
          citations: message.citations
        }))
      : [],
    createdAt: new Date(conversation.createdAt || Date.now()).toISOString(),
    updatedAt: new Date(conversation.updatedAt || Date.now()).toISOString()
  };
}

function summarizeConversation(conversation: PersistedConversation): ConversationSummary {
  const firstMessage = conversation.messages.find((message) => message.role === 'user');
  const title = firstMessage ? `${firstMessage.content.substring(0, 30)}...` : 'New Chat Thread';
  return {
    id: conversation._id,
    title,
    updatedAt: conversation.updatedAt
  };
}

export async function getLocalDemoUserId(): Promise<string> {
  const store = await loadStore();
  return store.localUserId;
}

export async function ensureConversation(userId: string, conversationId?: string | null): Promise<PersistedConversation> {
  if (isMongoReady() || forceMongoInProduction) {
    if (!isMongoReady()) {
      throw new Error('MongoDB is required in production, but the connection is not ready');
    }

    if (conversationId) {
      const existing = await Conversation.findOne({ _id: conversationId, userId });
      if (existing) {
        return normalizeConversation(existing);
      }
    }

    const created = await Conversation.create({ userId, messages: [] });
    return normalizeConversation(created);
  }

  const store = await loadStore();
  if (conversationId) {
    const existing = store.conversations.find((conversation) => conversation._id === conversationId && conversation.userId === userId);
    if (existing) {
      return existing;
    }
  }

  const now = new Date().toISOString();
  const created: PersistedConversation = {
    _id: createObjectId(),
    userId,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
  store.conversations.unshift(created);
  await persistStore(store);
  return created;
}

export async function listConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  if (isMongoReady() || forceMongoInProduction) {
    if (!isMongoReady()) {
      throw new Error('MongoDB is required in production, but the connection is not ready');
    }

    const list = await Conversation.find({ userId })
      .select('id messages updatedAt')
      .sort({ updatedAt: -1 });

    return list.map((conversation) => {
      const firstMessage = conversation.messages.find((message: any) => message.role === 'user');
      const title = firstMessage ? `${firstMessage.content.substring(0, 30)}...` : 'New Chat Thread';
      return {
        id: conversation._id.toString(),
        title,
        updatedAt: conversation.updatedAt.toISOString()
      };
    });
  }

  const store = await loadStore();
  return store.conversations
    .filter((conversation) => conversation.userId === userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(summarizeConversation);
}

export async function listConversationHistory(userId: string): Promise<PersistedConversation[]> {
  if (isMongoReady() || forceMongoInProduction) {
    if (!isMongoReady()) {
      throw new Error('MongoDB is required in production, but the connection is not ready');
    }

    const history = await Conversation.find({ userId }).sort({ updatedAt: -1 });
    return history.map(normalizeConversation);
  }

  const store = await loadStore();
  return store.conversations
    .filter((conversation) => conversation.userId === userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function appendMessagesToConversation(
  userId: string,
  conversationId: string,
  messages: ChatMessage[]
): Promise<PersistedConversation | null> {
  if (isMongoReady() || forceMongoInProduction) {
    if (!isMongoReady()) {
      throw new Error('MongoDB is required in production, but the connection is not ready');
    }

    const updated = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      {
        $push: { messages: { $each: messages } },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    return updated ? normalizeConversation(updated) : null;
  }

  const store = await loadStore();
  const conversation = store.conversations.find((entry) => entry._id === conversationId && entry.userId === userId);
  if (!conversation) {
    return null;
  }

  conversation.messages.push(...messages);
  conversation.updatedAt = new Date().toISOString();
  await persistStore(store);
  return conversation;
}

export async function getConversationForUser(userId: string, conversationId: string): Promise<PersistedConversation | null> {
  if (isMongoReady() || forceMongoInProduction) {
    if (!isMongoReady()) {
      throw new Error('MongoDB is required in production, but the connection is not ready');
    }

    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    return conversation ? normalizeConversation(conversation) : null;
  }

  const store = await loadStore();
  return store.conversations.find((entry) => entry._id === conversationId && entry.userId === userId) || null;
}

export async function renameConversationForUser(userId: string, conversationId: string, title: string): Promise<boolean> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `System: Renamed thread to ${title}`,
    timestamp: new Date().toISOString()
  };

  if (isMongoReady() || forceMongoInProduction) {
    if (!isMongoReady()) {
      throw new Error('MongoDB is required in production, but the connection is not ready');
    }

    const updated = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      {
        $push: { messages: systemMessage },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );
    return Boolean(updated);
  }

  const store = await loadStore();
  const conversation = store.conversations.find((entry) => entry._id === conversationId && entry.userId === userId);
  if (!conversation) {
    return false;
  }

  conversation.messages.push(systemMessage);
  conversation.updatedAt = new Date().toISOString();
  await persistStore(store);
  return true;
}

export async function deleteConversationForUser(userId: string, conversationId: string): Promise<boolean> {
  if (isMongoReady() || forceMongoInProduction) {
    if (!isMongoReady()) {
      throw new Error('MongoDB is required in production, but the connection is not ready');
    }

    const result = await Conversation.deleteOne({ _id: conversationId, userId });
    return result.deletedCount > 0;
  }

  const store = await loadStore();
  const nextConversations = store.conversations.filter((conversation) => !(conversation._id === conversationId && conversation.userId === userId));
  if (nextConversations.length === store.conversations.length) {
    return false;
  }

  store.conversations = nextConversations;
  await persistStore(store);
  return true;
}

export async function recordConversationFeedback(
  userId: string,
  conversationId: string,
  payload: FeedbackPayload,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const details = `MsgIdx: ${payload.messageIndex}. Notes: ${payload.notes || 'None'}`;

  if (isMongoReady()) {
    await AuditLog.create({
      userId,
      action: `conversation:feedback_${payload.rating}`,
      resource: conversationId,
      ipAddress,
      userAgent,
      status: 'success',
      details
    });
    return;
  }

  const store = await loadStore();
  store.auditLogs.unshift({
    userId,
    action: `conversation:feedback_${payload.rating}`,
    resource: conversationId,
    ipAddress,
    userAgent,
    status: 'success',
    details,
    timestamp: new Date().toISOString()
  });
  await persistStore(store);
}

export async function recordAuditLog(entry: Omit<PersistedAuditLog, 'timestamp'>): Promise<void> {
  if (isMongoReady()) {
    await AuditLog.create({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      status: entry.status,
      details: entry.details
    });
    return;
  }

  const store = await loadStore();
  store.auditLogs.unshift({
    ...entry,
    timestamp: new Date().toISOString()
  });
  await persistStore(store);
}

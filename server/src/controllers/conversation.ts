import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { FeedbackPayload } from '../../../shared/types/conversation';
import fs from 'fs';
import {
  appendMessagesToConversation,
  deleteConversationForUser,
  ensureConversation,
  listConversationsForUser,
  recordAuditLog,
  recordConversationFeedback,
  renameConversationForUser
} from '../services/chatPersistence';

export const createConversation = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const conversation = await ensureConversation(user.id);
    return res.status(201).json({ conversation });
  } catch (err: any) {
    console.error('[CONVERSATION] createConversation failed:', err);
    return res.status(500).json({ error: 'Server error creating conversation' });
  }
};

export const listConversations = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const summaries = await listConversationsForUser(user.id);
    return res.status(200).json({ conversations: summaries });
  } catch (err: any) {
    console.error('[CONVERSATION] listConversations failed:', err);
    return res.status(500).json({ error: 'Server error listing conversations' });
  }
};

export const renameConversation = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title } = req.body;
  const user = req.user!;

  if (!title) {
    return res.status(400).json({ error: 'Title field is required' });
  }

  try {
    const updated = await renameConversationForUser(user.id, id, title);
    if (!updated) {
      return res.status(404).json({ error: 'Conversation thread not found' });
    }
    return res.status(200).json({ message: 'Conversation renamed successfully', title });
  } catch (err: any) {
    console.error('[CONVERSATION] renameConversation failed:', err);
    return res.status(500).json({ error: 'Server error during renaming' });
  }
};

export const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const deleted = await deleteConversationForUser(user.id, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    await recordAuditLog({
      userId: user.id,
      action: 'conversation:delete',
      resource: id,
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (err: any) {
    console.error('[CONVERSATION] deleteConversation failed:', err);
    return res.status(500).json({ error: 'Server error during deletion' });
  }
};

export const exportConversation = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  try {
    const conversation = await ensureConversation(user.id, id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const exportData = {
      conversationId: conversation._id,
      exportedAt: new Date().toISOString(),
      format: 'json',
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=conversation-${id}.json`);
    return res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during export' });
  }
};

export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { messageIndex, rating, notes } = req.body as FeedbackPayload;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const conversation = await ensureConversation(user.id, id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await recordConversationFeedback(user.id, id, { messageIndex, rating, notes }, ipAddress, userAgent);

    return res.status(200).json({ message: 'Feedback logged successfully' });
  } catch (err: any) {
    console.error('[CONVERSATION] submitFeedback failed:', err);
    return res.status(500).json({ error: 'Server error saving feedback' });
  }
};

export const uploadImage = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'Only PNG and JPEG formats are supported' });
  }

  try {
    await recordAuditLog({
      userId: user.id,
      action: 'conversation:image_upload',
      resource: file.originalname,
      ipAddress,
      userAgent,
      status: 'success',
      details: `Mime: ${file.mimetype}. Size: ${(file.size / 1024).toFixed(1)} KB`
    });

    return res.status(201).json({
      imageUrl: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      ocrReady: true
    });
  } catch (err: any) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    console.error('[CONVERSATION] uploadImage failed:', err);
    return res.status(500).json({ error: 'Server error processing image' });
  }
};
